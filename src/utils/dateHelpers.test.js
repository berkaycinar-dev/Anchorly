import { afterEach, describe, it, expect, vi } from "vitest";
import {
  addDaysToDateString,
  getLocalDateString,
  getNextRepeatDate,
  getWeekDays,
  getWeekStartDate,
  getWeekStartOffset,
  parseLocalDate,
} from "./dateHelpers";

const saturday = new Date(2026, 9, 10);
const sunday = new Date(2026, 9, 11);
const monday = new Date(2026, 9, 12);

afterEach(() => {
  vi.useRealTimers();
});

describe("getWeekStartOffset", () => {
  it("returns 0 for Monday and 6 for Sunday when the week starts on Monday", () => {
    expect(getWeekStartOffset(monday, "monday")).toBe(0);
    expect(getWeekStartOffset(sunday, "monday")).toBe(6);
  });

  it("returns 0 for Sunday and 1 for Monday when the week starts on Sunday", () => {
    expect(getWeekStartOffset(sunday, "sunday")).toBe(0);
    expect(getWeekStartOffset(monday, "sunday")).toBe(1);
  });
});

describe("getWeekStartDate", () => {
  it("finds the start of the week for a Saturday", () => {
    expect(getWeekStartDate(saturday, "monday").getDate()).toBe(5);
    expect(getWeekStartDate(saturday, "sunday").getDate()).toBe(4);
  });
});

describe("getWeekDays", () => {
  it("returns 7 consecutive days starting with the week start", () => {
    const days = getWeekDays(saturday, "monday");

    expect(days).toHaveLength(7);
    expect(days[0].getDate()).toBe(5);
    expect(days[6].getDate()).toBe(11);
  });
});

describe("getLocalDateString", () => {
  it("uses the local day instead of the UTC day after midnight", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-08T21:30:00Z"));

    expect(getLocalDateString()).toBe("2026-10-09");
  });

  it("returns the correct day across a year boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-31T21:30:00Z"));

    expect(getLocalDateString()).toBe("2027-01-01");
  });

  it("pads single-digit months and days with a zero", () => {
    expect(getLocalDateString(new Date(2026, 2, 5))).toBe("2026-03-05");
  });
});

describe("parseLocalDate", () => {
  it("parses a YYYY-MM-DD string as local midnight", () => {
    const date = parseLocalDate("2026-10-09");

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(9);
    expect(date.getHours()).toBe(0);
  });
});

describe("addDaysToDateString", () => {
  it("adds and subtracts days", () => {
    expect(addDaysToDateString("2026-10-09", 1)).toBe("2026-10-10");
    expect(addDaysToDateString("2026-10-09", 7)).toBe("2026-10-16");
    expect(addDaysToDateString("2026-10-09", -1)).toBe("2026-10-08");
  });

  it("crosses month and year boundaries", () => {
    expect(addDaysToDateString("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDaysToDateString("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToDateString("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("handles leap years correctly", () => {
    expect(addDaysToDateString("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDaysToDateString("2027-02-28", 1)).toBe("2027-03-01");
  });
});

describe("getNextRepeatDate", () => {
  it("returns the next day for a daily repeat", () => {
    expect(getNextRepeatDate("2026-10-09", "daily")).toBe("2026-10-10");
  });

  it("returns the date 7 days later for a weekly repeat", () => {
    expect(getNextRepeatDate("2026-10-09", "weekly")).toBe("2026-10-16");
  });

  it("works at the end of a month and the end of a year", () => {
    expect(getNextRepeatDate("2026-01-31", "daily")).toBe("2026-02-01");
    expect(getNextRepeatDate("2026-12-31", "daily")).toBe("2027-01-01");
    expect(getNextRepeatDate("2026-12-28", "weekly")).toBe("2027-01-04");
  });

  it("keeps the date unchanged when there is no repeat", () => {
    expect(getNextRepeatDate("2026-10-09", "none")).toBe("2026-10-09");
  });
});