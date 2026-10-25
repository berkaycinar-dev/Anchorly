import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import DataProvider from "../data/DataProvider";
import { isUuid } from "../lib/id";
import useRoutines from "./useRoutines";

const FIRST_ID = "42a8fe5c-29ef-47b1-a3f3-1af09f7b5a20";
const SECOND_ID = "cfd63e9e-901f-44fd-8ab6-2ef4bd8133d8";
const THIRD_ID = "9d2f6a41-5c0e-4b7a-8e13-6f7a2b9c4d10";

const ROUTINES = [
  { id: FIRST_ID, title: "Routine 1" },
  { id: SECOND_ID, title: "Routine 2" },
];

function renderRoutines() {
  localStorage.setItem(
    "routines",
    JSON.stringify([
      { id: FIRST_ID, title: "Routine 1" },
      { id: SECOND_ID, title: "Routine 2" },
    ]),
  );
  localStorage.setItem(
    "routineChecks",
    JSON.stringify({
      [`2026-10-${FIRST_ID}-1`]: true,
      [`2026-10-${FIRST_ID}-2`]: true,
      [`2026-10-${SECOND_ID}-1`]: true,
    }),
  );

  return renderHook(() => useRoutines("2026-10-10"), {
    wrapper: DataProvider,
  });
}

function renderRoutinesAt(routines, checks = {}, today = "2026-10-10") {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 10, 12));
  localStorage.setItem("routines", JSON.stringify(routines));
  localStorage.setItem("routineChecks", JSON.stringify(checks));

  return renderHook(() => useRoutines(today), { wrapper: DataProvider });
}

function getKey(routineId, day, month = 10) {
  return `2026-${month}-${routineId}-${day}`;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useRoutines deleteRoutine", () => {
  it("removes the routine from the list", () => {
    const { result } = renderRoutines();

    act(() => {
      result.current.deleteRoutine(FIRST_ID);
    });

    expect(result.current.routines.map((routine) => routine.id)).toEqual([
      SECOND_ID,
    ]);
  });

  it("removes only the checks of the deleted routine", () => {
    const { result } = renderRoutines();

    act(() => {
      result.current.deleteRoutine(FIRST_ID);
    });

    expect(Object.keys(result.current.routineChecks)).toEqual([
      `2026-10-${SECOND_ID}-1`,
    ]);
  });
});

describe("useRoutines addRoutine", () => {
  it("adds a routine with a UUID id to the end of the list", () => {
    const { result } = renderRoutinesAt(ROUTINES);

    act(() => {
      result.current.addRoutine("Stretch");
    });

    const added = result.current.routines[2];

    expect(result.current.routines).toHaveLength(3);
    expect(result.current.routines.slice(0, 2)).toEqual(ROUTINES);
    expect(added).toEqual({ id: expect.any(String), title: "Stretch" });
    expect(isUuid(added.id)).toBe(true);
  });
});

describe("useRoutines toggleRoutineCheck", () => {
  it("marks an unchecked day and keeps the other checks", () => {
    const { result } = renderRoutinesAt(ROUTINES, {
      [getKey(FIRST_ID, 1)]: true,
    });

    act(() => {
      result.current.toggleRoutineCheck(FIRST_ID, 5);
    });

    expect(result.current.routineChecks).toEqual({
      [getKey(FIRST_ID, 1)]: true,
      [getKey(FIRST_ID, 5)]: true,
    });
  });

  it("unmarks a checked day", () => {
    const { result } = renderRoutinesAt(ROUTINES, {
      [getKey(FIRST_ID, 5)]: true,
    });

    act(() => {
      result.current.toggleRoutineCheck(FIRST_ID, 5);
    });

    expect(result.current.routineChecks[getKey(FIRST_ID, 5)]).toBe(false);
  });

  it("keeps both checks when two days are toggled in the same update", () => {
    const { result } = renderRoutinesAt(ROUTINES);

    act(() => {
      result.current.toggleRoutineCheck(FIRST_ID, 3);
      result.current.toggleRoutineCheck(FIRST_ID, 4);
    });

    expect(result.current.routineChecks).toEqual({
      [getKey(FIRST_ID, 3)]: true,
      [getKey(FIRST_ID, 4)]: true,
    });
  });

  it("unmarks the day again when it is toggled twice in the same update", () => {
    const { result } = renderRoutinesAt(ROUTINES);

    act(() => {
      result.current.toggleRoutineCheck(FIRST_ID, 3);
      result.current.toggleRoutineCheck(FIRST_ID, 3);
    });

    expect(result.current.routineChecks[getKey(FIRST_ID, 3)]).toBe(false);
  });

  it("uses the month that is shown for the check key", () => {
    const { result } = renderRoutinesAt(ROUTINES);

    act(() => {
      result.current.setRoutineMonth(new Date(2026, 1, 1));
    });

    act(() => {
      result.current.toggleRoutineCheck(FIRST_ID, 14);
    });

    expect(result.current.getRoutineKeyForMonth(FIRST_ID, 14)).toBe(
      getKey(FIRST_ID, 14, 2),
    );
    expect(result.current.routineChecks[getKey(FIRST_ID, 14, 2)]).toBe(true);
  });
});

