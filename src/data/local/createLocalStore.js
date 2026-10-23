import { reportStorageError } from "./storageStatus";
import {
  backUpCorruptValue,
  readStoredValue,
  writeStoredValue,
} from "./storage";

export default function createLocalStore(key, fallback, transform) {
  const { value: initialValue, failure } = readStoredValue(
    key,
    fallback,
    transform,
  );
  let value = initialValue;
  const listeners = new Set();

  function getSnapshot() {
    return value;
  }

  function subscribe(listener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  function set(nextValueOrUpdater) {
    const nextValue =
      typeof nextValueOrUpdater === "function"
        ? nextValueOrUpdater(value)
        : nextValueOrUpdater;

    if (Object.is(nextValue, value)) {
      return;
    }

    value = nextValue;
    writeStoredValue(key, value);
    listeners.forEach((listener) => listener());
  }

  function persistInitialState() {
    if (failure) {
      if (failure.raw !== null) {
        backUpCorruptValue(key, failure.raw);
      }

      reportStorageError({ key, kind: failure.kind });
    }

    writeStoredValue(key, value);
  }

  return { getSnapshot, subscribe, set, persistInitialState };
}