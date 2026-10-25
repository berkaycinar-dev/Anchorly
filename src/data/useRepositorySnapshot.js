import { useSyncExternalStore } from "react";
import useRepository from "./useRepository";

export default function useRepositorySnapshot(name) {
  const repository = useRepository(name);
  const snapshot = useSyncExternalStore(
    repository.subscribe,
    repository.getSnapshot,
  );

  return [snapshot, repository];
}