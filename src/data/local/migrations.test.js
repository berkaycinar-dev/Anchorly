import { beforeEach, describe, it, expect, vi } from "vitest";
import { runMigrations } from "./migrations";
import { isUuid } from "../../lib/id";
import { getSnapshot } from "./storageStatus";
import legacyBackup from "../../test/fixtures/legacyBackup.json";

const ROUTINE_CHECK_KEY_PATTERN = /^(\d{4})-(\d{1,2})-(.+)-(\d{1,2})$/;
const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";
const UUID_C = "33333333-3333-4333-8333-333333333333";

function createIdSequence() {
  let counter = 0;

  return () => {
    counter += 1;
    return `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`;
  };
}

function createMemoryStorage(entries = {}, options = {}) {
  const data = new Map(Object.entries(entries));
  let writeCount = 0;

  return {
    getItem: vi.fn((key) => (data.has(key) ? data.get(key) : null)),
    setItem: vi.fn((key, value) => {
      writeCount += 1;

      if (writeCount === options.failOnWrite) {
        throw new DOMException("Quota reached", "QuotaExceededError");
      }

      data.set(key, String(value));
    }),
    snapshot: () => Object.fromEntries(data),
  };
}

function serialize(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, JSON.stringify(value)]),
  );
}

function readJson(storage, key) {
  return JSON.parse(storage.snapshot()[key]);
}

