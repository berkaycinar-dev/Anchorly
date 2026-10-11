import { createId, isUuid } from "./id";
import { getStorageErrorKind, reportStorageError } from "./storageStatus";

const SCHEMA_VERSION_KEY = "schemaVersion";
const CURRENT_SCHEMA_VERSION = 2;
const ROUTINE_CHECK_KEY_PATTERN = /^(\d{4})-(\d{1,2})-(.+)-(\d{1,2})$/;

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createIdMapper(generateId) {
  const knownIds = new Map();

  return (oldId) => {
    if (
      oldId === null ||
      oldId === undefined ||
      oldId === "" ||
      isUuid(oldId)
    ) {
      return oldId;
    }

    const lookupKey = String(oldId);

    if (!knownIds.has(lookupKey)) {
      knownIds.set(lookupKey, generateId());
    }

    return knownIds.get(lookupKey);
  };
}

function migrateRecords(records, mapId) {
  if (!Array.isArray(records)) {
    return records;
  }

  return records.map((record) =>
    isPlainObject(record) ? { ...record, id: mapId(record.id) } : record,
  );
}

function migrateTasks(tasks, mappers) {
  return tasks.map((task) => {
    if (!isPlainObject(task)) {
      return task;
    }

    return {
      ...task,
      id: mappers.task(task.id),
      projectId: mappers.project(task.projectId),
      repeatGroupId: mappers.group(task.repeatGroupId),
      steps: migrateRecords(task.steps, mappers.step),
      attachments: migrateRecords(task.attachments, mappers.attachment),
    };
  });
}

function migrateRoutineChecks(checks, mappers) {
  return Object.fromEntries(
    Object.entries(checks).map(([key, value]) => {
      const match = ROUTINE_CHECK_KEY_PATTERN.exec(key);

      if (!match) {
        return [key, value];
      }

      const [, year, month, routineId, day] = match;

      return [`${year}-${month}-${mappers.routine(routineId)}-${day}`, value];
    }),
  );
}

const MIGRATIONS = [
  { key: "tasks", isValid: Array.isArray, migrate: migrateTasks },
  {
    key: "routines",
    isValid: Array.isArray,
    migrate: (routines, mappers) => migrateRecords(routines, mappers.routine),
  },
  {
    key: "projects",
    isValid: Array.isArray,
    migrate: (projects, mappers) => migrateRecords(projects, mappers.project),
  },
  {
    key: "routineChecks",
    isValid: isPlainObject,
    migrate: migrateRoutineChecks,
  },
];

function readSchemaVersion(storage) {
  const version = Number(storage.getItem(SCHEMA_VERSION_KEY));

  return Number.isInteger(version) && version >= 1 ? version : 1;
}

function readJson(storage, key) {
  const raw = storage.getItem(key);

  if (raw === null) {
    return null;
  }

  try {
    return { raw, value: JSON.parse(raw) };
  } catch {
    return null;
  }
}

function planWrites(storage, generateId) {
  const mappers = {
    task: createIdMapper(generateId),
    project: createIdMapper(generateId),
    routine: createIdMapper(generateId),
    step: createIdMapper(generateId),
    attachment: createIdMapper(generateId),
    group: createIdMapper(generateId),
  };
  const writes = [];

  MIGRATIONS.forEach(({ key, isValid, migrate }) => {
    const stored = readJson(storage, key);

    if (!stored || !isValid(stored.value)) {
      return;
    }

    const nextRaw = JSON.stringify(migrate(stored.value, mappers));

    if (nextRaw !== JSON.stringify(stored.value)) {
      writes.push({ key, previousRaw: stored.raw, nextRaw });
    }
  });

  return writes;
}

function rollback(storage, appliedWrites) {
  [...appliedWrites].reverse().forEach(({ key, previousRaw }) => {
    try {
      storage.setItem(key, previousRaw);
    } catch (error) {
      console.warn(
        `Could not restore "${key}" after a failed migration.`,
        error,
      );
    }
  });
}

function applyWrites(storage, writes) {
  const appliedWrites = [];

  try {
    writes.forEach((write) => {
      storage.setItem(write.key, write.nextRaw);
      appliedWrites.push(write);
    });

    storage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
  } catch (error) {
    rollback(storage, appliedWrites);
    throw error;
  }
}

export function runMigrations(storage, generateId = createId) {
  try {
    const targetStorage = storage ?? localStorage;

    if (readSchemaVersion(targetStorage) >= CURRENT_SCHEMA_VERSION) {
      return { status: "current", migratedKeys: [] };
    }

    const writes = planWrites(targetStorage, generateId);
    applyWrites(targetStorage, writes);

    return { status: "migrated", migratedKeys: writes.map(({ key }) => key) };
  } catch (error) {
    console.warn(
      "Storage migration failed. The existing data was kept.",
      error,
    );
    reportStorageError({
      key: SCHEMA_VERSION_KEY,
      kind: getStorageErrorKind(error),
    });

    return { status: "failed", migratedKeys: [] };
  }
}
