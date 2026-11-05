import {
  createInitialTasks,
  initialProjects,
  initialRoutines,
} from "../../constants/initialData";
import { getRoutineIdFromKey } from "../../utils/dateHelpers";

export const IMPORT_LIMITS = Object.freeze({
  projects: 500,
  routines: 200,
  routineChecks: 50000,
  tasks: 5000,
});

const STRICT_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TASK_CATEGORIES = [
  "Work",
  "Personal",
  "Self Development",
  "Health",
  "Other",
  "Project",
];
const REPEAT_RULES = ["none", "daily", "weekly"];
const DEMO_REFERENCE_DATE = "2000-01-01";
const DEMO_TASKS = createInitialTasks(DEMO_REFERENCE_DATE);
const DEMO_TASK_FIELDS = [
  "title",
  "category",
  "description",
  "repeat",
  "repeatGroupId",
  "projectId",
  "completed",
];

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStrictUuid(value) {
  return typeof value === "string" && STRICT_UUID_PATTERN.test(value);
}

function isIsoDate(value) {
  if (typeof value !== "string") {
    return false;
  }

  const match = ISO_DATE_PATTERN.exec(value);

  if (!match) {
    return false;
  }

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function readText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function keepFirstOfEachId(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function isEmptyList(value) {
  return value === undefined || value === null || value.length === 0;
}

function isUntouchedDemoTask(task) {
  const demo = DEMO_TASKS.find((candidate) => candidate.id === task.id);

  if (!demo) {
    return false;
  }

  const sameFields = DEMO_TASK_FIELDS.every(
    (field) => (task[field] ?? demo[field]) === demo[field],
  );

  return sameFields && isEmptyList(task.steps) && isEmptyList(task.attachments);
}

function isDemoProject(project) {
  return initialProjects.some(
    (demo) => demo.id === project.id && demo.name === project.name,
  );
}

function isDemoRoutine(routine) {
  return initialRoutines.some(
    (demo) => demo.id === routine.id && demo.title === routine.title,
  );
}

function sanitizeSteps(steps) {
  if (!Array.isArray(steps)) {
    return [];
  }

  return steps
    .filter(
      (step) =>
        isPlainObject(step) &&
        isStrictUuid(step.id) &&
        readText(step.text, 500) !== "",
    )
    .slice(0, 100)
    .map((step) => ({
      id: step.id,
      text: step.text.slice(0, 500),
      done: step.done === true,
    }));
}

function sanitizeTask(task, index) {
  const title = readText(task.title, 500);
  const completed = task.completed === true;

  return {
    id: task.id,
    title,
    category: TASK_CATEGORIES.includes(task.category) ? task.category : "Work",
    date: isIsoDate(task.date) ? task.date : "",
    completed,
    completedAt:
      completed && isIsoDate(task.completedAt) ? task.completedAt : null,
    projectId: isStrictUuid(task.projectId) ? task.projectId : null,
    description:
      typeof task.description === "string"
        ? task.description.slice(0, 10000)
        : "",
    steps: sanitizeSteps(task.steps),
    order:
      Number.isSafeInteger(task.order) && task.order >= 0 ? task.order : index,
    repeat: REPEAT_RULES.includes(task.repeat) ? task.repeat : "none",
    repeatGroupId: isStrictUuid(task.repeatGroupId) ? task.repeatGroupId : null,
  };
}

function readTasks(tasks) {
  if (!Array.isArray(tasks)) {
    return [];
  }

  const sanitized = tasks
    .map((task, index) =>
      isPlainObject(task) && isStrictUuid(task.id) && !isUntouchedDemoTask(task)
        ? sanitizeTask(task, index)
        : null,
    )
    .filter((task) => task !== null && task.title !== "");

  return keepFirstOfEachId(sanitized);
}

function readProjects(projects, keptTasks) {
  if (!Array.isArray(projects)) {
    return [];
  }

  const referencedIds = new Set(keptTasks.map((task) => task.projectId));
  const sanitized = projects
    .filter(
      (project) =>
        isPlainObject(project) &&
        isStrictUuid(project.id) &&
        readText(project.name, 100) !== "" &&
        (!isDemoProject(project) || referencedIds.has(project.id)),
    )
    .map((project) => ({ id: project.id, name: readText(project.name, 100) }));

  return keepFirstOfEachId(sanitized);
}

function parseCheck(key, value) {
  if (value !== true) {
    return null;
  }

  const parts = key.split("-");

  if (parts.length < 4) {
    return null;
  }

  const [year, month] = parts;
  const day = parts[parts.length - 1];
  const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const routineId = getRoutineIdFromKey(key);

  if (!isStrictUuid(routineId) || !isIsoDate(date)) {
    return null;
  }

  return { routineId, date, checked: true };
}

function readChecks(checks) {
  if (!isPlainObject(checks)) {
    return [];
  }

  return Object.entries(checks)
    .map(([key, value]) => parseCheck(key, value))
    .filter((check) => check !== null);
}

function readRoutines(routines, checks) {
  if (!Array.isArray(routines)) {
    return [];
  }

  const checkedRoutineIds = new Set(checks.map((check) => check.routineId));
  const sanitized = routines
    .filter(
      (routine) =>
        isPlainObject(routine) &&
        isStrictUuid(routine.id) &&
        readText(routine.title, 100) !== "" &&
        (!isDemoRoutine(routine) || checkedRoutineIds.has(routine.id)),
    )
    .map((routine) => ({
      id: routine.id,
      title: readText(routine.title, 100),
    }));

  return keepFirstOfEachId(sanitized);
}

export default function buildImportPayload({
  tasks,
  projects,
  routines,
  checks,
}) {
  const keptTasks = readTasks(tasks).slice(0, IMPORT_LIMITS.tasks);
  const allChecks = readChecks(checks);
  const keptRoutines = readRoutines(routines, allChecks).slice(
    0,
    IMPORT_LIMITS.routines,
  );
  const routineIds = new Set(keptRoutines.map((routine) => routine.id));
  const keptChecks = allChecks
    .filter((check) => routineIds.has(check.routineId))
    .slice(0, IMPORT_LIMITS.routineChecks);
  const keptProjects = readProjects(projects, keptTasks).slice(
    0,
    IMPORT_LIMITS.projects,
  );
  const summary = {
    tasks: keptTasks.length,
    routines: keptRoutines.length,
    projects: keptProjects.length,
    routineChecks: keptChecks.length,
  };

  return {
    payload: {
      projects: keptProjects,
      routines: keptRoutines,
      routineChecks: keptChecks,
      tasks: keptTasks,
    },
    summary,
    hasData: summary.tasks + summary.routines + summary.projects > 0,
  };
}
