import { useEffect, useState } from "react";
import { reportStorageError } from "../lib/storageStatus";

const CORRUPT_KEY_SUFFIX = ":corrupt";

function isQuotaError(error) {
  return (
    error?.name === "QuotaExceededError" ||
    error?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error?.code === 22 ||
    error?.code === 1014
  );
}

function readStoredValue(key, fallback, transform) {
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

function backUpCorruptValue(key, raw) {
  try {
    localStorage.setItem(`${key}${CORRUPT_KEY_SUFFIX}`, raw);
  } catch (error) {
    console.warn(`Could not back up the corrupt "${key}" value.`, error);
  }
}

export default function useLocalStorageState(key, fallback, transform) {
  const [initialRead] = useState(() =>
    readStoredValue(key, fallback, transform),
  );
  const [value, setValue] = useState(() => initialRead.value);

  useEffect(() => {
    const { failure } = initialRead;

    if (!failure) {
      return;
    }

    if (failure.raw !== null) {
      backUpCorruptValue(key, failure.raw);
    }

    reportStorageError({ key, kind: failure.kind });
  }, [initialRead, key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Could not save "${key}" to localStorage.`, error);
      reportStorageError({
        key,
        kind: isQuotaError(error) ? "quota" : "unavailable",
      });
    }
  }, [key, value]);

  return [value, setValue];
}