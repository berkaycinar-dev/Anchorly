import { useCallback, useContext, useSyncExternalStore } from "react";
import { DataContext } from "./DataContext";

function combineStatuses(statuses) {
  if (statuses.includes("error")) {
    return "error";
  }

  return statuses.includes("loading") ? "loading" : "ready";
}

export default function useDataStatus() {
  const context = useContext(DataContext);

  if (context === null) {
    throw new Error("useDataStatus must be used within a DataProvider");
  }

  const subscribe = useCallback(
    (listener) => {
      const unsubscribers = Object.values(context.repositories).map(
        (repository) => repository.subscribe(listener),
      );

      return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
    },
    [context],
  );

  const getSnapshot = useCallback(
    () =>
      combineStatuses(
        Object.values(context.repositories).map((repository) =>
          repository.getStatus(),
        ),
      ),
    [context],
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
