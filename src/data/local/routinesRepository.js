import { initialRoutines } from "../../constants/initialData";
import {
  getRoutineIdFromKey,
  getRoutineKeyForDate,
  parseLocalDate,
} from "../../utils/dateHelpers";
import combineLocalStores from "./combineLocalStores";
import createLocalStore from "./createLocalStore";

export default function createLocalRoutinesRepository() {
  const routinesStore = createLocalStore("routines", initialRoutines);
  const checksStore = createLocalStore("routineChecks", {});
  const combined = combineLocalStores({
    routines: routinesStore,
    checks: checksStore,
  });

  function start() {
    combined.persistInitialState();
    return Promise.resolve();
  }

  function create(routine) {
    routinesStore.set((currentRoutines) => [...currentRoutines, routine]);
    return Promise.resolve(routine);
  }

  function remove(id) {
    routinesStore.set((currentRoutines) =>
      currentRoutines.filter((routine) => routine.id !== id),
    );
    checksStore.set((currentChecks) =>
      Object.fromEntries(
        Object.entries(currentChecks).filter(
          ([key]) => getRoutineIdFromKey(key) !== id,
        ),
      ),
    );
    return Promise.resolve();
  }

  function setCheck(routineId, date, checked) {
    const key = getRoutineKeyForDate(routineId, parseLocalDate(date));

    checksStore.set((currentChecks) => ({ ...currentChecks, [key]: checked }));
    return Promise.resolve();
  }

  return {
    getStatus: () => "ready",
    getSnapshot: combined.getSnapshot,
    subscribe: combined.subscribe,
    start,
    create,
    remove,
    setCheck,
  };
}
