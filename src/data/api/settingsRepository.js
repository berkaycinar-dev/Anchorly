import { DEFAULT_SETTINGS } from "../../constants/settings";
import { normalizeSettings } from "../settingsTransforms";
import createOptimisticStore from "./createOptimisticStore";

const SETTINGS_PATH = "/me/settings";

export default function createApiSettingsRepository({ client }) {
  const store = createOptimisticStore({
    initialState: normalizeSettings(DEFAULT_SETTINGS),
    load: async () =>
      normalizeSettings(await client.request("GET", SETTINGS_PATH)),
  });

  function update(patch) {
    const unknownKey = Object.keys(patch).find(
      (key) => !Object.hasOwn(DEFAULT_SETTINGS, key),
    );

    if (unknownKey) {
      return Promise.reject(new Error(`Unknown setting "${unknownKey}"`));
    }

    if (Object.keys(patch).length === 0) {
      return Promise.resolve(store.getSnapshot());
    }

    return store
      .mutate({
        apply: (settings) => ({ ...settings, ...patch }),
        send: () => client.request("PATCH", SETTINGS_PATH, { body: patch }),
        settle: (appliedSettings, serverSettings) =>
          normalizeSettings(serverSettings),
      })
      .then(() => store.getSnapshot());
  }

  return {
    getStatus: store.getStatus,
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    start: store.start,
    refresh: store.refresh,
    update,
  };
}
