import { REPEAT_HORIZON_DAYS } from "../constants/initialData";
import { createId } from "../lib/id";
import {
  addDaysToDateString,
  getLocalDateString,
  getNextRepeatDate,
} from "./dateHelpers";

export function generateRepeatOccurrences(
  baseTask,
  existingTasks,
  today = getLocalDateString(),
) {
  if (baseTask.repeat === "none" || !baseTask.date || !baseTask.repeatGroupId) {
    return [];
  }

  const horizonDate = addDaysToDateString(today, REPEAT_HORIZON_DAYS);

  const existingDatesInGroup = new Set(
    existingTasks
      .filter((task) => task.repeatGroupId === baseTask.repeatGroupId)
      .map((task) => task.date),
  );

  const newOccurrences = [];
  let nextDate = getNextRepeatDate(baseTask.date, baseTask.repeat);
  let safetyCounter = 0;

  while (nextDate <= horizonDate && safetyCounter < 400) {
    if (!existingDatesInGroup.has(nextDate)) {
      newOccurrences.push({
        ...baseTask,
        id: createId(),
        date: nextDate,
        completed: false,
        completedAt: null,
        order: Date.now() + safetyCounter,
        steps: baseTask.steps.map((step) => ({ ...step, done: false })),
        attachments: [],
      });

      existingDatesInGroup.add(nextDate);
    }

    nextDate = getNextRepeatDate(nextDate, baseTask.repeat);
    safetyCounter++;
  }

  return newOccurrences;
}

export function isTaskVisibleToday(task, today) {
  const isDateless = !task.date;
  const isTodayDated = task.date === today;
  const belongsToProject = Boolean(task.projectId);

  const belongsToToday = isTodayDated || (isDateless && !belongsToProject);

  if (!belongsToToday) {
    return false;
  }

  if (task.completed && task.completedAt !== today) {
    return false;
  }

  return true;
}

export function getReorderedActiveTaskIds(tasks, draggedId, targetId) {
  const activeIds = tasks
    .filter((task) => !task.completed)
    .sort((a, b) => a.order - b.order)
    .map((task) => task.id);

  const draggedIndex = activeIds.indexOf(draggedId);
  const targetIndex = activeIds.indexOf(targetId);

  if (draggedIndex === -1 || targetIndex === -1) {
    return null;
  }

  const reorderedIds = [...activeIds];
  reorderedIds.splice(draggedIndex, 1);
  reorderedIds.splice(targetIndex, 0, draggedId);

  return reorderedIds;
}

export function applyTaskOrder(tasks, orderedIds) {
  const orderById = new Map(orderedIds.map((id, index) => [id, index]));

  return tasks.map((task) =>
    orderById.has(task.id) ? { ...task, order: orderById.get(task.id) } : task,
  );
}

export function addFutureOccurrences(tasks, today = getLocalDateString()) {
  const latestByGroup = {};

  tasks.forEach((task) => {
    if (task.repeat !== "none" && task.repeatGroupId && task.date) {
      const current = latestByGroup[task.repeatGroupId];

      if (!current || task.date > current.date) {
        latestByGroup[task.repeatGroupId] = task;
      }
    }
  });

  let allNewOccurrences = [];

  Object.values(latestByGroup).forEach((latestTask) => {
    const occurrences = generateRepeatOccurrences(
      latestTask,
      [...tasks, ...allNewOccurrences],
      today,
    );

    allNewOccurrences = [...allNewOccurrences, ...occurrences];
  });

  return [...tasks, ...allNewOccurrences];
}
