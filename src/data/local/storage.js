import { getStorageErrorKind, reportStorageError } from "./storageStatus";

const CORRUPT_KEY_SUFFIX = ":corrupt";

export function readStoredValue(key, fallback, transform) {
  let saved;

  try {
    saved = localStorage.getItem(key);
  } catch (error) {
    console.warn(`Could not read "${key}" from localStorage.`, error);
    return { value: fallback, failure: { kind: "unavailable", raw: null } };
  }

  if (saved === null) {
    return { value: fallback, failure: null };
  }

  try {
    const parsed = JSON.parse(saved);
    return { value: transform ? transform(parsed) : parsed, failure: null };
  } catch (error) {
    console.warn(`Stored "${key}" is corrupt. Using the fallback.`, error);
    return { value: fallback, failure: { kind: "read", raw: saved } };
  }
}

export function backUpCorruptValue(key, raw) {
  try {
    localStorage.setItem(`${key}${CORRUPT_KEY_SUFFIX}`, raw);
  } catch (error) {
    console.warn(`Could not back up the corrupt "${key}" value.`, error);
  }
}

export function writeStoredValue(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save "${key}" to localStorage.`, error);
    reportStorageError({ key, kind: getStorageErrorKind(error) });
  }
}
