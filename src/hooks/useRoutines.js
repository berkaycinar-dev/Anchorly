import { useState, useCallback } from "react";
import useLocalStorageState from "./useLocalStorageState";
import { createId } from "../lib/id";
import { initialRoutines } from "../constants/initialData";
import { getRoutineKey, getRoutineIdFromKey } from "../utils/dateHelpers";
import {
  calculateRoutineStreak,
  calculateWeeklyProductivity,
} from "../utils/routineStats";

export default function useRoutines(today) {
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
      { id: createId(), title },
    ]);
  }

  function deleteRoutine(id) {
    setRoutines((currentRoutines) =>
      currentRoutines.filter((routine) => routine.id !== id),
    );

    setRoutineChecks((currentChecks) => {
      const updatedChecks = {};

      Object.keys(currentChecks).forEach((key) => {
        if (getRoutineIdFromKey(key) !== id) {
          updatedChecks[key] = currentChecks[key];
        }
      });

      return updatedChecks;
    });
  }

  const getRoutineStreak = useCallback(
    (routineId) => calculateRoutineStreak(routineChecks, routineId, today),
    [routineChecks, today],
  );

  const getWeeklyProductivity = useCallback(
    (language) =>
      calculateWeeklyProductivity(routines, routineChecks, today, language),
    [routines, routineChecks, today],
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