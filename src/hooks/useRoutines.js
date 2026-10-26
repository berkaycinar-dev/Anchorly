import { useState, useCallback } from "react";
import useRepositorySnapshot from "../data/useRepositorySnapshot";
import { createId } from "../lib/id";
import { getLocalDateString, getRoutineKey } from "../utils/dateHelpers";
import {
  calculateRoutineStreak,
  calculateWeeklyProductivity,
} from "../utils/routineStats";

export default function useRoutines(today) {
  const [{ routines, checks: routineChecks }, repository] =
    useRepositorySnapshot("routines");
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
    const isChecked = Boolean(repository.getSnapshot().checks[key]);
    const date = getLocalDateString(
      new Date(routineYear, routineMonthIndex, day),
    );

    repository.setCheck(routineId, date, !isChecked);
  }

  function addRoutine(title) {
    repository.create({ id: createId(), title });
  }

  function deleteRoutine(id) {
    repository.remove(id);
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
