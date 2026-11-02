import { describe, expect, it } from "vitest";
import {
  getCompletionPercent,
  getDefaultSelectedDate,
  getMonthGridCells,
  getWeekdayHeaders,
  groupTasksByDate,
} from "./calendarHelpers";

describe("getMonthGridCells", () => {
  it("pads October 2026 to five full weeks starting on Monday", () => {
    const cells = getMonthGridCells(2026, 9, "monday");

    expect(cells).toHaveLength(35);
    expect(cells[0].dateString).toBe("2026-09-28");
    expect(cells[34].dateString).toBe("2026-11-01");
    expect(cells.filter((cell) => cell.inMonth)).toHaveLength(31);
  });

  it("starts the grid on Sunday when the week starts on Sunday", () => {
    const cells = getMonthGridCells(2026, 9, "sunday");

    expect(cells[0].dateString).toBe("2026-09-27");
    expect(cells[0].isWeekend).toBe(true);
    expect(cells[6].isWeekend).toBe(true);
    expect(cells.length % 7).toBe(0);
  });

  it("adds a sixth week when the month needs it", () => {
    expect(getMonthGridCells(2026, 7, "monday")).toHaveLength(42);
  });

  it("uses four weeks for a month that fits exactly", () => {
    expect(getMonthGridCells(2027, 1, "monday")).toHaveLength(28);
  });

  it("marks only Saturdays and Sundays as weekend days", () => {
    const weekendDates = getMonthGridCells(2026, 9, "monday")
      .filter((cell) => cell.isWeekend)
      .map((cell) => cell.dateString);

    expect(weekendDates).toEqual([
      "2026-10-03",
      "2026-10-04",
      "2026-10-10",
      "2026-10-11",
      "2026-10-17",
      "2026-10-18",
      "2026-10-24",
      "2026-10-25",
      "2026-10-31",
      "2026-11-01",
    ]);
  });
});

describe("groupTasksByDate", () => {
  it("groups tasks by date and sorts each group by order", () => {
    const groups = groupTasksByDate([
      { id: "a", date: "2026-10-10", order: 3 },
      { id: "b", date: "2026-10-10", order: 1 },
      { id: "c", date: "2026-10-11", order: 2 },
    ]);

    expect(groups.get("2026-10-10").map((task) => task.id)).toEqual(["b", "a"]);
    expect(groups.get("2026-10-11").map((task) => task.id)).toEqual(["c"]);
  });

  it("ignores tasks without a date", () => {
    const groups = groupTasksByDate([
      { id: "a", date: "", order: 1 },
      { id: "b", order: 2 },
    ]);

    expect(groups.size).toBe(0);
  });
});

describe("getCompletionPercent", () => {
  it("returns null when there are no tasks", () => {
    expect(getCompletionPercent([])).toBeNull();
  });

  it("rounds the share of completed tasks", () => {
    expect(
      getCompletionPercent([
        { completed: true },
        { completed: false },
        { completed: false },
      ]),
    ).toBe(33);
    expect(getCompletionPercent([{ completed: true }])).toBe(100);
  });
});

describe("getDefaultSelectedDate", () => {
  it("selects today when it is inside the month", () => {
    expect(getDefaultSelectedDate(2026, 9, "2026-10-20")).toBe("2026-10-20");
  });

  it("selects the first day of another month", () => {
    expect(getDefaultSelectedDate(2026, 10, "2026-10-20")).toBe("2026-11-01");
  });
});

describe("getWeekdayHeaders", () => {
  it("uses full names on weekdays and short names on weekend columns", () => {
    const headers = getWeekdayHeaders("monday", "en-US");

    expect(headers.map((header) => header.label)).toEqual([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SAT",
      "SUN",
    ]);
    expect(headers.map((header) => header.isWeekend)).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
      true,
    ]);
  });

  it("puts the weekend columns on both ends when the week starts on Sunday", () => {
    const headers = getWeekdayHeaders("sunday", "en-US");

    expect(headers[0]).toMatchObject({ label: "SUN", isWeekend: true });
    expect(headers[6]).toMatchObject({ label: "SAT", isWeekend: true });
  });

  it("uppercases Turkish names with Turkish rules", () => {
    const labels = getWeekdayHeaders("monday", "tr-TR").map(
      (header) => header.label,
    );

    expect(labels[0]).toBe("PAZARTESİ");
    expect(labels[2]).toBe("ÇARŞAMBA");
  });
});
