import { DEFAULT_SETTINGS, THEMES } from "../../constants/settings";
import combineLocalStores from "./combineLocalStores";
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
  const combined = combineLocalStores(stores);

  function start() {
    combined.persistInitialState();
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

    return Promise.resolve(combined.getSnapshot());
  }

  return {
    getStatus: () => "ready",
    getSnapshot: combined.getSnapshot,
    subscribe: combined.subscribe,
    start,
    update,
  };
}
