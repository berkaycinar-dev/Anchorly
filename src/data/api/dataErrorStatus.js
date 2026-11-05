import { ApiError, NETWORK_ERROR, TIMEOUT } from "./ApiError";

let latest = { id: 0, kind: null };
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getDataErrorKind(error) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return null;
    }

    return error.code === NETWORK_ERROR || error.code === TIMEOUT
      ? "network"
      : "other";
  }

  return "other";
}

export function reportDataError(error) {
  const kind = getDataErrorKind(error);

  if (kind === null) {
    return;
  }

  latest = { id: latest.id + 1, kind };
  notify();
}

export function subscribe(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot() {
  return latest;
}
