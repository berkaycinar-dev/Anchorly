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
} = {}) {
  let storedSettings = clone(settings);
  const storedProjects = clone(projects);
  const storedRoutines = clone(routines);
  let storedCheckRows = clone(checkRows);
  const calls = [];
  const gates = [];
  const failures = [];

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

  function handle(method, path, body) {
    const [root, second, third, fourth] = path.split("/").filter(Boolean);

    if (root === "me" && second === "settings") {
      if (method === "PATCH") {
        storedSettings = { ...storedSettings, ...clone(body) };
      }

      return clone(storedSettings);
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

    return handle(method, path, options.body);
  }

  return {
    request,
    calls,
    holdNext,
    failNext,
    getStoredSettings: () => clone(storedSettings),
    getStoredProjects: () => clone(storedProjects),
    getStoredRoutines: () => clone(storedRoutines),
    getStoredCheckRows: () => clone(storedCheckRows),
  };
}
