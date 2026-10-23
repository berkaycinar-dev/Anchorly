import { DEFAULT_SETTINGS, THEMES } from "../../constants/settings";
import createLocalStore from "./createLocalStore";

const TRANSFORMS = {
  theme: (savedTheme) =>
    THEMES.includes(savedTheme) ? savedTheme : DEFAULT_SETTINGS.theme,
};

export default function createLocalSettingsRepository() {
  const stores = Object.fromEntries(
    Object.entries(DEFAULT_SETTINGS).map(([key, fallback]) => [
      key,
      createLocalStore(key, fallback, TRANSFORMS[key]),
    ]),
  );
  const listeners = new Set();
  let snapshot = readSettings();

  function readSettings() {
    return Object.fromEntries(
      Object.entries(stores).map(([key, store]) => [key, store.getSnapshot()]),
    );
  }

  Object.values(stores).forEach((store) => {
    store.subscribe(() => {
      snapshot = readSettings();
      listeners.forEach((listener) => listener());
    });
  });

  function subscribe(listener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  function start() {
    Object.values(stores).forEach((store) => store.persistInitialState());
    return Promise.resolve();
  }

  function update(patch) {
    const unknownKey = Object.keys(patch).find(
      (key) => !Object.hasOwn(stores, key),
    );

    if (unknownKey) {
      return Promise.reject(new Error(`Unknown setting "${unknownKey}"`));
    }

    Object.entries(patch).forEach(([key, value]) => {
      stores[key].set(value);
    });

    return Promise.resolve(snapshot);
  }

  return {
    getStatus: () => "ready",
    getSnapshot: () => snapshot,
    subscribe,
    start,
    update,
  };
}