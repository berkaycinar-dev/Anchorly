import { describe, it, expect } from "vitest";
import {
  calculateRoutineStreak,
  calculateWeeklyProductivity,
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
