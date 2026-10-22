import { getRoutineKeyForDate, parseLocalDate } from "./dateHelpers";

export function calculateRoutineStreak(routineChecks, routineId, today) {
  let streak = 0;
  const checkDate = parseLocalDate(today);

  const isTodayChecked =
    routineChecks[getRoutineKeyForDate(routineId, checkDate)];

  if (!isTodayChecked) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (routineChecks[getRoutineKeyForDate(routineId, checkDate)]) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

export function calculateWeeklyProductivity(
  routines,
  routineChecks,
  today,
  language,
) {
  const days = [];
  const localeCode = language === "tr" ? "tr-TR" : "en-US";

  for (let i = 6; i >= 0; i--) {
    const date = parseLocalDate(today);
    date.setDate(date.getDate() - i);

    const totalRoutines = routines.length;
    const completedRoutines = routines.filter(
      (routine) => routineChecks[getRoutineKeyForDate(routine.id, date)],
    ).length;

    const percent =
      totalRoutines === 0
        ? 0
        : Math.round((completedRoutines / totalRoutines) * 100);

    days.push({
      label: date.toLocaleDateString(localeCode, { weekday: "short" }),
      fullDate: date.toLocaleDateString(localeCode, {
        day: "numeric",
        month: "long",
      }),
      completed: completedRoutines,
      total: totalRoutines,
      percent,
    });
  }

  return days;
}