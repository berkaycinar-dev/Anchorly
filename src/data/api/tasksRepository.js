import { addFutureOccurrences, applyTaskOrder } from "../../utils/taskHelpers";
import createLocalStore from "../local/createLocalStore";
import createOptimisticStore from "./createOptimisticStore";

const TASKS_PATH = "/tasks";
const SERVER_FIELDS = [
  "id",
  "title",
  "category",
  "date",
  "completed",
  "completedAt",
  "projectId",
  "description",
  "steps",
  "order",
  "repeat",
  "repeatGroupId",
];
const LOCAL_FIELDS = ["attachments", "boardStatus"];
const MAX_BULK_OPERATIONS = 500;
const MAX_BULK_BYTES = 90000;

function ignore() {}

function pick(source, keys) {
  return Object.fromEntries(
    keys
      .filter((key) => source[key] !== undefined)
      .map((key) => [key, source[key]]),
  );
}

function omit(source, keys) {
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => !keys.includes(key)),
  );
}

function isSameValue(first, second) {
  return JSON.stringify(first) === JSON.stringify(second);
}

function toStateTask(task) {
  return omit(task, LOCAL_FIELDS);
}

function toServerBody(task) {
  return pick(task, SERVER_FIELDS);
}

function getChangedServerFields(task, patch) {
  const changed = {};

  SERVER_FIELDS.forEach((field) => {
    if (
      field !== "id" &&
      Object.hasOwn(patch, field) &&
      !isSameValue(task[field], patch[field])
    ) {
      changed[field] = patch[field];
    }
  });

  if ("completed" in changed || "completedAt" in changed) {
    ["completed", "completedAt"].forEach((field) => {
      if (Object.hasOwn(patch, field)) {
        changed[field] = patch[field];
      }
    });
  }

  return changed;
}

function overlayServerTasks(tasks, serverTasks) {
  const serverById = new Map(
    serverTasks.map((serverTask) => [serverTask.id, serverTask]),
  );

  return tasks.map((task) =>
    serverById.has(task.id)
      ? { ...task, ...pick(serverById.get(task.id), SERVER_FIELDS) }
      : task,
  );
}

function getResultTasks(response) {
  return response.results
    .filter((result) => result.task)
    .map((result) => result.task);
}