function createTask(overrides = {}) {
  return {
    id: 1,
    title: "Task",
    category: "Work",
    date: "2026-10-10",
    completed: false,
    projectId: null,
    description: "",
    steps: [],
    completedAt: null,
    order: 0,
    repeat: "none",
    repeatGroupId: null,
    attachments: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("runMigrations schema version", () => {
  it("writes only the schema version on empty storage", () => {
    const storage = createMemoryStorage();

    const result = runMigrations(storage, createIdSequence());

    expect(result).toEqual({ status: "migrated", migratedKeys: [] });
    expect(storage.snapshot()).toEqual({ schemaVersion: "2" });
  });

  it("does nothing when the schema version is already current", () => {
    const entries = {
      ...serialize({ tasks: [createTask()] }),
      schemaVersion: "2",
    };
    const storage = createMemoryStorage(entries);

    const result = runMigrations(storage, createIdSequence());

    expect(result.status).toBe("current");
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.snapshot()).toEqual(entries);
  });

  it("treats an invalid schema version as version 1", () => {
    const storage = createMemoryStorage({
      ...serialize({ tasks: [createTask({ id: 1 })] }),
      schemaVersion: "abc",
    });

    const result = runMigrations(storage, createIdSequence());

    expect(result.status).toBe("migrated");
    expect(isUuid(readJson(storage, "tasks")[0].id)).toBe(true);
    expect(storage.snapshot().schemaVersion).toBe("2");
  });
});

describe("runMigrations tasks", () => {
  it("replaces numeric task ids with uuids", () => {
    const storage = createMemoryStorage(
      serialize({
        tasks: [createTask({ id: 1 }), createTask({ id: 2 })],
      }),
    );

    runMigrations(storage, createIdSequence());

    const ids = readJson(storage, "tasks").map((task) => task.id);

    expect(ids.every((id) => isUuid(id))).toBe(true);
    expect(new Set(ids).size).toBe(2);
  });

  it("keeps task ids that are already uuids", () => {
    const storage = createMemoryStorage(
      serialize({
        tasks: [createTask({ id: UUID_A }), createTask({ id: 2 })],
      }),
    );

    runMigrations(storage, createIdSequence());

    const ids = readJson(storage, "tasks").map((task) => task.id);

    expect(ids[0]).toBe(UUID_A);
    expect(ids[1]).not.toBe(2);
  });

  it("updates project references on tasks and keeps null", () => {
    const storage = createMemoryStorage(
      serialize({
        tasks: [
          createTask({ id: 1, projectId: 1 }),
          createTask({ id: 2, projectId: "2" }),
          createTask({ id: 3, projectId: null }),
        ],
        projects: [
          { id: "1", name: "Project 1" },
          { id: 2, name: "Project 2" },
        ],
      }),
    );

    runMigrations(storage, createIdSequence());

    const tasks = readJson(storage, "tasks");
    const projects = readJson(storage, "projects");

    expect(projects.every((project) => isUuid(project.id))).toBe(true);
    expect(tasks[0].projectId).toBe(projects[0].id);
    expect(tasks[1].projectId).toBe(projects[1].id);
    expect(tasks[2].projectId).toBeNull();
  });

  it("replaces step and attachment ids", () => {
    const storage = createMemoryStorage(
      serialize({
        tasks: [
          createTask({
            steps: [
              { id: 1, text: "Step 1", done: false },
              { id: UUID_B, text: "Step 2", done: true },
            ],
            attachments: [{ id: 7, name: "file.txt", type: "text/plain" }],
          }),
        ],
      }),
    );

    runMigrations(storage, createIdSequence());

    const [task] = readJson(storage, "tasks");

    expect(isUuid(task.steps[0].id)).toBe(true);
    expect(task.steps[1].id).toBe(UUID_B);
    expect(isUuid(task.attachments[0].id)).toBe(true);
  });

  it("replaces legacy repeat group ids and keeps uuid ones", () => {
    const storage = createMemoryStorage(
      serialize({
        tasks: [
          createTask({ id: 1, repeat: "daily", repeatGroupId: 5 }),
          createTask({ id: 2, repeat: "daily", repeatGroupId: 5 }),
          createTask({ id: 3, repeat: "weekly", repeatGroupId: UUID_C }),
          createTask({ id: 4, repeatGroupId: null }),
        ],
      }),
    );

    runMigrations(storage, createIdSequence());

    const tasks = readJson(storage, "tasks");

    expect(isUuid(tasks[0].repeatGroupId)).toBe(true);
    expect(tasks[1].repeatGroupId).toBe(tasks[0].repeatGroupId);
    expect(tasks[2].repeatGroupId).toBe(UUID_C);
    expect(tasks[3].repeatGroupId).toBeNull();
  });

  it("keeps every other task field untouched", () => {
    const original = createTask({
      id: 1,
      title: "Keep me",
      category: "Health",
      date: "2026-11-02",
      completed: true,
      completedAt: "2026-11-02",
      description: "Some notes",
      order: 42,
      repeat: "weekly",
    });
    const storage = createMemoryStorage(serialize({ tasks: [original] }));

    runMigrations(storage, createIdSequence());

    const [migrated] = readJson(storage, "tasks");

    expect({ ...migrated, id: original.id }).toEqual(original);
  });
});

describe("runMigrations routines and routine checks", () => {
  it("replaces numeric routine ids, including long timestamp ids", () => {
    const storage = createMemoryStorage(
      serialize({
        routines: [
          { id: 1, title: "Routine 1" },
          { id: 1788807397799, title: "Routine 2" },
          { id: UUID_A, title: "Routine 3" },
        ],
      }),
    );

    runMigrations(storage, createIdSequence());

    const routines = readJson(storage, "routines");

    expect(routines.every((routine) => isUuid(routine.id))).toBe(true);
    expect(routines[2].id).toBe(UUID_A);
    expect(new Set(routines.map((routine) => routine.id)).size).toBe(3);
  });

  it("rewrites routine check keys to use the new routine ids", () => {
    const storage = createMemoryStorage(
      serialize({
        routines: [
          { id: 1, title: "Routine 1" },
          { id: 1788807397799, title: "Routine 2" },
        ],
        routineChecks: {
          "2026-9-1-1": true,
          "2026-10-1788807397799-31": true,
        },
      }),
    );

    runMigrations(storage, createIdSequence());

    const routines = readJson(storage, "routines");
    const checks = readJson(storage, "routineChecks");

    expect(Object.keys(checks).sort()).toEqual(
      [`2026-9-${routines[0].id}-1`, `2026-10-${routines[1].id}-31`].sort(),
    );
  });

  it("keeps the value of every routine check", () => {
    const storage = createMemoryStorage(
      serialize({
        routines: [{ id: 1, title: "Routine 1" }],
        routineChecks: { "2026-9-1-1": true, "2026-9-1-2": false },
      }),
    );

    runMigrations(storage, createIdSequence());

    const [routine] = readJson(storage, "routines");
    const checks = readJson(storage, "routineChecks");

    expect(checks[`2026-9-${routine.id}-1`]).toBe(true);
    expect(checks[`2026-9-${routine.id}-2`]).toBe(false);
  });

  it("maps ids that share digits to different uuids", () => {
    const storage = createMemoryStorage(
      serialize({
        routines: [
          { id: 1, title: "Routine 1" },
          { id: 11, title: "Routine 2" },
        ],
        routineChecks: { "2026-9-1-1": true, "2026-9-11-1": false },
      }),
    );

    runMigrations(storage, createIdSequence());

    const routines = readJson(storage, "routines");
    const checks = readJson(storage, "routineChecks");

    expect(checks[`2026-9-${routines[0].id}-1`]).toBe(true);
    expect(checks[`2026-9-${routines[1].id}-1`]).toBe(false);
  });

  it("keeps check keys of routines that already use uuids", () => {
    const checks = { [`2026-9-${UUID_A}-3`]: true };
    const storage = createMemoryStorage(
      serialize({
        routines: [{ id: UUID_A, title: "Routine 1" }],
        routineChecks: checks,
      }),
    );

    const result = runMigrations(storage, createIdSequence());

    expect(result.migratedKeys).toEqual([]);
    expect(readJson(storage, "routineChecks")).toEqual(checks);
  });

  it("keeps check keys that do not match the key pattern", () => {
    const storage = createMemoryStorage(
      serialize({
        routines: [{ id: 1, title: "Routine 1" }],
        routineChecks: { "not-a-check-key": true, "2026-9-1-1": true },
      }),
    );

    runMigrations(storage, createIdSequence());

    const checks = readJson(storage, "routineChecks");

    expect(checks["not-a-check-key"]).toBe(true);
    expect(Object.keys(checks)).toHaveLength(2);
  });
});

describe("runMigrations robustness", () => {
  it("skips a key with corrupt JSON and migrates the other keys", () => {
    const storage = createMemoryStorage({
      tasks: "{broken",
      ...serialize({ projects: [{ id: 1, name: "Project 1" }] }),
    });

    const result = runMigrations(storage, createIdSequence());

    expect(result.status).toBe("migrated");
    expect(result.migratedKeys).toEqual(["projects"]);
    expect(storage.snapshot().tasks).toBe("{broken");
    expect(isUuid(readJson(storage, "projects")[0].id)).toBe(true);
  });

  it("skips tasks that are not an array", () => {
    const rawTasks = JSON.stringify({ not: "an array" });
    const storage = createMemoryStorage({ tasks: rawTasks });

    const result = runMigrations(storage, createIdSequence());

    expect(result.migratedKeys).toEqual([]);
    expect(storage.snapshot().tasks).toBe(rawTasks);
  });

  it("keeps list entries that are not objects", () => {
    const storage = createMemoryStorage(
      serialize({ tasks: [null, "text", createTask({ id: 1 })] }),
    );

    runMigrations(storage, createIdSequence());

    const tasks = readJson(storage, "tasks");

    expect(tasks[0]).toBeNull();
    expect(tasks[1]).toBe("text");
    expect(isUuid(tasks[2].id)).toBe(true);
  });

  it("writes only the schema version when no key needs migrating", () => {
    const storage = createMemoryStorage(
      serialize({
        tasks: [createTask({ id: UUID_A })],
        routines: [{ id: UUID_B, title: "Routine 1" }],
        projects: [{ id: UUID_C, name: "Project 1" }],
      }),
    );

    const result = runMigrations(storage, createIdSequence());

    expect(result.migratedKeys).toEqual([]);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledWith("schemaVersion", "2");
  });

  it("does not change anything on a second run", () => {
    const storage = createMemoryStorage(
      serialize({
        tasks: [createTask({ id: 1, projectId: 1 })],
        routines: [{ id: 1, title: "Routine 1" }],
        projects: [{ id: 1, name: "Project 1" }],
        routineChecks: { "2026-9-1-1": true },
      }),
    );

    runMigrations(storage, createIdSequence());
    const afterFirstRun = storage.snapshot();
    storage.setItem.mockClear();

    const secondResult = runMigrations(storage, createIdSequence());

    expect(secondResult.status).toBe("current");
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.snapshot()).toEqual(afterFirstRun);
  });

  it("rolls back every written key when a write fails", () => {
    const entries = serialize({
      tasks: [createTask({ id: 1 })],
      routines: [{ id: 1, title: "Routine 1" }],
      projects: [{ id: 1, name: "Project 1" }],
    });
    const storage = createMemoryStorage(entries, { failOnWrite: 3 });

    const result = runMigrations(storage, createIdSequence());

    expect(result).toEqual({ status: "failed", migratedKeys: [] });
    expect(storage.snapshot()).toEqual(entries);
  });

  it("rolls back when only the schema version write fails", () => {
    const entries = serialize({ tasks: [createTask({ id: 1 })] });
    const storage = createMemoryStorage(entries, { failOnWrite: 2 });

    const result = runMigrations(storage, createIdSequence());

    expect(result.status).toBe("failed");
    expect(storage.snapshot()).toEqual(entries);
  });

  it("reports a quota issue when a write fails with a quota error", () => {
    const storage = createMemoryStorage(
      serialize({ tasks: [createTask({ id: 1 })] }),
      { failOnWrite: 1 },
    );

    runMigrations(storage, createIdSequence());

    expect(getSnapshot()).toEqual([{ key: "schemaVersion", kind: "quota" }]);
  });

  it("does not throw and reports an issue when storage cannot be read", () => {
    const storage = {
      getItem: () => {
        throw new DOMException("Access denied", "SecurityError");
      },
      setItem: vi.fn(),
    };

    const result = runMigrations(storage, createIdSequence());

    expect(result.status).toBe("failed");
    expect(getSnapshot()).toEqual([
      { key: "schemaVersion", kind: "unavailable" },
    ]);
  });

  it("uses the id generator it receives", () => {
    const storage = createMemoryStorage(
      serialize({ tasks: [createTask({ id: 1 })] }),
    );

    runMigrations(storage, () => UUID_A);

    expect(readJson(storage, "tasks")[0].id).toBe(UUID_A);
  });

  it("uses localStorage when no storage is passed", () => {
    localStorage.setItem("tasks", JSON.stringify([createTask({ id: 1 })]));

    const result = runMigrations();

    expect(result.status).toBe("migrated");
    expect(isUuid(JSON.parse(localStorage.getItem("tasks"))[0].id)).toBe(true);
    expect(localStorage.getItem("schemaVersion")).toBe("2");
  });
});

