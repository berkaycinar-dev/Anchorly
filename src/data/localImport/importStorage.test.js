import { describe, expect, it, vi } from "vitest";
import {
  backUpAndClearLocalData,
  getImportDecision,
  setImportDecision,
} from "./importStorage";

describe("import decisions", () => {
  it("has no decision before one is made", () => {
    expect(getImportDecision("user-1")).toBeNull();
  });

  it("remembers a decision per user", () => {
    setImportDecision("user-1", "declined");

    expect(getImportDecision("user-1")).toBe("declined");
    expect(getImportDecision("user-2")).toBeNull();
  });

  it("does not fail when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(getImportDecision("user-1")).toBeNull();
    expect(() => setImportDecision("user-1", "declined")).not.toThrow();
  });
});

describe("backUpAndClearLocalData", () => {
  function fill() {
    localStorage.setItem("tasks", '[{"id":"t"}]');
    localStorage.setItem("projects", '[{"id":"p"}]');
    localStorage.setItem("routines", '[{"id":"r"}]');
    localStorage.setItem("routineChecks", '{"k":true}');
    localStorage.setItem("taskLocalFields", '{"t":{"attachments":[]}}');
    localStorage.setItem("language", '"en"');
  }

  it("backs up the four data keys and removes them", () => {
    fill();
    const now = new Date("2026-11-05T12:00:00.000Z");

    expect(backUpAndClearLocalData(now)).toBe(true);

    const backup = JSON.parse(
      localStorage.getItem("importBackup:2026-11-05T12:00:00.000Z"),
    );
    expect(backup.savedAt).toBe("2026-11-05T12:00:00.000Z");
    expect(backup.data).toEqual({
      tasks: '[{"id":"t"}]',
      projects: '[{"id":"p"}]',
      routines: '[{"id":"r"}]',
      routineChecks: '{"k":true}',
    });
    ["tasks", "projects", "routines", "routineChecks"].forEach((key) =>
      expect(localStorage.getItem(key)).toBeNull(),
    );
  });

  it("leaves attachments and settings alone", () => {
    fill();

    backUpAndClearLocalData();

    expect(localStorage.getItem("taskLocalFields")).toBe(
      '{"t":{"attachments":[]}}',
    );
    expect(localStorage.getItem("language")).toBe('"en"');
  });

  it("clears nothing when the backup cannot be written", () => {
    fill();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(backUpAndClearLocalData()).toBe(false);
    expect(localStorage.getItem("tasks")).toBe('[{"id":"t"}]');
  });
});
