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

  it("goes back to loading while a failed load is retried", async () => {
    let attempt = 0;
    let finishRetry;
    const store = createOptimisticStore({
      initialState: [],
      load: () => {
        attempt += 1;

        if (attempt === 1) {
          return Promise.reject(new Error("offline"));
        }

        return new Promise((resolve) => {
          finishRetry = () => resolve(["server"]);
        });
      },
    });
    await store.start();
    expect(store.getStatus()).toBe("error");

    const retry = store.start();

    expect(store.getStatus()).toBe("loading");
    finishRetry();
    await retry;

    expect(store.getStatus()).toBe("ready");
    expect(store.getSnapshot()).toEqual(["server"]);
  });
});