describe("useRoutines routineDays", () => {
  it("lists every day of the current month", () => {
    const { result } = renderRoutinesAt(ROUTINES);

    expect(result.current.routineYear).toBe(2026);
    expect(result.current.routineMonthIndex).toBe(9);
    expect(result.current.routineDays).toHaveLength(31);
    expect(result.current.routineDays[0]).toBe(1);
    expect(result.current.routineDays[30]).toBe(31);
  });

  it("follows the month that is set, including leap years", () => {
    const { result } = renderRoutinesAt(ROUTINES);

    act(() => {
      result.current.setRoutineMonth(new Date(2026, 1, 1));
    });

    expect(result.current.routineDays).toHaveLength(28);

    act(() => {
      result.current.setRoutineMonth(new Date(2028, 1, 1));
    });

    expect(result.current.routineDays).toHaveLength(29);
  });
});

describe("useRoutines getRoutineStreak", () => {
  it("counts the days in a row up to and including today", () => {
    const { result } = renderRoutinesAt(ROUTINES, {
      [getKey(FIRST_ID, 10)]: true,
      [getKey(FIRST_ID, 9)]: true,
      [getKey(FIRST_ID, 8)]: true,
    });

    expect(result.current.getRoutineStreak(FIRST_ID)).toBe(3);
  });

  it("keeps the streak from yesterday when today is not checked yet", () => {
    const { result } = renderRoutinesAt(ROUTINES, {
      [getKey(FIRST_ID, 9)]: true,
      [getKey(FIRST_ID, 8)]: true,
    });

    expect(result.current.getRoutineStreak(FIRST_ID)).toBe(2);
  });

  it("stops at the first day that is missing or unchecked", () => {
    const { result } = renderRoutinesAt(ROUTINES, {
      [getKey(FIRST_ID, 10)]: true,
      [getKey(FIRST_ID, 9)]: true,
      [getKey(FIRST_ID, 8)]: false,
      [getKey(FIRST_ID, 7)]: true,
    });

    expect(result.current.getRoutineStreak(FIRST_ID)).toBe(2);
  });

  it("returns 0 when the routine has no checks", () => {
    const { result } = renderRoutinesAt(ROUTINES, {
      [getKey(SECOND_ID, 10)]: true,
      [getKey(SECOND_ID, 9)]: true,
    });

    expect(result.current.getRoutineStreak(FIRST_ID)).toBe(0);
  });

  it("continues across the start of a month", () => {
    const { result } = renderRoutinesAt(
      ROUTINES,
      {
        [getKey(FIRST_ID, 2)]: true,
        [getKey(FIRST_ID, 1)]: true,
        [getKey(FIRST_ID, 30, 9)]: true,
      },
      "2026-10-02",
    );

    expect(result.current.getRoutineStreak(FIRST_ID)).toBe(3);
  });
});

describe("useRoutines getWeeklyProductivity", () => {
  it("returns seven days ordered from six days ago up to today", () => {
    const { result } = renderRoutinesAt(ROUTINES);

    const week = result.current.getWeeklyProductivity("en");

    expect(week.map((day) => day.label)).toEqual([
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ]);
    expect(week.map((day) => day.fullDate)).toEqual([
      "October 4",
      "October 5",
      "October 6",
      "October 7",
      "October 8",
      "October 9",
      "October 10",
    ]);
  });

  it("counts the completed routines of each day", () => {
    const { result } = renderRoutinesAt(ROUTINES, {
      [getKey(FIRST_ID, 10)]: true,
      [getKey(FIRST_ID, 9)]: true,
      [getKey(SECOND_ID, 9)]: true,
    });

    const week = result.current.getWeeklyProductivity("en");

    expect(week[6]).toMatchObject({ completed: 1, total: 2, percent: 50 });
    expect(week[5]).toMatchObject({ completed: 2, total: 2, percent: 100 });
    expect(week[0]).toMatchObject({ completed: 0, total: 2, percent: 0 });
  });

  it("rounds the percentage to a whole number", () => {
    const routines = [...ROUTINES, { id: THIRD_ID, title: "Routine 3" }];
    const { result } = renderRoutinesAt(routines, {
      [getKey(FIRST_ID, 10)]: true,
      [getKey(FIRST_ID, 9)]: true,
      [getKey(SECOND_ID, 9)]: true,
    });

    const week = result.current.getWeeklyProductivity("en");

    expect(week[6].percent).toBe(33);
    expect(week[5].percent).toBe(67);
  });

  it("returns 0 percent for every day when there are no routines", () => {
    const { result } = renderRoutinesAt([]);

    const week = result.current.getWeeklyProductivity("en");

    expect(week).toHaveLength(7);
    expect(week.every((day) => day.total === 0)).toBe(true);
    expect(week.every((day) => day.percent === 0)).toBe(true);
  });
});