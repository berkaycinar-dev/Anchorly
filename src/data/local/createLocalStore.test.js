import { beforeEach, describe, it, expect, vi } from "vitest";
import createLocalStore from "./createLocalStore";
import { getSnapshot as getStorageIssues } from "./storageStatus";

function createStorageError(name) {
  return new DOMException("Storage failure", name);
}

function mockSetItemToThrow(error) {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw error;
  });
}

function mapItems(stored) {
  return stored.map((item) => item);
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("createLocalStore reading", () => {
  it("returns the fallback when nothing is stored", () => {
    const store = createLocalStore("tasks", ["fallback"]);

    expect(store.getSnapshot()).toEqual(["fallback"]);
  });

  it("returns the stored value when it is valid JSON", () => {
    localStorage.setItem("tasks", JSON.stringify(["stored"]));

    const store = createLocalStore("tasks", ["fallback"]);

    expect(store.getSnapshot()).toEqual(["stored"]);
  });

  it("applies the transform to the stored value", () => {
    localStorage.setItem("tasks", JSON.stringify([1, 2]));

    const store = createLocalStore("tasks", [], (stored) =>
      stored.map((item) => item * 10),
    );

    expect(store.getSnapshot()).toEqual([10, 20]);
  });

  it("does not apply the transform to the fallback", () => {
    const transform = vi.fn(mapItems);

    createLocalStore("tasks", ["fallback"], transform);

    expect(transform).not.toHaveBeenCalled();
  });

  it("returns the fallback when the stored JSON is corrupt", () => {
    localStorage.setItem("tasks", "{broken");

    const store = createLocalStore("tasks", ["fallback"]);

    expect(store.getSnapshot()).toEqual(["fallback"]);
  });

  it("returns the fallback when the transform throws", () => {
    localStorage.setItem("tasks", JSON.stringify({ not: "an array" }));

    const store = createLocalStore("tasks", ["fallback"], mapItems);

    expect(store.getSnapshot()).toEqual(["fallback"]);
  });

  it("returns the fallback when reading storage throws SecurityError", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw createStorageError("SecurityError");
    });

    const store = createLocalStore("tasks", ["fallback"]);

    expect(store.getSnapshot()).toEqual(["fallback"]);
  });

  it("does not write, back up or report anything while it is created", () => {
    localStorage.setItem("tasks", "{broken");

    createLocalStore("tasks", ["fallback"]);

    expect(localStorage.getItem("tasks")).toBe("{broken");
    expect(localStorage.getItem("tasks:corrupt")).toBeNull();
    expect(getStorageIssues()).toEqual([]);
  });
});

