import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi } from "vitest";
import useLocalStorageState from "./useLocalStorageState";
import { getSnapshot } from "../lib/storageStatus";

function createStorageError(name) {
  return new DOMException("Storage failure", name);
}

function mockSetItemToThrow(error) {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw error;
  });
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("useLocalStorageState", () => {
  it("returns the fallback when nothing is stored", () => {
    const { result } = renderHook(() =>
      useLocalStorageState("tasks", ["fallback"]),
    );

    expect(result.current[0]).toEqual(["fallback"]);
  });

  it("returns the stored value when it is valid JSON", () => {
    localStorage.setItem("tasks", JSON.stringify(["stored"]));

    const { result } = renderHook(() =>
      useLocalStorageState("tasks", ["fallback"]),
    );

    expect(result.current[0]).toEqual(["stored"]);
  });

  it("applies the transform to the stored value", () => {
    localStorage.setItem("tasks", JSON.stringify([1, 2]));

    const { result } = renderHook(() =>
      useLocalStorageState("tasks", [], (stored) =>
        stored.map((item) => item * 10),
      ),
    );

    expect(result.current[0]).toEqual([10, 20]);
  });

  it("writes the value to storage when it changes", () => {
    const { result } = renderHook(() =>
      useLocalStorageState("tasks", ["fallback"]),
    );

    act(() => {
      result.current[1](["updated"]);
    });

    expect(JSON.parse(localStorage.getItem("tasks"))).toEqual(["updated"]);
  });

  it("does not report or back up anything when the stored value is valid", () => {
    localStorage.setItem("tasks", JSON.stringify(["stored"]));

    renderHook(() => useLocalStorageState("tasks", ["fallback"]));

    expect(getSnapshot()).toEqual([]);
    expect(localStorage.getItem("tasks:corrupt")).toBeNull();
  });

  it("returns the fallback when the stored JSON is corrupt", () => {
    localStorage.setItem("tasks", "{broken");

    const { result } = renderHook(() =>
      useLocalStorageState("tasks", ["fallback"]),
    );

    expect(result.current[0]).toEqual(["fallback"]);
  });

  it("keeps a copy of corrupt JSON under the corrupt key", () => {
    localStorage.setItem("tasks", "{broken");

    renderHook(() => useLocalStorageState("tasks", ["fallback"]));

    expect(localStorage.getItem("tasks:corrupt")).toBe("{broken");
    expect(JSON.parse(localStorage.getItem("tasks"))).toEqual(["fallback"]);
  });

  it("reports a read issue when the stored JSON is corrupt", () => {
    localStorage.setItem("tasks", "{broken");

    renderHook(() => useLocalStorageState("tasks", ["fallback"]));

    expect(getSnapshot()).toEqual([{ key: "tasks", kind: "read" }]);
  });

  it("returns the fallback when the transform throws", () => {
    localStorage.setItem("tasks", JSON.stringify({ not: "an array" }));

    const { result } = renderHook(() =>
      useLocalStorageState("tasks", ["fallback"], (stored) =>
        stored.map((item) => item),
      ),
    );

    expect(result.current[0]).toEqual(["fallback"]);
  });

  it("backs up the data and reports a read issue when the transform throws", () => {
    const rawValue = JSON.stringify({ not: "an array" });
    localStorage.setItem("tasks", rawValue);

    renderHook(() =>
      useLocalStorageState("tasks", ["fallback"], (stored) =>
        stored.map((item) => item),
      ),
    );

    expect(localStorage.getItem("tasks:corrupt")).toBe(rawValue);
    expect(getSnapshot()).toEqual([{ key: "tasks", kind: "read" }]);
  });

  it("returns the fallback when reading storage throws SecurityError", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw createStorageError("SecurityError");
    });

    const { result } = renderHook(() =>
      useLocalStorageState("tasks", ["fallback"]),
    );

    expect(result.current[0]).toEqual(["fallback"]);
  });

  it("reports an unavailable issue when reading storage throws SecurityError", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw createStorageError("SecurityError");
    });

    renderHook(() => useLocalStorageState("tasks", ["fallback"]));

    expect(getSnapshot()).toEqual([{ key: "tasks", kind: "unavailable" }]);
  });

  it("keeps working in memory when writing throws QuotaExceededError", () => {
    mockSetItemToThrow(createStorageError("QuotaExceededError"));

    const { result } = renderHook(() =>
      useLocalStorageState("tasks", ["fallback"]),
    );

    act(() => {
      result.current[1](["updated"]);
    });

    expect(result.current[0]).toEqual(["updated"]);
  });

  it.each([
    ["the QuotaExceededError name", createStorageError("QuotaExceededError")],
    [
      "the legacy code 22",
      Object.assign(new Error("Storage failure"), { code: 22 }),
    ],
    [
      "the Firefox code 1014",
      Object.assign(new Error("Storage failure"), { code: 1014 }),
    ],
  ])("reports a quota issue for %s", (_label, error) => {
    mockSetItemToThrow(error);

    renderHook(() => useLocalStorageState("tasks", ["fallback"]));

    expect(getSnapshot()).toEqual([{ key: "tasks", kind: "quota" }]);
  });

  it("reports an unavailable issue when writing throws another error", () => {
    mockSetItemToThrow(createStorageError("SecurityError"));

    renderHook(() => useLocalStorageState("tasks", ["fallback"]));

    expect(getSnapshot()).toEqual([{ key: "tasks", kind: "unavailable" }]);
  });
});
