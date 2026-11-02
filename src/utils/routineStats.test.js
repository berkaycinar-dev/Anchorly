import { describe, it, expect } from "vitest";
import {
  calculateRoutineStreak,
  calculateWeeklyProductivity,
  getDayProgress,
  getLongestActiveStreak,
  getMonthAverage,
  getRoutineHistory,
  getRoutineMonthProgress,
  isRoutineCheckedOn,
} from "./routineStats";

const FIRST_ID = "42a8fe5c-29ef-47b1-a3f3-1af09f7b5a20";
const SECOND_ID = "cfd63e9e-901f-44fd-8ab6-2ef4bd8133d8";

const ROUTINES = [
  { id: FIRST_ID, title: "Routine 1" },
  { id: SECOND_ID, title: "Routine 2" },
];

function getKey(routineId, day, month = 10) {
  return `2026-${month}-${routineId}-${day}`;
}

describe("calculateRoutineStreak", () => {
  it("counts the days in a row up to and including today", () => {
    const checks = {
      [getKey(FIRST_ID, 10)]: true,
      [getKey(FIRST_ID, 9)]: true,
      [getKey(FIRST_ID, 8)]: true,
    };

    expect(calculateRoutineStreak(checks, FIRST_ID, "2026-10-10")).toBe(3);
  });

  it("starts from yesterday when today is not checked yet", () => {
    const checks = {
      [getKey(FIRST_ID, 9)]: true,
      [getKey(FIRST_ID, 8)]: true,
    };

    expect(calculateRoutineStreak(checks, FIRST_ID, "2026-10-10")).toBe(2);
  });

  it("returns 0 when neither today nor yesterday is checked", () => {
    const checks = {
      [getKey(FIRST_ID, 8)]: true,
      [getKey(FIRST_ID, 7)]: true,
    };

    expect(calculateRoutineStreak(checks, FIRST_ID, "2026-10-10")).toBe(0);
  });

  it("ignores the checks of other routines", () => {
    const checks = {
      [getKey(SECOND_ID, 10)]: true,
      [getKey(SECOND_ID, 9)]: true,
    };

    expect(calculateRoutineStreak(checks, FIRST_ID, "2026-10-10")).toBe(0);
  });

  it("continues across the start of a year", () => {
    const checks = {
      [`2027-1-${FIRST_ID}-1`]: true,
      [`2026-12-${FIRST_ID}-31`]: true,
      [`2026-12-${FIRST_ID}-30`]: true,
    };

    expect(calculateRoutineStreak(checks, FIRST_ID, "2027-01-01")).toBe(3);
  });
});

describe("calculateWeeklyProductivity", () => {
  it("uses Turkish day and month names for the Turkish language", () => {
    const week = calculateWeeklyProductivity(ROUTINES, {}, "2026-10-10", "tr");

    expect(week[6].label).toBe("Cmt");
    expect(week[6].fullDate).toBe("10 Ekim");
    expect(week[0].fullDate).toBe("4 Ekim");
  });

  it("counts only the routines in the given list", () => {
    const checks = {
      [getKey(FIRST_ID, 10)]: true,
      [getKey(SECOND_ID, 10)]: true,
    };

    const week = calculateWeeklyProductivity(
      [ROUTINES[0]],
      checks,
      "2026-10-10",
      "en",
    );

    expect(week[6]).toMatchObject({ completed: 1, total: 1, percent: 100 });
  });

  it("does not change the routines or the checks it receives", () => {
    const routines = structuredClone(ROUTINES);
    const checks = { [getKey(FIRST_ID, 10)]: true };

    calculateWeeklyProductivity(routines, checks, "2026-10-10", "en");

    expect(routines).toEqual(ROUTINES);
    expect(checks).toEqual({ [getKey(FIRST_ID, 10)]: true });
  });
});

describe("isRoutineCheckedOn", () => {
  it("reads the check of the given routine and date", () => {
    const checks = { [getKey(FIRST_ID, 5)]: true };

    expect(isRoutineCheckedOn(checks, FIRST_ID, "2026-10-05")).toBe(true);
    expect(isRoutineCheckedOn(checks, FIRST_ID, "2026-10-06")).toBe(false);
    expect(isRoutineCheckedOn(checks, SECOND_ID, "2026-10-05")).toBe(false);
  });

  it("treats a check that was turned off as unchecked", () => {
    const checks = { [getKey(FIRST_ID, 5)]: false };

    expect(isRoutineCheckedOn(checks, FIRST_ID, "2026-10-05")).toBe(false);
  });
});

describe("getDayProgress", () => {
  it("counts the routines checked on the given date", () => {
    const checks = { [getKey(FIRST_ID, 5)]: true };

    expect(getDayProgress(ROUTINES, checks, "2026-10-05")).toEqual({
      completed: 1,
      total: 2,
      percent: 50,
    });
  });

  it("returns 0 percent when there are no routines", () => {
    expect(getDayProgress([], {}, "2026-10-05")).toEqual({
      completed: 0,
      total: 0,
      percent: 0,
    });
  });
});

describe("getRoutineHistory", () => {
  it("lists the given number of days ending on the given date", () => {
    const checks = {
      [getKey(FIRST_ID, 1)]: true,
      [getKey(FIRST_ID, 30, 9)]: true,
    };

    const history = getRoutineHistory(checks, FIRST_ID, "2026-10-02", 4);

    expect(history).toEqual([
      { date: "2026-09-29", checked: false },
      { date: "2026-09-30", checked: true },
      { date: "2026-10-01", checked: true },
      { date: "2026-10-02", checked: false },
    ]);
  });
});

describe("getRoutineMonthProgress", () => {
  it("counts the checked days in the month of the given date", () => {
    const checks = {
      [getKey(FIRST_ID, 1)]: true,
      [getKey(FIRST_ID, 31)]: true,
      [getKey(FIRST_ID, 30, 9)]: true,
      [getKey(SECOND_ID, 2)]: true,
    };

    expect(getRoutineMonthProgress(checks, FIRST_ID, "2026-10-15")).toEqual({
      completed: 2,
      total: 31,
    });
  });

  it("uses the length of February in a leap year", () => {
    expect(getRoutineMonthProgress({}, FIRST_ID, "2028-02-10").total).toBe(29);
  });
});

describe("getMonthAverage", () => {
  it("averages the checks from the first day of the month up to today", () => {
    const checks = {
      [getKey(FIRST_ID, 1)]: true,
      [getKey(FIRST_ID, 2)]: true,
      [getKey(SECOND_ID, 2)]: true,
      [getKey(FIRST_ID, 3)]: true,
    };

    expect(getMonthAverage(ROUTINES, checks, "2026-10-02")).toBe(75);
  });

  it("returns 0 when there are no routines", () => {
    expect(getMonthAverage([], {}, "2026-10-02")).toBe(0);
  });
});

describe("getLongestActiveStreak", () => {
  it("returns the routine with the longest streak", () => {
    const checks = {
      [getKey(FIRST_ID, 10)]: true,
      [getKey(SECOND_ID, 10)]: true,
      [getKey(SECOND_ID, 9)]: true,
    };

    expect(getLongestActiveStreak(ROUTINES, checks, "2026-10-10")).toEqual({
      routine: ROUTINES[1],
      streak: 2,
    });
  });

  it("returns null when no routine has an active streak", () => {
    expect(getLongestActiveStreak(ROUTINES, {}, "2026-10-10")).toBeNull();
  });
});
