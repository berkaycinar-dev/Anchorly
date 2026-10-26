import { describe, it, expect, vi } from "vitest";
import combineLocalStores from "./combineLocalStores";
import createLocalStore from "./createLocalStore";

function setUp() {
  const first = createLocalStore("first", ["a"]);
  const second = createLocalStore("second", { b: true });
  const combined = combineLocalStores({ items: first, flags: second });

  return { first, second, combined };
}

describe("combineLocalStores", () => {
  it("returns the value of every store under its name", () => {
    const { combined } = setUp();

    expect(combined.getSnapshot()).toEqual({
      items: ["a"],
      flags: { b: true },
    });
  });

  it("returns the same object until one of the stores changes", () => {
    const { combined } = setUp();

    expect(combined.getSnapshot()).toBe(combined.getSnapshot());
  });

  it("returns a new object with the new value after a store changes", () => {
    const { first, combined } = setUp();
    const before = combined.getSnapshot();

    first.set(["a", "c"]);

    expect(combined.getSnapshot()).not.toBe(before);
    expect(combined.getSnapshot().items).toEqual(["a", "c"]);
  });

  it("keeps the unchanged values as the same objects", () => {
    const { first, combined } = setUp();
    const flagsBefore = combined.getSnapshot().flags;

    first.set(["a", "c"]);

    expect(combined.getSnapshot().flags).toBe(flagsBefore);
  });

  it("notifies subscribers when any store changes", () => {
    const { first, second, combined } = setUp();
    const listener = vi.fn();
    combined.subscribe(listener);

    first.set(["c"]);
    second.set({ b: false });

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("stops notifying a subscriber after it unsubscribes", () => {
    const { first, combined } = setUp();
    const listener = vi.fn();
    const unsubscribe = combined.subscribe(listener);

    unsubscribe();
    first.set(["c"]);

    expect(listener).not.toHaveBeenCalled();
  });

  it("writes the initial value of every store when it persists", () => {
    const { combined } = setUp();

    combined.persistInitialState();

    expect(localStorage.getItem("first")).toBe('["a"]');
    expect(localStorage.getItem("second")).toBe('{"b":true}');
  });
});
