import { describe, it, expect, vi } from "vitest";
import createOptimisticStore from "./createOptimisticStore";

describe("optimistic store", () => {
  it("applies a change without a request when there is nothing to send", async () => {
    const store = createOptimisticStore({
      initialState: [],
      load: () => Promise.resolve([]),
    });
    await store.start();
    const listener = vi.fn();
    store.subscribe(listener);

    await store.mutate({ apply: (items) => [...items, "local"] });

    expect(store.getSnapshot()).toEqual(["local"]);
    expect(listener).toHaveBeenCalled();
  });

  it("keeps a pending change on top of the state that finishes loading", async () => {
    let finishLoading;
    const store = createOptimisticStore({
      initialState: [],
      load: () =>
        new Promise((resolve) => {
          finishLoading = () => resolve(["server"]);
        }),
    });
    const pending = store.mutate({
      apply: (items) => [...items, "local"],
      send: () => Promise.resolve(),
    });

    store.start();
    finishLoading();
    await pending;

    expect(store.getSnapshot()).toEqual(["server", "local"]);
  });
});
