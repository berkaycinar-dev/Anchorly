import { useEffect, useState, useSyncExternalStore } from "react";
import createLocalStore from "../data/local/createLocalStore";

export default function useLocalStorageState(key, fallback, transform) {
  const [store] = useState(() => createLocalStore(key, fallback, transform));
  const value = useSyncExternalStore(store.subscribe, store.getSnapshot);

  useEffect(() => {
    store.persistInitialState();
  }, [store]);

  return [value, store.set];
}