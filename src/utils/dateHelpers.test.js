import { describe, it, expect } from "vitest";
import {
  getWeekStartOffset,
  getWeekStartDate,
  getWeekDays,
} from "./dateHelpers";

const saturday = new Date(2026, 9, 10);
const sunday = new Date(2026, 9, 11);
const monday = new Date(2026, 9, 12);

describe("getWeekStartOffset", () => {
  it("Pazartesi başlangıcında Pazartesi 0, Pazar 6 döner", () => {
    expect(getWeekStartOffset(monday, "monday")).toBe(0);
    expect(getWeekStartOffset(sunday, "monday")).toBe(6);
  });

  it("Pazar başlangıcında Pazar 0, Pazartesi 1 döner", () => {
    expect(getWeekStartOffset(sunday, "sunday")).toBe(0);
    expect(getWeekStartOffset(monday, "sunday")).toBe(1);
  });
});

describe("getWeekStartDate", () => {
  it("Cumartesi için haftanın başlangıç gününü bulur", () => {
    expect(getWeekStartDate(saturday, "monday").getDate()).toBe(5);
    expect(getWeekStartDate(saturday, "sunday").getDate()).toBe(4);
  });
});

describe("getWeekDays", () => {
  it("7 ardışık gün döner ve ilki hafta başlangıcıdır", () => {
    const days = getWeekDays(saturday, "monday");

    expect(days).toHaveLength(7);
    expect(days[0].getDate()).toBe(5);
    expect(days[6].getDate()).toBe(11);
  });
});