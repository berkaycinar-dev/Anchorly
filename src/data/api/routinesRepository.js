import {
  getRoutineIdFromKey,
  getRoutineKeyForDate,
  parseLocalDate,
} from "../../utils/dateHelpers";
import createOptimisticStore from "./createOptimisticStore";

const ROUTINES_PATH = "/routines";

function toCheckMap(checkRows) {
  return Object.fromEntries(
    checkRows.map(({ routineId, date, checked }) => [
      getRoutineKeyForDate(routineId, parseLocalDate(date)),
      checked,
    ]),
  );
}

export default function createApiRoutinesRepository({ client }) {
  const store = createOptimisticStore({
    initialState: { routines: [], checks: {} },
    load: async () => {
      const [routines, checkRows] = await Promise.all([
        client.request("GET", ROUTINES_PATH),
        client.request("GET", `${ROUTINES_PATH}/checks`),
      ]);

      return { routines, checks: toCheckMap(checkRows) };
    },
  });

  function findRoutine(id) {
    return (
      store.getSnapshot().routines.find((routine) => routine.id === id) ?? null
    );
  }

  function create(routine) {
    return store
      .mutate({
        apply: (state) => ({
          ...state,
          routines: [...state.routines, routine],
        }),
        send: () =>
          client.request("POST", ROUTINES_PATH, {
            body: { id: routine.id, title: routine.title },
          }),
        settle: (state, serverRoutine) => ({
          ...state,
          routines: state.routines.map((current) =>
            current.id === serverRoutine.id
              ? { ...current, ...serverRoutine }
              : current,
          ),
        }),
      })
      .then(() => findRoutine(routine.id));
  }

  function remove(id) {
    if (!findRoutine(id)) {
      return Promise.resolve();
    }

    return store.mutate({
      apply: (state) => ({
        routines: state.routines.filter((routine) => routine.id !== id),
        checks: Object.fromEntries(
          Object.entries(state.checks).filter(
            ([key]) => getRoutineIdFromKey(key) !== id,
          ),
        ),
      }),
      send: () => client.request("DELETE", `${ROUTINES_PATH}/${id}`),
    });
  }

  function setCheck(routineId, date, checked) {
    const key = getRoutineKeyForDate(routineId, parseLocalDate(date));

    return store.mutate({
      apply: (state) => ({
        ...state,
        checks: { ...state.checks, [key]: checked },
      }),
      send: () =>
        client.request("PUT", `${ROUTINES_PATH}/${routineId}/checks/${date}`, {
          body: { checked },
        }),
    });
  }

  return {
    getStatus: store.getStatus,
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    start: store.start,
    create,
    remove,
    setCheck,
  };
}
