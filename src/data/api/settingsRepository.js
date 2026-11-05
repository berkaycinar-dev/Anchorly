import { DEFAULT_SETTINGS } from "../../constants/settings";
import { normalizeSettings } from "../settingsTransforms";

const SETTINGS_PATH = "/me/settings";

function ignore() {}

export default function createApiSettingsRepository({ client }) {
  const listeners = new Set();
  let status = "loading";
  let confirmed = normalizeSettings(DEFAULT_SETTINGS);
  let snapshot = confirmed;
  let pending = [];
  let queue = Promise.resolve();
  let startPromise = null;

  function publish() {
    const next = pending.reduce(
      (settings, entry) => ({ ...settings, ...entry.patch }),
      confirmed,
    );

    if (JSON.stringify(next) !== JSON.stringify(snapshot)) {
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
      startPromise = client.request("GET", SETTINGS_PATH).then(
        (serverSettings) => {
          confirmed = normalizeSettings(serverSettings);
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

  function update(patch) {
    const unknownKey = Object.keys(patch).find(
      (key) => !Object.hasOwn(DEFAULT_SETTINGS, key),
    );

    if (unknownKey) {
      return Promise.reject(new Error(`Unknown setting "${unknownKey}"`));
    }

    if (Object.keys(patch).length === 0) {
      return Promise.resolve(snapshot);
    }

    const entry = { patch };

    pending = [...pending, entry];
    publish();

    const request = queue
      .then(() => start())
      .then(() => client.request("PATCH", SETTINGS_PATH, { body: patch }));

    queue = request.then(ignore, ignore);

    return request.then(
      (serverSettings) => {
        confirmed = normalizeSettings(serverSettings);
        pending = pending.filter((other) => other !== entry);
        publish();

        return snapshot;
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
    update,
  };
}
