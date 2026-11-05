import { ApiError, isUnreachable } from "../api/ApiError";
import { QUEUED } from "./queued";
import { readOutbox, writeOutbox } from "./outboxStorage";

export const CLIENT_TIME_HEADER = "X-Client-Time";
export const RETRY_INTERVAL_MS = 15000;

const QUEUEABLE_PATH = /^\/(tasks|projects|routines|me\/settings)(\/|$)/;
const DONE_STATUSES = [404, 409];

function isQueueable(method, path) {
  return method !== "GET" && QUEUEABLE_PATH.test(path);
}

function shouldRetryLater(error) {
  return (
    error instanceof ApiError &&
    (error.status === 401 || error.status === 429 || error.status >= 500)
  );
}

function byTime(first, second) {
  return first.time < second.time ? -1 : first.time > second.time ? 1 : 0;
}

export default function createOutbox({
  client,
  userId,
  now = () => new Date(),
  onSynced = () => {},
  onDropped = () => {},
}) {
  const listeners = new Set();
  let entries = readOutbox(userId);
  let offline = false;
  let snapshot = { pending: entries.length, offline };
  let flushing = null;
  let timer = null;
  let active = false;

  function updateTimer() {
    const needed = active && entries.length > 0;

    if (needed && timer === null) {
      timer = setInterval(() => {
        flush();
      }, RETRY_INTERVAL_MS);
    }

    if (!needed && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function publish() {
    if (snapshot.pending !== entries.length || snapshot.offline !== offline) {
      snapshot = { pending: entries.length, offline };
    }

    updateTimer();
    listeners.forEach((listener) => listener());
  }

  function setOffline(value) {
    if (offline !== value) {
      offline = value;
      publish();
    }
  }

  function save(next) {
    entries = next;
    writeOutbox(userId, entries);
    publish();
  }

  function enqueue(entry) {
    save([...entries, entry].sort(byTime));
  }

  function remove(entry) {
    save(entries.filter((other) => other !== entry));
  }

  async function drain() {
    let sent = 0;

    while (entries.length > 0) {
      const entry = entries[0];

      try {
        await client.request(entry.method, entry.path, {
          body: entry.body,
          headers: { [CLIENT_TIME_HEADER]: entry.time },
        });
      } catch (error) {
        if (isUnreachable(error)) {
          setOffline(true);
          break;
        }

        if (shouldRetryLater(error)) {
          break;
        }

        if (!(
          error instanceof ApiError && DONE_STATUSES.includes(error.status)
        )) {
          onDropped(error);
        }
      }

      sent += 1;
      setOffline(false);
      remove(entry);
    }

    if (sent > 0 && entries.length === 0) {
      onSynced();
    }
  }

  function flush() {
    if (!flushing) {
      flushing = drain().finally(() => {
        flushing = null;
      });
    }

    return flushing;
  }

  async function request(method, path, options = {}) {
    if (!isQueueable(method, path)) {
      return client.request(method, path, options);
    }

    const time = now().toISOString();
    const entry = { method, path, body: options.body, time };

    if (entries.length > 0) {
      enqueue(entry);
      flush();

      return QUEUED;
    }

    try {
      const result = await client.request(method, path, {
        ...options,
        headers: { ...options.headers, [CLIENT_TIME_HEADER]: time },
      });

      setOffline(false);

      return result;
    } catch (error) {
      if (!isUnreachable(error)) {
        throw error;
      }

      setOffline(true);
      enqueue(entry);

      return QUEUED;
    }
  }

  function handleOnline() {
    flush();
  }

  function activate() {
    if (active) {
      return;
    }

    active = true;
    window.addEventListener("online", handleOnline);
    updateTimer();
  }

  function deactivate() {
    active = false;
    window.removeEventListener("online", handleOnline);
    updateTimer();
  }

  return {
    client: { ...client, request },
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    flush,
    activate,
    deactivate,
  };
}
