import { LIST_LIMIT, LIST_SHOWN } from "../constants/dashboardCards";
import {
  addDaysToDateString,
  getLocalDateString,
  getWeekStartDate,
  parseLocalDate,
} from "./dateHelpers";

export const CATEGORY_ORDER = [
  "Work",
  "Personal",
  "Self Development",
  "Health",
  "Project",
  "Other",
];

const CATEGORY_TONES = {
  Work: "work",
  Personal: "personal",
  "Self Development": "growth",
  Health: "health",
  Project: "project",
  Other: "other",
};

export function getCategoryTone(category) {
  return CATEGORY_TONES[category] ?? "other";
}

export function limitList(items) {
  if (items.length <= LIST_LIMIT) {
    return { shown: items, hidden: 0 };
  }

  return {
    shown: items.slice(0, LIST_SHOWN),
    hidden: items.length - LIST_SHOWN,
  };
}

function byOrder(a, b) {
  return (a.order ?? 0) - (b.order ?? 0);
}

export function getTasksForDate(tasks, date) {
  return tasks.filter((task) => task.date === date).sort(byOrder);
}

export function getOverdueTasks(tasks, today) {
  return tasks
    .filter((task) => !task.completed && task.date && task.date < today)
    .sort((a, b) => a.date.localeCompare(b.date) || byOrder(a, b));
}

export function getUpcomingDays(tasks, today, daysAhead) {
  const days = [];

  for (let offset = 1; offset <= daysAhead; offset++) {
    const date = addDaysToDateString(today, offset);
    const dayTasks = tasks
      .filter((task) => task.date === date && !task.completed)
      .sort(byOrder);

    if (dayTasks.length > 0) {
      days.push({ date, tasks: dayTasks });
    }
  }

  return days;
}

export function getProjectProgress(projects, tasks) {
  return projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id);
    const done = projectTasks.filter((task) => task.completed).length;
    const total = projectTasks.length;
    const nextDate =
      projectTasks
        .filter((task) => !task.completed && task.date)
        .map((task) => task.date)
        .sort()[0] ?? null;

    return {
      id: project.id,
      name: project.name,
      done,
      total,
      percent: total === 0 ? 0 : Math.round((done / total) * 100),
      nextDate,
    };
  });
}

export function getWeekRange(today, weekStartDay) {
  const start = getLocalDateString(
    getWeekStartDate(parseLocalDate(today), weekStartDay),
  );

  return { start, end: addDaysToDateString(start, 6) };
}

export function getCategoryCounts(tasks, range) {
  const counts = Object.fromEntries(CATEGORY_ORDER.map((name) => [name, 0]));

  tasks.forEach((task) => {
    if (task.date && task.date >= range.start && task.date <= range.end) {
      const category = Object.hasOwn(counts, task.category)
        ? task.category
        : "Other";
      counts[category] += 1;
    }
  });

  return CATEGORY_ORDER.map((category) => ({
    category,
    count: counts[category],
  }));
}

export function getMonthCells(today, weekStartDay) {
  const reference = parseLocalDate(today);
  const year = reference.getFullYear();
  const monthIndex = reference.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const offset =
    weekStartDay === "monday" ? (firstWeekday + 6) % 7 : firstWeekday;
  const cells = Array.from({ length: offset }, () => null);

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(getLocalDateString(new Date(year, monthIndex, day)));
  }

  return cells;
}

export function getWeekdayLabels(weekStartDay, locale) {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const firstDay = weekStartDay === "monday" ? 1 : 0;
  const sunday = new Date(2026, 0, 4);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + ((firstDay + index) % 7));

    return formatter.format(date);
  });
}