describe("runMigrations with the legacy backup fixture", () => {
  function parseFixture() {
    return {
      tasks: JSON.parse(legacyBackup.tasks),
      routines: JSON.parse(legacyBackup.routines),
      projects: JSON.parse(legacyBackup.projects),
      routineChecks: JSON.parse(legacyBackup.routineChecks),
    };
  }

  function migrateFixture() {
    const storage = createMemoryStorage(legacyBackup);

    runMigrations(storage, createIdSequence());

    return {
      storage,
      tasks: readJson(storage, "tasks"),
      routines: readJson(storage, "routines"),
      projects: readJson(storage, "projects"),
      routineChecks: readJson(storage, "routineChecks"),
    };
  }

  it("contains the legacy ids the migration has to handle", () => {
    const before = parseFixture();

    expect(before.tasks).toHaveLength(128);
    expect(before.tasks.filter((task) => !isUuid(task.id))).toHaveLength(5);
    expect(before.routines.map((routine) => routine.id)).toContain(
      1788807397799,
    );
  });

  it("gives every task, step and routine a uuid", () => {
    const after = migrateFixture();

    expect(after.tasks.every((task) => isUuid(task.id))).toBe(true);
    expect(
      after.tasks.every((task) => task.steps.every((step) => isUuid(step.id))),
    ).toBe(true);
    expect(after.routines.every((routine) => isUuid(routine.id))).toBe(true);
    expect(new Set(after.tasks.map((task) => task.id)).size).toBe(128);
  });

  it("keeps all records, their order and their other fields", () => {
    const before = parseFixture();
    const after = migrateFixture();

    expect(after.tasks.map((task) => task.title)).toEqual(
      before.tasks.map((task) => task.title),
    );
    expect(after.tasks.map((task) => task.date)).toEqual(
      before.tasks.map((task) => task.date),
    );
    expect(after.routines.map((routine) => routine.title)).toEqual(
      before.routines.map((routine) => routine.title),
    );
    expect(after.projects).toEqual(before.projects);
  });

  it("keeps every routine check attached to the same routine", () => {
    const before = parseFixture();
    const after = migrateFixture();

    expect(Object.keys(after.routineChecks)).toHaveLength(
      Object.keys(before.routineChecks).length,
    );

    Object.entries(before.routineChecks).forEach(([oldKey, value]) => {
      const [, year, month, oldRoutineId, day] =
        ROUTINE_CHECK_KEY_PATTERN.exec(oldKey);
      const routineIndex = before.routines.findIndex(
        (routine) => String(routine.id) === oldRoutineId,
      );
      const newRoutineId = after.routines[routineIndex].id;

      expect(
        after.routineChecks[`${year}-${month}-${newRoutineId}-${day}`],
      ).toBe(value);
    });
  });

  it("leaves no routine check without a routine", () => {
    const after = migrateFixture();
    const routineIds = after.routines.map((routine) => routine.id);

    Object.keys(after.routineChecks).forEach((key) => {
      const [, , , routineId] = ROUTINE_CHECK_KEY_PATTERN.exec(key);

      expect(routineIds).toContain(routineId);
    });
  });

  it("keeps task project references pointing at existing projects", () => {
    const after = migrateFixture();
    const projectIds = after.projects.map((project) => project.id);

    after.tasks.forEach((task) => {
      expect(
        task.projectId === null || projectIds.includes(task.projectId),
      ).toBe(true);
    });
  });

  it("keeps settings untouched and does not change anything on a second run", () => {
    const { storage } = migrateFixture();
    const afterFirstRun = storage.snapshot();
    storage.setItem.mockClear();

    const secondResult = runMigrations(storage, createIdSequence());

    expect(secondResult.status).toBe("current");
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(afterFirstRun.theme).toBe(legacyBackup.theme);
    expect(afterFirstRun.language).toBe(legacyBackup.language);
    expect(afterFirstRun.weekStartDay).toBe(legacyBackup.weekStartDay);
    expect(afterFirstRun.fontFamily).toBe(legacyBackup.fontFamily);
  });
});
