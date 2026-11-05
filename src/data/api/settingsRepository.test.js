import { describe, it, expect, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../../constants/settings";
import createFakeApiClient from "../../test/fakeApiClient";
import { runSettingsRepositoryContract } from "../contracts/settingsRepository.contract";
import { ApiError } from "./ApiError";
import createApiSettingsRepository from "./settingsRepository";

const SERVER_SETTINGS = {
  theme: "blue",
  language: "en",
  fontFamily: "Poppins",
  weekStartDay: "sunday",
  dashboardLayout: [{ id: "calendar", size: "wide" }],
};

function createSubject(settings = SERVER_SETTINGS) {
  const client = createFakeApiClient({ settings });
  const repository = createApiSettingsRepository({ client });

  return { client, repository };
}

function describeCalls(client) {
  return client.calls.map((call) => `${call.method} ${call.path}`);
}

function waitForRequests() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

runSettingsRepositoryContract(
  "api",
  (settings) => createSubject(settings).repository,
);

describe("api settings repository", () => {
  it("starts loading with the default settings", () => {
    const { repository } = createSubject();

    expect(repository.getStatus()).toBe("loading");
    expect(repository.getSnapshot()).toEqual(DEFAULT_SETTINGS);
  });

  it("loads the settings from the server when it starts", async () => {
    const { client, repository } = createSubject();

    await repository.start();

    expect(repository.getStatus()).toBe("ready");
    expect(repository.getSnapshot()).toEqual(SERVER_SETTINGS);
    expect(describeCalls(client)).toEqual(["GET /me/settings"]);
  });

  it("asks the server only once when it is started twice", async () => {
    const { client, repository } = createSubject();

    await Promise.all([repository.start(), repository.start()]);
    await repository.start();

    expect(describeCalls(client)).toEqual(["GET /me/settings"]);
  });

  it("notifies subscribers when loading finishes", async () => {
    const { repository } = createSubject();
    const listener = vi.fn();
    repository.subscribe(listener);

    await repository.start();

    expect(listener).toHaveBeenCalled();
  });

  it("replaces invalid server values with defaults", async () => {
    const { repository } = createSubject({
      ...SERVER_SETTINGS,
      theme: "orange",
      dashboardLayout: [
        { id: "nope", size: "wide" },
        { id: "streaks", size: "small" },
      ],
    });

    await repository.start();

    expect(repository.getSnapshot().theme).toBe(DEFAULT_SETTINGS.theme);
    expect(repository.getSnapshot().dashboardLayout).toEqual([
      { id: "streaks", size: "small" },
    ]);
  });

  it("fills settings missing from the server answer with defaults", async () => {
    const { repository } = createSubject({ theme: "blue" });

    await repository.start();

    expect(repository.getSnapshot()).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "blue",
    });
  });

  it("sends only the changed settings", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.update({ theme: "green" });

    expect(client.calls.at(-1)).toEqual({
      method: "PATCH",
      path: "/me/settings",
      body: { theme: "green" },
    });
    expect(client.getStoredSettings().theme).toBe("green");
  });

  it("sends nothing for an empty change", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.update({});

    expect(describeCalls(client)).toEqual(["GET /me/settings"]);
  });

  it("sends nothing for an unknown setting", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await expect(repository.update({ colour: "red" })).rejects.toThrow(
      'Unknown setting "colour"',
    );

    expect(describeCalls(client)).toEqual(["GET /me/settings"]);
  });

  it("rolls back a rejected change", async () => {
    const { client, repository } = createSubject();
    await repository.start();
    const listener = vi.fn();
    repository.subscribe(listener);
    client.failNext();

    await expect(repository.update({ theme: "green" })).rejects.toBeInstanceOf(
      ApiError,
    );

    expect(repository.getSnapshot()).toEqual(SERVER_SETTINGS);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("keeps a later change when an earlier one is rejected", async () => {
    const { client, repository } = createSubject();
    await repository.start();
    const release = client.holdNext();
    client.failNext();

    const first = repository.update({ theme: "green" }).then(
      () => null,
      (error) => error,
    );
    const second = repository.update({ language: "tr" });

    expect(repository.getSnapshot()).toMatchObject({
      theme: "green",
      language: "tr",
    });

    release();

    expect(await first).toBeInstanceOf(ApiError);
    await second;
    expect(repository.getSnapshot()).toMatchObject({
      theme: SERVER_SETTINGS.theme,
      language: "tr",
    });
  });

  it("sends changes one at a time in order", async () => {
    const { client, repository } = createSubject();
    await repository.start();
    const release = client.holdNext();

    const first = repository.update({ theme: "green" });
    const second = repository.update({ language: "tr" });
    await waitForRequests();

    expect(client.calls.filter((call) => call.method === "PATCH")).toHaveLength(
      1,
    );

    release();
    await Promise.all([first, second]);

    expect(
      client.calls
        .filter((call) => call.method === "PATCH")
        .map((call) => call.body),
    ).toEqual([{ theme: "green" }, { language: "tr" }]);
  });

  it("loads before it sends the first change", async () => {
    const { client, repository } = createSubject();

    await repository.update({ theme: "green" });

    expect(describeCalls(client)).toEqual([
      "GET /me/settings",
      "PATCH /me/settings",
    ]);
  });

  it("reports an error status when loading fails", async () => {
    const { client, repository } = createSubject();
    client.failNext();

    await repository.start();

    expect(repository.getStatus()).toBe("error");
    expect(repository.getSnapshot()).toEqual(DEFAULT_SETTINGS);
  });

  it("loads again when it is started after a failure", async () => {
    const { client, repository } = createSubject();
    client.failNext();
    await repository.start();

    await repository.start();

    expect(repository.getStatus()).toBe("ready");
    expect(repository.getSnapshot()).toEqual(SERVER_SETTINGS);
    expect(describeCalls(client)).toEqual([
      "GET /me/settings",
      "GET /me/settings",
    ]);
  });
});
