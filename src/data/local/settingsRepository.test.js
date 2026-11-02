import { describe, it, expect, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../../constants/settings";
import { runSettingsRepositoryContract } from "../contracts/settingsRepository.contract";
import { getSnapshot as getStorageIssues } from "./storageStatus";
import createLocalSettingsRepository from "./settingsRepository";

function createSeededRepository(settings) {
  Object.entries(settings).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value));
  });

  return createLocalSettingsRepository();
}

runSettingsRepositoryContract("local", createSeededRepository);

describe("local settings repository", () => {
  it("uses the default settings on the first launch", () => {
    const repository = createLocalSettingsRepository();

    expect(repository.getSnapshot()).toEqual(DEFAULT_SETTINGS);
  });

  it("writes every setting under its own key when it starts", async () => {
    const repository = createLocalSettingsRepository();

    await repository.start();

    Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
      expect(localStorage.getItem(key)).toBe(JSON.stringify(value));
    });
  });

  it("saves a changed setting under its own key in JSON format", async () => {
    const repository = createLocalSettingsRepository();

    await repository.update({ language: "en" });

    expect(localStorage.getItem("language")).toBe('"en"');
  });

  it("does not rewrite the settings that did not change", async () => {
    const repository = createLocalSettingsRepository();
    await repository.start();
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    await repository.update({ theme: "green" });

    expect(setItem).toHaveBeenCalledTimes(1);
    expect(setItem).toHaveBeenCalledWith("theme", '"green"');
  });

  it("keeps a stored black theme", () => {
    localStorage.setItem("theme", JSON.stringify("black"));

    const repository = createLocalSettingsRepository();

    expect(repository.getSnapshot().theme).toBe("black");
  });

  it("replaces an unknown stored theme with the default theme", () => {
    localStorage.setItem("theme", JSON.stringify("orange"));

    const repository = createLocalSettingsRepository();

    expect(repository.getSnapshot().theme).toBe("gray");
  });

  it("keeps the other settings when one stored setting is corrupt", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem("language", JSON.stringify("en"));
    localStorage.setItem("fontFamily", "{broken");
    const repository = createLocalSettingsRepository();

    await repository.start();

    expect(repository.getSnapshot()).toMatchObject({
      language: "en",
      fontFamily: DEFAULT_SETTINGS.fontFamily,
    });
    expect(getStorageIssues()).toEqual([{ key: "fontFamily", kind: "read" }]);
  });

  it("keeps a valid stored dashboard layout", () => {
    localStorage.setItem(
      "dashboardLayout",
      JSON.stringify([{ id: "projects", size: "wide" }]),
    );

    const repository = createLocalSettingsRepository();

    expect(repository.getSnapshot().dashboardLayout).toEqual([
      { id: "projects", size: "wide" },
    ]);
  });

  it("drops unknown, duplicate and malformed dashboard cards", () => {
    localStorage.setItem(
      "dashboardLayout",
      JSON.stringify([
        { id: "projects", size: "wide" },
        { id: "weather", size: "small" },
        { id: "projects", size: "small" },
        { id: "calendar", size: "huge" },
        null,
        { id: "streaks", size: "small", extra: true },
      ]),
    );

    const repository = createLocalSettingsRepository();

    expect(repository.getSnapshot().dashboardLayout).toEqual([
      { id: "projects", size: "wide" },
      { id: "streaks", size: "small" },
    ]);
  });

  it("falls back to the default dashboard layout when the stored one is not a list", () => {
    localStorage.setItem("dashboardLayout", JSON.stringify({ id: "x" }));

    const repository = createLocalSettingsRepository();

    expect(repository.getSnapshot().dashboardLayout).toEqual(
      DEFAULT_SETTINGS.dashboardLayout,
    );
  });

  it("rejects a setting name that only exists on the object prototype", async () => {
    const repository = createLocalSettingsRepository();

    await expect(repository.update({ toString: "x" })).rejects.toThrow(
      'Unknown setting "toString"',
    );
  });
});
