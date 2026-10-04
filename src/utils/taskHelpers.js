import { REPEAT_HORIZON_DAYS } from "../constants/initialData";
import { getNextRepeatDate } from "./dateHelpers";

export function generateRepeatOccurrences(baseTask, existingTasks) {
  if (
    baseTask.repeat === "none" ||
    !baseTask.date ||
    !baseTask.repeatGroupId
  ) {
    return [];
  }

  const horizon = new Date();
  horizon.setDate(horizon.getDate() + REPEAT_HORIZON_DAYS);
  const horizonDate = horizon.toISOString().slice(0, 10);

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
        id: crypto.randomUUID(),
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