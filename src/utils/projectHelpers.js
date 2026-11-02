import { parseLocalDate } from "./dateHelpers";

export const PROJECT_COLOR_KEYS = [
  "work",
  "growth",
  "health",
  "personal",
  "project",
  "other",
];

export const BOARD_COLUMNS = ["todo", "doing", "done"];
export const BOARD_DONE_LIMIT = 3;

export function getProjectColorKey(projectId) {
  let hash = 0;

  for (const character of String(projectId)) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return PROJECT_COLOR_KEYS[hash % PROJECT_COLOR_KEYS.length];
}

export function getProjectInitial(name) {
  const trimmed = name.trim();

  if (trimmed === "") {
    return "?";
  }

  return Array.from(trimmed)[0].toLocaleUpperCase();
}

export function getTaskColumn(task) {
  if (task.completed) {
    return "done";
  }

  if (task.boardStatus === "doing" || task.boardStatus === "todo") {
    return task.boardStatus;
  }

  return task.steps.some((step) => step.done) ? "doing" : "todo";
}

export function groupTasksByColumn(tasks) {
  const columns = { todo: [], doing: [], done: [] };

  [...tasks]
    .sort((a, b) => a.order - b.order)
    .forEach((task) => {
      columns[getTaskColumn(task)].push(task);
    });

  return columns;
}

export function getProjectProgress(tasks) {
  const done = tasks.filter((task) => task.completed).length;
  const total = tasks.length;

  return { done, total, ratio: total === 0 ? 0 : done / total };
}

export function getStepProgress(task) {
  return {
    done: task.steps.filter((step) => step.done).length,
    total: task.steps.length,
  };
}

export function getOpenTaskCount(tasks, projectId) {
  return tasks.filter((task) => task.projectId === projectId && !task.completed)
    .length;
}

export function getDaysLeft(dueDate, today) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const difference = parseLocalDate(dueDate) - parseLocalDate(today);

  return Math.round(difference / millisecondsPerDay);
}

export function formatShortDate(dateString, locale) {
  return parseLocalDate(dateString).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
}

export function formatLongDate(dateString, locale) {
  return parseLocalDate(dateString).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
  });
}

export function filterTasksByCategory(tasks, category) {
  if (category === "all") {
    return tasks;
  }

  return tasks.filter((task) => task.category === category);
}

export function splitProjects(projects) {
  return {
    active: projects.filter((project) => !project.archived),
    archived: projects.filter((project) => project.archived),
  };
}