function chunkEntries(entries) {
  const encoder = new TextEncoder();
  const chunks = [];
  let current = [];
  let bytes = 0;

  entries.forEach((entry) => {
    const entryBytes =
      encoder.encode(JSON.stringify(entry.operation)).length + 1;

    if (
      current.length > 0 &&
      (current.length >= MAX_BULK_OPERATIONS ||
        bytes + entryBytes > MAX_BULK_BYTES)
    ) {
      chunks.push(current);
      current = [];
      bytes = 0;
    }

    current.push(entry);
    bytes += entryBytes;
  });

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

function cleanLocalEntry(entry) {
  const cleaned = {};

  if (entry.attachments?.length > 0) {
    cleaned.attachments = entry.attachments;
  }

  if (entry.boardStatus) {
    cleaned.boardStatus = entry.boardStatus;
  }

  return cleaned;
}

export default function createApiTasksRepository({ client, today }) {
  const store = createOptimisticStore({
    initialState: [],
    load: () => client.request("GET", TASKS_PATH),
  });
  const localFields = createLocalStore("taskLocalFields", {});
  let startPromise = null;
  let viewTasks = null;
  let viewLocalFields = null;
  let view = [];

  function getSnapshot() {
    const tasks = store.getSnapshot();
    const extras = localFields.getSnapshot();

    if (tasks !== viewTasks || extras !== viewLocalFields) {
      viewTasks = tasks;
      viewLocalFields = extras;
      view = tasks.map((task) => ({
        ...task,
        attachments: extras[task.id]?.attachments ?? [],
        ...(extras[task.id]?.boardStatus
          ? { boardStatus: extras[task.id].boardStatus }
          : {}),
      }));
    }

    return view;
  }

  function subscribe(listener) {
    const stopStore = store.subscribe(listener);
    const stopLocalFields = localFields.subscribe(listener);

    return () => {
      stopStore();
      stopLocalFields();
    };
  }

  function findTask(id) {
    return getSnapshot().find((task) => task.id === id) ?? null;
  }

  function setLocalFields(id, patch) {
    localFields.set((current) => {
      const next = cleanLocalEntry({ ...current[id], ...patch });

      if (isSameValue(next, cleanLocalEntry(current[id] ?? {}))) {
        return current;
      }

      if (Object.keys(next).length === 0) {
        return omit(current, [id]);
      }

      return { ...current, [id]: next };
    });
  }

  function clearLocalFields(ids) {
    localFields.set((current) => {
      const remaining = omit(current, ids);

      return Object.keys(remaining).length === Object.keys(current).length
        ? current
        : remaining;
    });
  }

  function saveLocalFieldsOf(task) {
    const patch = pick(task, LOCAL_FIELDS);

    if (Object.keys(patch).length > 0) {
      setLocalFields(task.id, patch);
    }
  }

  function create(task) {
    saveLocalFieldsOf(task);

    return store
      .mutate({
        apply: (tasks) => [toStateTask(task), ...tasks],
        send: () =>
          client.request("POST", TASKS_PATH, { body: toServerBody(task) }),
        settle: (tasks, serverTask) => overlayServerTasks(tasks, [serverTask]),
      })
      .then(
        () => findTask(task.id),
        (error) => {
          clearLocalFields([task.id]);
          throw error;
        },
      );
  }

  function createMany(tasks) {
    tasks.forEach(saveLocalFieldsOf);

    const entries = tasks.map((task) => ({
      task,
      operation: { type: "create", task: toServerBody(task) },
    }));

    return Promise.all(
      chunkEntries(entries).map((chunk) =>
        store.mutate({
          apply: (current) => [
            ...current,
            ...chunk.map(({ task }) => toStateTask(task)),
          ],
          send: () =>
            client.request("POST", `${TASKS_PATH}/bulk`, {
              body: { operations: chunk.map(({ operation }) => operation) },
            }),
          settle: (current, response) =>
            overlayServerTasks(current, getResultTasks(response)),
        }),
      ),
    ).then(
      () => tasks.map((task) => findTask(task.id)),
      (error) => {
        clearLocalFields(
          tasks
            .filter(
              (task) => !store.getSnapshot().some((s) => s.id === task.id),
            )
            .map((task) => task.id),
        );
        throw error;
      },
    );
  }

  function updateMany(updates) {
    const entries = [];
    const localOnly = [];

    updates.forEach(({ id, patch }) => {
      const task = store.getSnapshot().find((current) => current.id === id);

      if (!task) {
        return;
      }

      const localPatch = pick(patch, LOCAL_FIELDS);

      if (Object.keys(localPatch).length > 0) {
        setLocalFields(id, localPatch);
      }

      const serverPatch = getChangedServerFields(task, patch);
      const statePatch = { ...omit(patch, LOCAL_FIELDS), id };

      if (Object.keys(serverPatch).length === 0) {
        localOnly.push({ id, statePatch });
        return;
      }

      entries.push({
        id,
        statePatch,
        operation: { type: "update", id, patch: serverPatch },
      });
    });

    const applyPatches = (patches) => (tasks) =>
      tasks.map((task) => {
        const match = patches.find(({ id }) => id === task.id);

        return match ? { ...task, ...match.statePatch } : task;
      });

    const requests = chunkEntries(entries).map((chunk) =>
      store.mutate({
        apply: applyPatches(chunk),
        send: () =>
          client.request("POST", `${TASKS_PATH}/bulk`, {
            body: { operations: chunk.map(({ operation }) => operation) },
          }),
        settle: (current, response) =>
          overlayServerTasks(current, getResultTasks(response)),
      }),
    );

    if (localOnly.length > 0) {
      requests.push(store.mutate({ apply: applyPatches(localOnly) }));
    }

    return Promise.all(requests).then(() =>
      updates.map(({ id }) => findTask(id)).filter(Boolean),
    );
  }

  function update(id, patch) {
    if (!findTask(id)) {
      return Promise.resolve(null);
    }

    return updateMany([{ id, patch }]).then(([updated]) => updated ?? null);
  }

  function removeMany(ids) {
    const existingIds = ids.filter((id) =>
      store.getSnapshot().some((task) => task.id === id),
    );
    const entries = existingIds.map((id) => ({
      id,
      operation: { type: "delete", id },
    }));

    return Promise.all(
      chunkEntries(entries).map((chunk) =>
        store
          .mutate({
            apply: (tasks) =>
              tasks.filter((task) => !chunk.some(({ id }) => id === task.id)),
            send: () =>
              client.request("POST", `${TASKS_PATH}/bulk`, {
                body: { operations: chunk.map(({ operation }) => operation) },
              }),
          })
          .then(() => clearLocalFields(chunk.map(({ id }) => id))),
      ),
    ).then(ignore);
  }

  function remove(id) {
    return removeMany([id]);
  }

  function reorder(orderedIds) {
    const knownIds = orderedIds.filter((id) =>
      store.getSnapshot().some((task) => task.id === id),
    );

    if (knownIds.length === 0) {
      return Promise.resolve();
    }

    return store.mutate({
      apply: (tasks) => applyTaskOrder(tasks, knownIds),
      send: () =>
        client.request("POST", `${TASKS_PATH}/reorder`, {
          body: { orderedIds: knownIds },
        }),
    });
  }

  function createFutureOccurrences() {
    const tasks = getSnapshot();
    const copies = addFutureOccurrences(tasks, today).slice(tasks.length);

    if (copies.length === 0) {
      return Promise.resolve();
    }

    return createMany(copies).then(ignore, ignore);
  }

  function pruneOrphanLocalFields() {
    const knownIds = new Set(store.getSnapshot().map((task) => task.id));

    clearLocalFields(
      Object.keys(localFields.getSnapshot()).filter((id) => !knownIds.has(id)),
    );
  }

  function refresh() {
    return store.refresh().then(() => {
      if (store.getStatus() === "ready") {
        pruneOrphanLocalFields();
      }
    });
  }

  function start() {
    if (!startPromise) {
      localFields.persistInitialState();
      startPromise = store.start().then(() => {
        if (store.getStatus() !== "ready") {
          startPromise = null;
          return undefined;
        }

        pruneOrphanLocalFields();

        return createFutureOccurrences();
      });
    }

    return startPromise;
  }

  return {
    getStatus: store.getStatus,
    getSnapshot,
    subscribe,
    start,
    refresh,
    create,
    createMany,
    update,
    updateMany,
    remove,
    removeMany,
    reorder,
  };
}
