import { beforeEach, describe, it, expect, vi } from "vitest";
import {
  dismiss,
  getPrimaryIssueKind,
  getSnapshot,
  getStorageErrorKind,
  reportStorageError,
  subscribe,
} from "./storageStatus";

beforeEach(() => {
  dismiss();
});

describe("storageStatus", () => {
  it("starts with no issues", () => {
    expect(getSnapshot()).toEqual([]);
  });

  it("adds an issue and notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    reportStorageError({ key: "tasks", kind: "quota" });

    expect(getSnapshot()).toEqual([{ key: "tasks", kind: "quota" }]);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it("ignores a duplicate issue without notifying", () => {
    reportStorageError({ key: "tasks", kind: "quota" });
    const snapshotBefore = getSnapshot();

    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    reportStorageError({ key: "tasks", kind: "quota" });

    expect(getSnapshot()).toBe(snapshotBefore);
    expect(listener).not.toHaveBeenCalled();

    unsubscribe();
  });

  it("keeps issues with different keys or kinds separately", () => {
    reportStorageError({ key: "tasks", kind: "quota" });
    reportStorageError({ key: "routines", kind: "quota" });
    reportStorageError({ key: "tasks", kind: "read" });

    expect(getSnapshot()).toEqual([
      { key: "tasks", kind: "quota" },
      { key: "routines", kind: "quota" },
      { key: "tasks", kind: "read" },
    ]);
  });

  it("clears all issues and notifies on dismiss", () => {
    reportStorageError({ key: "tasks", kind: "quota" });
    reportStorageError({ key: "projects", kind: "read" });

    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    dismiss();

    expect(getSnapshot()).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it("does not notify on dismiss when there are no issues", () => {
    const snapshotBefore = getSnapshot();
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    dismiss();

    expect(getSnapshot()).toBe(snapshotBefore);
    expect(listener).not.toHaveBeenCalled();

    unsubscribe();
  });

  it("shows an issue again when it is reported after a dismiss", () => {
    reportStorageError({ key: "tasks", kind: "quota" });
    dismiss();

    reportStorageError({ key: "tasks", kind: "quota" });

    expect(getSnapshot()).toEqual([{ key: "tasks", kind: "quota" }]);
  });

  it("stops notifying a subscriber after it unsubscribes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    unsubscribe();
    reportStorageError({ key: "tasks", kind: "quota" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("returns null as the primary kind when there are no issues", () => {
    expect(getPrimaryIssueKind([])).toBeNull();
  });

  it("prefers unavailable over quota and read as the primary kind", () => {
    const issues = [
      { key: "tasks", kind: "read" },
      { key: "tasks", kind: "quota" },
      { key: "projects", kind: "unavailable" },
    ];

    expect(getPrimaryIssueKind(issues)).toBe("unavailable");
  });

  it("prefers quota over read as the primary kind", () => {
    const issues = [
      { key: "tasks", kind: "read" },
      { key: "tasks", kind: "quota" },
    ];

    expect(getPrimaryIssueKind(issues)).toBe("quota");
  });

  it("returns read as the primary kind when it is the only issue", () => {
    expect(getPrimaryIssueKind([{ key: "tasks", kind: "read" }])).toBe("read");
  });
});

describe("getStorageErrorKind", () => {
  it("returns quota for the QuotaExceededError name", () => {
    const error = new DOMException("Storage failure", "QuotaExceededError");

    expect(getStorageErrorKind(error)).toBe("quota");
  });

  it("returns quota for the Firefox quota error name", () => {
    const error = Object.assign(new Error("Storage failure"), {
      name: "NS_ERROR_DOM_QUOTA_REACHED",
    });

    expect(getStorageErrorKind(error)).toBe("quota");
  });

  it.each([22, 1014])("returns quota for the legacy code %i", (code) => {
    const error = Object.assign(new Error("Storage failure"), { code });

    expect(getStorageErrorKind(error)).toBe("quota");
  });

  it("returns unavailable for any other error", () => {
    expect(
      getStorageErrorKind(new DOMException("Denied", "SecurityError")),
    ).toBe("unavailable");
    expect(getStorageErrorKind(new Error("Unknown"))).toBe("unavailable");
  });

  it("returns unavailable when the error is not an object", () => {
    expect(getStorageErrorKind(undefined)).toBe("unavailable");
    expect(getStorageErrorKind(null)).toBe("unavailable");
    expect(getStorageErrorKind("failure")).toBe("unavailable");
  });
});
