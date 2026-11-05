import { describe, it, expect, vi } from "vitest";
import createOptimisticStore from "./createOptimisticStore";

function flush() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function createReadyStore(initial, load) {
  const store = createOptimisticStore({
    initialState: [],
    load: load ?? vi.fn(() => Promise.resolve(initial)),
  });

  return store;
}

describe("optimistic store refresh", () => {
  it("replaces the confirmed state with what the server has now", async () => {
    const results = [["a"], ["a", "b"]];
    const store = createReadyStore(null, () =>
      Promise.resolve(results.shift()),
    );
    await store.start();
    const listener = vi.fn();
    store.subscribe(listener);

    await store.refresh();

    expect(store.getSnapshot()).toEqual(["a", "b"]);
    expect(listener).toHaveBeenCalled();
  });

  it("keeps the same snapshot and stays quiet when nothing changed", async () => {
    const store = createReadyStore(["a"]);
    await store.start();
    const before = store.getSnapshot();
    const listener = vi.fn();
    store.subscribe(listener);

    await store.refresh();

    expect(store.getSnapshot()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });

  it("does nothing before the first load has finished", async () => {
    const load = vi.fn(() => Promise.resolve(["a"]));
    const store = createReadyStore(null, load);

    await store.refresh();

    expect(load).not.toHaveBeenCalled();
    expect(store.getStatus()).toBe("loading");
  });

  it("does nothing while the store is in error", async () => {
    const load = vi.fn(() => Promise.reject(new Error("offline")));
    const store = createReadyStore(null, load);
    await store.start();

    await store.refresh();

    expect(load).toHaveBeenCalledTimes(1);
    expect(store.getStatus()).toBe("error");
  });

  it("ignores a failed refresh and keeps the data and status", async () => {
    let attempt = 0;
    const store = createReadyStore(null, () => {
      attempt += 1;

      return attempt === 1
        ? Promise.resolve(["a"])
        : Promise.reject(new Error("offline"));
    });
    await store.start();

    await expect(store.refresh()).resolves.toBeUndefined();

    expect(store.getStatus()).toBe("ready");
    expect(store.getSnapshot()).toEqual(["a"]);
  });

  it("shares one request between refreshes that overlap", async () => {
    let release;
    let attempt = 0;
    const load = vi.fn(() => {
      attempt += 1;

      return attempt === 1
        ? Promise.resolve(["a"])
        : new Promise((resolve) => {
            release = () => resolve(["b"]);
          });
    });
    const store = createReadyStore(null, load);
    await store.start();

    const first = store.refresh();
    const second = store.refresh();
    await Promise.resolve();
    release();
    await Promise.all([first, second]);

    expect(load).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot()).toEqual(["b"]);
  });

  it("can refresh again after a refresh has finished", async () => {
    const load = vi.fn(() => Promise.resolve(["a"]));
    const store = createReadyStore(null, load);
    await store.start();

    await store.refresh();
    await store.refresh();

    expect(load).toHaveBeenCalledTimes(3);
  });

  it("keeps a change made while loading on top of the refreshed state", async () => {
    let release;
    let attempt = 0;
    const store = createReadyStore(null, () => {
      attempt += 1;

      return attempt === 1
        ? Promise.resolve(["a"])
        : new Promise((resolve) => {
            release = () => resolve(["a", "server"]);
          });
    });
    await store.start();

    const refreshing = store.refresh();
    await flush();
    const pending = store.mutate({
      apply: (items) => [...items, "local"],
      send: () => Promise.resolve(),
    });
    release();
    await refreshing;

    expect(store.getSnapshot()).toEqual(["a", "server", "local"]);
    await pending;
  });

  it("loads only after the changes already sent have finished", async () => {
    const order = [];
    let attempt = 0;
    let release;
    const store = createReadyStore(null, () => {
      attempt += 1;

      if (attempt > 1) {
        order.push("load");
      }

      return Promise.resolve(["a"]);
    });
    await store.start();

    const pending = store.mutate({
      apply: (items) => items,
      send: () =>
        new Promise((resolve) => {
          release = () => {
            order.push("sent");
            resolve();
          };
        }),
    });
    await flush();
    const refreshing = store.refresh();
    await flush();
    release();
    await Promise.all([pending, refreshing]);

    expect(order).toEqual(["sent", "load"]);
  });

  it("does not overwrite a local-only change made while loading", async () => {
    let release;
    let attempt = 0;
    const store = createReadyStore(null, () => {
      attempt += 1;

      return attempt === 1
        ? Promise.resolve(["a"])
        : new Promise((resolve) => {
            release = () => resolve(["a", "server"]);
          });
    });
    await store.start();

    const refreshing = store.refresh();
    await Promise.resolve();
    await store.mutate({ apply: (items) => [...items, "local"] });
    release();
    await refreshing;

    expect(store.getSnapshot()).toEqual(["a", "local"]);
  });
});
