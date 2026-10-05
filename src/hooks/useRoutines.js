import { useState , useCallback } from "react";
import useLocalStorageState from "./useLocalStorageState";
import { initialRoutines } from "../constants/initialData";
import {
  getRoutineKey,
  getRoutineKeyForDate,
  getRoutineIdFromKey,
} from "../utils/dateHelpers";

export default function useRoutines() {
  const [routines, setRoutines] = useLocalStorageState(
    "routines",
    initialRoutines,
  );
  const [routineChecks, setRoutineChecks] = useLocalStorageState(
    "routineChecks",
    {},
  );
  const [routineMonth, setRoutineMonth] = useState(new Date());

  const routineYear = routineMonth.getFullYear();
  const routineMonthIndex = routineMonth.getMonth();

  const daysInRoutineMonth = new Date(
    routineYear,
    routineMonthIndex + 1,
    0,
  ).getDate();

  const routineDays = Array.from(
    { length: daysInRoutineMonth },
    (_, index) => index + 1,
  );

  function getRoutineKeyForMonth(routineId, day) {
    return getRoutineKey(routineId, day, routineYear, routineMonthIndex);
  }

  function toggleRoutineCheck(routineId, day) {
    const key = getRoutineKeyForMonth(routineId, day);

    setRoutineChecks({
      ...routineChecks,
      [key]: !routineChecks[key],
    });
  }

  function addRoutine(title) {
    setRoutines((currentRoutines) => [
      ...currentRoutines,
      { id: crypto.randomUUID(), title },
    ]);
  }

  function deleteRoutine(id) {
    setRoutines((currentRoutines) =>
      currentRoutines.filter((routine) => routine.id !== id),
    );

    setRoutineChecks((currentChecks) => {
      const updatedChecks = {};

      Object.keys(currentChecks).forEach((key) => {
        if (getRoutineIdFromKey(key) !== String(id)) {
          updatedChecks[key] = currentChecks[key];
        }
      });

      return updatedChecks;
    });
  }

    const getRoutineStreak = useCallback(
    (routineId) => {
      let streak = 0;
      const checkDate = new Date();

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
    },
    [routineChecks],
  );

    const getWeeklyProductivity = useCallback(
    (language) => {
      const days = [];
      const localeCode = language === "tr" ? "tr-TR" : "en-US";

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
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
    },
    [routines, routineChecks],
  );

    

  return {
    routines,
    routineChecks,
    routineMonth,
    setRoutineMonth,
    routineYear,
    routineMonthIndex,
    routineDays,
    getRoutineKeyForMonth,
    toggleRoutineCheck,
    addRoutine,
    deleteRoutine,
    getRoutineStreak,
    getWeeklyProductivity,
  };
}
