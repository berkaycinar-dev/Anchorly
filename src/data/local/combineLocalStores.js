export default function combineLocalStores(stores) {
  const listeners = new Set();
  let snapshot = readSnapshot();

  function readSnapshot() {
    return Object.fromEntries(
      Object.entries(stores).map(([name, store]) => [
        name,
        store.getSnapshot(),
      ]),
    );
  }

  Object.values(stores).forEach((store) => {
    store.subscribe(() => {
      snapshot = readSnapshot();
      listeners.forEach((listener) => listener());
    });
  });

  function subscribe(listener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  function persistInitialState() {
    Object.values(stores).forEach((store) => store.persistInitialState());
  }

  return {
    getSnapshot: () => snapshot,
    subscribe,
    persistInitialState,
  };
}
