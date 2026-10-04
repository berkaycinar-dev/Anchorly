import { useEffect, useState } from "react";

function readStoredValue(key, fallback, transform) {
  const saved = localStorage.getItem(key);

  if (saved === null) {
    return fallback;
  }

  let parsed;

  try {
    parsed = JSON.parse(saved);
  } catch {
    // Eski sürümde düz string olarak kaydedilmiş değerler (örn. purple) için
    parsed = saved;
  }

  return transform ? transform(parsed) : parsed;
}

export default function useLocalStorageState(key, fallback, transform) {
  const [value, setValue] = useState(() =>
    readStoredValue(key, fallback, transform),
  );

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}