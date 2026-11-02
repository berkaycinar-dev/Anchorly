import {
  getLocalDateString,
  getRoutineKeyForDate,
  parseLocalDate,
} from "./dateHelpers";

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

export function isRoutineCheckedOn(routineChecks, routineId, dateString) {
  return Boolean(
    routineChecks[getRoutineKeyForDate(routineId, parseLocalDate(dateString))],
  );
}

export function getDayProgress(routines, routineChecks, dateString) {
  const total = routines.length;
  const completed = routines.filter((routine) =>
    isRoutineCheckedOn(routineChecks, routine.id, dateString),
  ).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { completed, total, percent };
}

export function getRoutineHistory(
  routineChecks,
  routineId,
  endDateString,
  length,
) {
  const days = [];

  for (let i = length - 1; i >= 0; i--) {
    const day = parseLocalDate(endDateString);
    day.setDate(day.getDate() - i);
    const date = getLocalDateString(day);

    days.push({
      date,
      checked: isRoutineCheckedOn(routineChecks, routineId, date),
    });
  }

  return days;
}

export function getRoutineMonthProgress(routineChecks, routineId, dateString) {
  const date = parseLocalDate(dateString);
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const total = new Date(year, monthIndex + 1, 0).getDate();
  let completed = 0;

  for (let day = 1; day <= total; day++) {
    if (
      routineChecks[
        getRoutineKeyForDate(routineId, new Date(year, monthIndex, day))
      ]
    ) {
      completed++;
    }
  }

  return { completed, total };
}

export function getMonthAverage(routines, routineChecks, today) {
  const todayDate = parseLocalDate(today);
  const year = todayDate.getFullYear();
  const monthIndex = todayDate.getMonth();
  const elapsedDays = todayDate.getDate();
  const total = routines.length * elapsedDays;

  if (total === 0) {
    return 0;
  }

  let completed = 0;

  for (let day = 1; day <= elapsedDays; day++) {
    const date = new Date(year, monthIndex, day);

    routines.forEach((routine) => {
      if (routineChecks[getRoutineKeyForDate(routine.id, date)]) {
        completed++;
      }
    });
  }

  return Math.round((completed / total) * 100);
}

export function getLongestActiveStreak(routines, routineChecks, today) {
  let best = null;

  routines.forEach((routine) => {
    const streak = calculateRoutineStreak(routineChecks, routine.id, today);

    if (streak > 0 && (!best || streak > best.streak)) {
      best = { routine, streak };
    }
  });

  return best;
}
