import { describe, expect, it } from "vitest";
import {
  getCategoryCounts,
  getCategoryTone,
  getMonthCells,
  getOverdueTasks,
  getProjectProgress,
  getTasksForDate,
  getUpcomingDays,
  getWeekdayLabels,
  getWeekRange,
  limitList,
} from "./dashboardData";

const task = (id, extra) => ({
  id,
  title: id,
  category: "Work",
  date: null,
  completed: false,
  projectId: null,
  order: 0,
  ...extra,
});

describe("dashboard data", () => {
  it("shows up to four items and three plus the rest beyond that", () => {
    expect(limitList([1, 2, 3, 4])).toEqual({ shown: [1, 2, 3, 4], hidden: 0 });
    expect(limitList([1, 2, 3, 4, 5, 6])).toEqual({
      shown: [1, 2, 3],
      hidden: 3,
    });
    expect(limitList([])).toEqual({ shown: [], hidden: 0 });
  });

  it("maps categories to tones", () => {
    expect(getCategoryTone("Self Development")).toBe("growth");
    expect(getCategoryTone("Health")).toBe("health");
    expect(getCategoryTone("Unknown")).toBe("other");
  });

  it("lists the tasks of a date in order", () => {
    const tasks = [
      task("b", { date: "2026-11-02", order: 2 }),
      task("x", { date: "2026-11-03" }),
      task("a", { date: "2026-11-02", order: 1 }),
    ];

    expect(getTasksForDate(tasks, "2026-11-02").map((t) => t.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("lists unfinished tasks from before today, oldest first", () => {
    const tasks = [
      task("late2", { date: "2026-11-01" }),
      task("done", { date: "2026-10-01", completed: true }),
      task("today", { date: "2026-11-02" }),
      task("late1", { date: "2026-10-20" }),
      task("undated"),
    ];

    expect(getOverdueTasks(tasks, "2026-11-02").map((t) => t.id)).toEqual([
      "late1",
      "late2",
    ]);
  });

  it("groups the unfinished tasks of the coming days and skips empty days", () => {
    const tasks = [
      task("d3", { date: "2026-11-05", order: 2 }),
      task("d3b", { date: "2026-11-05", order: 1 }),
      task("d1", { date: "2026-11-03" }),
      task("done", { date: "2026-11-04", completed: true }),
      task("today", { date: "2026-11-02" }),
      task("far", { date: "2026-11-10" }),
    ];

    expect(getUpcomingDays(tasks, "2026-11-02", 7)).toEqual([
      { date: "2026-11-03", tasks: [tasks[2]] },
      { date: "2026-11-05", tasks: [tasks[1], tasks[0]] },
    ]);
  });

  it("measures project progress and finds the next date", () => {
    const tasks = [
      task("a", { projectId: "p1", completed: true }),
      task("b", { projectId: "p1", date: "2026-11-09" }),
      task("c", { projectId: "p1", date: "2026-11-04" }),
      task("d", { projectId: "p2", completed: true, date: "2026-11-01" }),
    ];

    expect(
      getProjectProgress(
        [
          { id: "p1", name: "One" },
          { id: "p2", name: "Two" },
          { id: "p3", name: "Three" },
        ],
        tasks,
      ),
    ).toEqual([
      {
        id: "p1",
        name: "One",
        done: 1,
        total: 3,
        percent: 33,
        nextDate: "2026-11-04",
      },
      {
        id: "p2",
        name: "Two",
        done: 1,
        total: 1,
        percent: 100,
        nextDate: null,
      },
      {
        id: "p3",
        name: "Three",
        done: 0,
        total: 0,
        percent: 0,
        nextDate: null,
      },
    ]);
  });

  it("finds the week around today for both week starts", () => {
    expect(getWeekRange("2026-11-04", "monday")).toEqual({
      start: "2026-11-02",
      end: "2026-11-08",
    });
    expect(getWeekRange("2026-11-04", "sunday")).toEqual({
      start: "2026-11-01",
      end: "2026-11-07",
    });
  });

  it("counts the tasks of a week by category in a fixed order", () => {
    const tasks = [
      task("a", { date: "2026-11-02" }),
      task("b", { date: "2026-11-08", category: "Health" }),
      task("c", { date: "2026-11-03", category: "Mystery" }),
      task("d", { date: "2026-11-09" }),
      task("e"),
    ];

    expect(
      getCategoryCounts(tasks, { start: "2026-11-02", end: "2026-11-08" }),
    ).toEqual([
      { category: "Work", count: 1 },
      { category: "Personal", count: 0 },
      { category: "Self Development", count: 0 },
      { category: "Health", count: 1 },
      { category: "Project", count: 0 },
      { category: "Other", count: 1 },
    ]);
  });

  it("lays out the month with leading blanks for the week start", () => {
    const monday = getMonthCells("2026-11-15", "monday");
    const sunday = getMonthCells("2026-11-15", "sunday");

    expect(monday.slice(0, 7)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      "2026-11-01",
    ]);
    expect(monday).toHaveLength(36);
    expect(monday.at(-1)).toBe("2026-11-30");
    expect(sunday[0]).toBe("2026-11-01");
    expect(sunday).toHaveLength(30);
  });

  it("names the weekdays from the week start", () => {
    expect(getWeekdayLabels("monday", "en-US")).toEqual([
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ]);
    expect(getWeekdayLabels("sunday", "en-US")[0]).toBe("Sun");
    expect(getWeekdayLabels("monday", "tr-TR")[0]).toBe("Pzt");
  });
});
