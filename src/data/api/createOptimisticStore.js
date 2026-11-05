import { QUEUED } from "../outbox/queued";

function ignore() {}

export default function createOptimisticStore({ initialState, load }) {
  const listeners = new Set();
  let status = "loading";
  let confirmed = initialState;
  let snapshot = initialState;
  let pending = [];
  let queue = Promise.resolve();
  let startPromise = null;
  let refreshPromise = null;
  let localVersion = 0;

  function publish() {
    const next = pending.reduce(
      (state, entry) => entry.apply(state),
      confirmed,
    );

    if (next !== snapshot) {
      snapshot = next;
    }

    listeners.forEach((listener) => listener());
  }

  function subscribe(listener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  function start() {
    if (!startPromise) {
      if (status === "error") {
        status = "loading";
        publish();
      }

      startPromise = load().then(
        (state) => {
          confirmed = state;
          status = "ready";
          publish();
        },
        () => {
          status = "error";
          startPromise = null;
          publish();
        },
      );
    }

    return startPromise;
  }

  function refresh() {
    if (status !== "ready") {
      return Promise.resolve();
    }

    if (!refreshPromise) {
      const versionAtStart = localVersion;

      const run = queue
        .then(() => load())
        .then((state) => {
          if (
            status !== "ready" ||
            localVersion !== versionAtStart ||
            JSON.stringify(state) === JSON.stringify(confirmed)
          ) {
            return;
          }

          confirmed = state;
          publish();
        })
        .catch(ignore)
        .then(() => {
          refreshPromise = null;
        });

      refreshPromise = run;
      queue = run;
    }

    return refreshPromise;
  }

  function mutate({ apply, send, settle = (state) => state }) {
    if (!send) {
      localVersion += 1;
      confirmed = apply(confirmed);
      publish();

      return Promise.resolve();
    }

    const entry = { apply };

    pending = [...pending, entry];
    publish();

    const request = queue.then(() => start()).then(send);

    queue = request.then(ignore, ignore);

    return request.then(
      (result) => {
        confirmed =
          result === QUEUED
            ? apply(confirmed)
            : settle(apply(confirmed), result);
        pending = pending.filter((other) => other !== entry);
        publish();
      },
      (error) => {
        pending = pending.filter((other) => other !== entry);
        publish();

        throw error;
      },
    );
  }

  return {
    getStatus: () => status,
    getSnapshot: () => snapshot,
    subscribe,
    start,
    refresh,
    mutate,
  };
}