describe("createLocalStore persistInitialState", () => {
  it("writes the first-launch fallback to storage", () => {
    const store = createLocalStore("tasks", ["fallback"]);

    store.persistInitialState();

    expect(JSON.parse(localStorage.getItem("tasks"))).toEqual(["fallback"]);
  });

  it("writes the transformed value back to storage", () => {
    localStorage.setItem("tasks", JSON.stringify([1, 2]));
    const store = createLocalStore("tasks", [], (stored) =>
      stored.map((item) => item * 10),
    );

    store.persistInitialState();

    expect(JSON.parse(localStorage.getItem("tasks"))).toEqual([10, 20]);
  });

  it("does not report or back up anything when the stored value is valid", () => {
    localStorage.setItem("tasks", JSON.stringify(["stored"]));
    const store = createLocalStore("tasks", ["fallback"]);

    store.persistInitialState();

    expect(getStorageIssues()).toEqual([]);
    expect(localStorage.getItem("tasks:corrupt")).toBeNull();
  });

  it("keeps a copy of corrupt JSON under the corrupt key", () => {
    localStorage.setItem("tasks", "{broken");
    const store = createLocalStore("tasks", ["fallback"]);

    store.persistInitialState();

    expect(localStorage.getItem("tasks:corrupt")).toBe("{broken");
    expect(JSON.parse(localStorage.getItem("tasks"))).toEqual(["fallback"]);
  });

  it("reports a read issue when the stored JSON is corrupt", () => {
    localStorage.setItem("tasks", "{broken");
    const store = createLocalStore("tasks", ["fallback"]);

    store.persistInitialState();

    expect(getStorageIssues()).toEqual([{ key: "tasks", kind: "read" }]);
  });

  it("backs up the data and reports a read issue when the transform throws", () => {
    const rawValue = JSON.stringify({ not: "an array" });
    localStorage.setItem("tasks", rawValue);
    const store = createLocalStore("tasks", ["fallback"], mapItems);

    store.persistInitialState();

    expect(localStorage.getItem("tasks:corrupt")).toBe(rawValue);
    expect(getStorageIssues()).toEqual([{ key: "tasks", kind: "read" }]);
  });

  it("reports an unavailable issue when reading storage throws SecurityError", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw createStorageError("SecurityError");
    });
    const store = createLocalStore("tasks", ["fallback"]);

    store.persistInitialState();

    expect(getStorageIssues()).toEqual([{ key: "tasks", kind: "unavailable" }]);
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
    const store = createLocalStore("tasks", ["fallback"]);
    mockSetItemToThrow(error);

    store.persistInitialState();

    expect(getStorageIssues()).toEqual([{ key: "tasks", kind: "quota" }]);
  });

  it("reports an unavailable issue when writing throws another error", () => {
    const store = createLocalStore("tasks", ["fallback"]);
    mockSetItemToThrow(createStorageError("SecurityError"));

    store.persistInitialState();

    expect(getStorageIssues()).toEqual([{ key: "tasks", kind: "unavailable" }]);
  });

  it("gives the same result when it runs twice", () => {
    localStorage.setItem("tasks", "{broken");
    const store = createLocalStore("tasks", ["fallback"]);

    store.persistInitialState();
    store.persistInitialState();

    expect(localStorage.getItem("tasks:corrupt")).toBe("{broken");
    expect(JSON.parse(localStorage.getItem("tasks"))).toEqual(["fallback"]);
    expect(getStorageIssues()).toEqual([{ key: "tasks", kind: "read" }]);
  });
});

describe("createLocalStore set", () => {
  it("writes the value to storage when it changes", () => {
    const store = createLocalStore("tasks", ["fallback"]);

    store.set(["updated"]);

    expect(store.getSnapshot()).toEqual(["updated"]);
    expect(JSON.parse(localStorage.getItem("tasks"))).toEqual(["updated"]);
  });

  it("passes the current value to an updater function", () => {
    const store = createLocalStore("tasks", ["first"]);

    store.set((current) => [...current, "second"]);
    store.set((current) => [...current, "third"]);

    expect(store.getSnapshot()).toEqual(["first", "second", "third"]);
  });

  it("notifies every subscriber after a change", () => {
    const store = createLocalStore("tasks", []);
    const firstListener = vi.fn();
    const secondListener = vi.fn();
    store.subscribe(firstListener);
    store.subscribe(secondListener);

    store.set(["updated"]);

    expect(firstListener).toHaveBeenCalledTimes(1);
    expect(secondListener).toHaveBeenCalledTimes(1);
  });

  it("stops notifying a subscriber after it unsubscribes", () => {
    const store = createLocalStore("tasks", []);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.set(["updated"]);

    expect(listener).not.toHaveBeenCalled();
  });

  it("does not write or notify when the value stays the same", () => {
    const store = createLocalStore("tasks", ["fallback"]);
    const listener = vi.fn();
    store.subscribe(listener);
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    store.set((current) => current);

    expect(listener).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("keeps working in memory when writing throws QuotaExceededError", () => {
    const store = createLocalStore("tasks", ["fallback"]);
    const listener = vi.fn();
    store.subscribe(listener);
    mockSetItemToThrow(createStorageError("QuotaExceededError"));

    store.set(["updated"]);

    expect(store.getSnapshot()).toEqual(["updated"]);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getStorageIssues()).toEqual([{ key: "tasks", kind: "quota" }]);
  });
});
