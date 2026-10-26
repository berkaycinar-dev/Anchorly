import { createInitialTasks } from "../../constants/initialData";
import { addFutureOccurrences, applyTaskOrder } from "../../utils/taskHelpers";
import createLocalStore from "./createLocalStore";

function normalizeStoredTasks(storedTasks) {
  return storedTasks.map((task, index) => ({
    description: "",
    steps: [],
    completedAt: null,
    order: index,
    repeat: "none",
    repeatGroupId: null,
    attachments: [],
    ...task,
  }));
}

export default function createLocalTasksRepository({ today }) {
  const store = createLocalStore(
    "tasks",
    createInitialTasks(today),
    (storedTasks) =>
      addFutureOccurrences(normalizeStoredTasks(storedTasks), today),
  );

  function start() {
    store.persistInitialState();
    return Promise.resolve();
  }

  function create(task) {
    store.set((currentTasks) => [task, ...currentTasks]);
    return Promise.resolve(task);
  }

  function createMany(tasks) {
    store.set((currentTasks) => [...currentTasks, ...tasks]);
    return Promise.resolve(tasks);
  }

  function updateMany(updates) {
    const patchesById = new Map(updates.map(({ id, patch }) => [id, patch]));

    store.set((currentTasks) =>
      currentTasks.map((task) =>
        patchesById.has(task.id)
          ? { ...task, ...patchesById.get(task.id) }
          : task,
      ),
    );

    return Promise.resolve(
      store.getSnapshot().filter((task) => patchesById.has(task.id)),
    );
  }

  function update(id, patch) {
    return updateMany([{ id, patch }]).then(
      ([updatedTask]) => updatedTask ?? null,
    );
  }

  function removeMany(ids) {
    const idsToRemove = new Set(ids);

    store.set((currentTasks) =>
      currentTasks.filter((task) => !idsToRemove.has(task.id)),
    );
    return Promise.resolve();
  }

  function remove(id) {
    return removeMany([id]);
  }

  function reorder(orderedIds) {
    store.set((currentTasks) => applyTaskOrder(currentTasks, orderedIds));
    return Promise.resolve();
  }

  return {
    getStatus: () => "ready",
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    start,
    create,
    createMany,
    update,
    updateMany,
    remove,
    removeMany,
    reorder,
  };
}
