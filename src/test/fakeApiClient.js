import { ApiError, UNKNOWN_ERROR } from "../data/api/ApiError";
import { getRoutineIdFromKey } from "../utils/dateHelpers";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function createError(status, code, message) {
  return new ApiError({ status, code, message });
}

const TASK_FIELDS = [
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

const TASK_DEFAULTS = {
  category: "Work",
  date: "",
  completed: false,
  completedAt: null,
  projectId: null,
  description: "",
  steps: [],
  repeat: "none",
  repeatGroupId: null,
};

function assertKnownTaskFields(body) {
  const unknown = Object.keys(body).find(
    (key) => key !== "attachments" && !TASK_FIELDS.includes(key),
  );

  if (unknown) {
    throw createError(400, "VALIDATION_ERROR", `Unrecognized key "${unknown}"`);
  }
}

function toTaskRecord(body) {
  assertKnownTaskFields(body);

  const merged = { ...TASK_DEFAULTS, ...body };

  return Object.fromEntries(TASK_FIELDS.map((field) => [field, merged[field]]));
}

function toPublicTask(record) {
  return { ...clone(record), attachments: [] };
}

function createTaskIn(state, body) {
  const record = toTaskRecord(body);

  if (state.deletedIds.has(record.id)) {
    throw createError(409, "CONFLICT", `${record.id} was deleted`);
  }

  const existing = state.tasks.find((task) => task.id === record.id);

  if (!existing) {
    state.tasks.push(record);

    return { status: 201, task: toPublicTask(record) };
  }

  if (JSON.stringify(existing) === JSON.stringify(record)) {
    return { status: 200, task: toPublicTask(existing) };
  }

  throw createError(409, "CONFLICT", `${record.id} already exists`);
}

function updateTaskIn(state, id, patch) {
  assertKnownTaskFields(patch);

  const task = state.tasks.find((candidate) => candidate.id === id);

  if (!task) {
    throw createError(404, "NOT_FOUND", `${id} does not exist`);
  }

  const next = { ...task };

  TASK_FIELDS.forEach((field) => {
    if (field !== "id" && patch[field] !== undefined) {
      next[field] = patch[field];
    }
  });

  if (!next.completed && next.completedAt !== null) {
    throw createError(400, "VALIDATION_ERROR", "Unfinished task has a date");
  }

  Object.assign(task, next);

  return toPublicTask(task);
}

function deleteTaskIn(state, id) {
  const index = state.tasks.findIndex((task) => task.id === id);

  if (index === -1) {
    throw createError(404, "NOT_FOUND", `${id} does not exist`);
  }

  state.tasks.splice(index, 1);
  state.deletedIds.add(id);
}

function runBulkOperation(state, operation) {
  if (operation.type === "create") {
    return { type: "create", ...createTaskIn(state, operation.task) };
  }

  if (operation.type === "update") {
    return {
      type: "update",
      status: 200,
      task: updateTaskIn(state, operation.id, operation.patch),
    };
  }

  deleteTaskIn(state, operation.id);

  return { type: "delete", status: 204, id: operation.id };
}

export function checkKeysToRows(checks) {
  return Object.entries(checks).map(([key, checked]) => {
    const firstDash = key.indexOf("-");
    const secondDash = key.indexOf("-", firstDash + 1);
    const lastDash = key.lastIndexOf("-");

    return {
      routineId: getRoutineIdFromKey(key),
      date: [
        key.slice(0, firstDash),
        pad(key.slice(firstDash + 1, secondDash)),
        pad(key.slice(lastDash + 1)),
      ].join("-"),
      checked,
    };
  });
}

export default function createFakeApiClient({
  settings = {},
  projects = [],
  routines = [],
  checkRows = [],
  tasks = [],
} = {}) {
  let storedSettings = clone(settings);
  const storedProjects = clone(projects);
  const storedRoutines = clone(routines);
  let storedCheckRows = clone(checkRows);
  const taskState = {
    tasks: tasks.map((task) => toTaskRecord(clone(task))),
    deletedIds: new Set(),
  };
  const calls = [];
  const gates = [];
  const failures = [];
  const routeFailures = [];

  function holdNext() {
    let release;

    gates.push(
      new Promise((resolve) => {
        release = resolve;
      }),
    );

    return release;
  }

  function failNext(
    error = createError(500, UNKNOWN_ERROR, "The server failed"),
  ) {
    failures.push(error);
  }

  function failNextOn(
    method,
    path,
    error = createError(500, UNKNOWN_ERROR, "The server failed"),
  ) {
    routeFailures.push({ method, path, error });
  }

  function handleNamedList(list, field, method, id, body) {
    if (method === "GET" && !id) {
      return clone(list);
    }

    if (method === "POST" && !id) {
      const name = body[field].trim();
      const existing = list.find((item) => item.id === body.id);

      if (!existing) {
        list.push({ id: body.id, [field]: name });

        return clone(list.at(-1));
      }

      if (existing[field] === name) {
        return clone(existing);
      }

      throw createError(409, "CONFLICT", `${body.id} already exists`);
    }

    const index = list.findIndex((item) => item.id === id);

    if (index === -1) {
      throw createError(404, "NOT_FOUND", `${id} does not exist`);
    }

    if (method === "PATCH") {
      list[index][field] = body[field].trim();

      return clone(list[index]);
    }

    if (method === "DELETE") {
      list.splice(index, 1);

      return null;
    }

    throw createError(405, "METHOD_NOT_ALLOWED", `${method} is not allowed`);
  }

  function handleTasks(method, second, body) {
    if (method === "GET" && !second) {
      return taskState.tasks.map(toPublicTask);
    }

    if (method === "POST" && !second) {
      return createTaskIn(taskState, body).task;
    }

    if (method === "POST" && second === "reorder") {
      const missing = body.orderedIds.find(
        (id) => !taskState.tasks.some((task) => task.id === id),
      );

      if (missing) {
        throw createError(404, "NOT_FOUND", "One or more tasks were not found");
      }

      body.orderedIds.forEach((id, index) => {
        taskState.tasks.find((task) => task.id === id).order = index;
      });

      return null;
    }

    if (method === "POST" && second === "bulk") {
      const working = {
        tasks: clone(taskState.tasks),
        deletedIds: new Set(taskState.deletedIds),
      };
      const results = body.operations.map((operation) =>
        runBulkOperation(working, operation),
      );

      taskState.tasks = working.tasks;
      taskState.deletedIds = working.deletedIds;

      return { results };
    }

    if (method === "PATCH" && second) {
      return updateTaskIn(taskState, second, body);
    }

    if (method === "DELETE" && second) {
      deleteTaskIn(taskState, second);

      return null;
    }

    throw createError(405, "METHOD_NOT_ALLOWED", `${method} is not allowed`);
  }

  function handle(method, path, body) {
    const [root, second, third, fourth] = path.split("/").filter(Boolean);

    if (root === "me" && second === "settings") {
      if (method === "PATCH") {
        storedSettings = { ...storedSettings, ...clone(body) };
      }

      return clone(storedSettings);
    }

    if (root === "tasks") {
      return handleTasks(method, second, body);
    }

    if (root === "projects") {
      return handleNamedList(storedProjects, "name", method, second, body);
    }

    if (root === "routines" && second === "checks" && method === "GET") {
      return clone(
        storedCheckRows.filter((row) =>
          storedRoutines.some((routine) => routine.id === row.routineId),
        ),
      );
    }

    if (root === "routines" && third === "checks" && method === "PUT") {
      if (!storedRoutines.some((routine) => routine.id === second)) {
        throw createError(404, "NOT_FOUND", `${second} does not exist`);
      }

      storedCheckRows = storedCheckRows.filter(
        (row) => !(row.routineId === second && row.date === fourth),
      );
      storedCheckRows.push({
        routineId: second,
        date: fourth,
        checked: body.checked,
      });

      return clone(storedCheckRows.at(-1));
    }

    if (root === "routines") {
      const result = handleNamedList(
        storedRoutines,
        "title",
        method,
        second,
        body,
      );

      if (method === "DELETE") {
        storedCheckRows = storedCheckRows.filter(
          (row) => row.routineId !== second,
        );
      }

      return result;
    }

    throw createError(404, "NOT_FOUND", `No fake route for ${method} ${path}`);
  }

  async function request(method, path, options = {}) {
    calls.push({ method, path, body: options.body });

    const gate = gates.shift();

    if (gate) {
      await gate;
    }

    const failure = failures.shift();

    if (failure) {
      throw failure;
    }

    const routeFailureIndex = routeFailures.findIndex(
      (candidate) => candidate.method === method && candidate.path === path,
    );

    if (routeFailureIndex !== -1) {
      throw routeFailures.splice(routeFailureIndex, 1)[0].error;
    }

    return handle(method, path, options.body);
  }

  return {
    request,
    calls,
    holdNext,
    failNext,
    failNextOn,
    getStoredSettings: () => clone(storedSettings),
    getStoredProjects: () => clone(storedProjects),
    getStoredRoutines: () => clone(storedRoutines),
    getStoredCheckRows: () => clone(storedCheckRows),
    getStoredTasks: () => clone(taskState.tasks),
  };
}
