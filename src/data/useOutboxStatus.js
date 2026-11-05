import { useCallback, useContext, useSyncExternalStore } from "react";
import { DataContext } from "./DataContext";

const IDLE = { pending: 0, offline: false };

function subscribeToNothing() {
  return () => {};
}

export default function useOutboxStatus() {
  const context = useContext(DataContext);
  const outbox = context?.outbox ?? null;

  const subscribe = useCallback(
    (listener) => (outbox ? outbox.subscribe(listener) : subscribeToNothing()),
    [outbox],
  );
  const getSnapshot = useCallback(
    () => (outbox ? outbox.getSnapshot() : IDLE),
    [outbox],
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
