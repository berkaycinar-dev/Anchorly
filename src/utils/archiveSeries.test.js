import { describe, it, expect } from "vitest";
import {
  buildSeriesList,
  filterOccurrences,
  getDaysFromToday,
  getOccurrenceStatus,
  getPageCount,
  getPageSlice,
  getPaginationItems,
  getSeriesSummary,
  getTodayPageIndex,
  isOneTimeTask,
  isRecurringTask,
} from "./archiveSeries";

const TODAY = "2026-11-03";

function createTask(overrides = {}) {
  return {
    id: "task-1",
    title: "Drink water",
    category: "Health",
    date: "2026-11-03",
    completed: false,
    completedAt: null,
    projectId: null,
    description: "",
    steps: [],
    order: 0,
    repeat: "daily",
    repeatGroupId: "group-1",
    attachments: [],
    ...overrides,
  };
}

function createDailyGroup(groupId, startDate, count, overrides = {}) {
  return Array.from({ length: count }, (_, index) => {
    const day = Number(startDate.slice(8)) + index;
    const date = `${startDate.slice(0, 8)}${String(day).padStart(2, "0")}`;

    return createTask({
      id: `${groupId}-${index}`,
      date,
      repeatGroupId: groupId,
      ...overrides,
    });
  });
}

describe("task kind helpers", () => {
  it("treats a task with a repeat group as recurring", () => {
    expect(isRecurringTask(createTask())).toBe(true);
    expect(isOneTimeTask(createTask())).toBe(false);
  });

  it("treats a task without a repeat group as one-time", () => {
    const task = createTask({ repeat: "none", repeatGroupId: null });

    expect(isRecurringTask(task)).toBe(false);
    expect(isOneTimeTask(task)).toBe(true);
  });
});

describe("getOccurrenceStatus", () => {
  it("returns done for a completed task whatever its date", () => {
    const past = createTask({ date: "2026-11-01", completed: true });
    const future = createTask({ date: "2026-11-09", completed: true });

    expect(getOccurrenceStatus(past, TODAY)).toBe("done");
    expect(getOccurrenceStatus(future, TODAY)).toBe("done");
  });

  it("returns missed for an incomplete task before today", () => {
    const task = createTask({ date: "2026-11-02" });

    expect(getOccurrenceStatus(task, TODAY)).toBe("missed");
  });

  it("returns today for an incomplete task dated today", () => {
    expect(getOccurrenceStatus(createTask(), TODAY)).toBe("today");
  });

  it("returns upcoming for an incomplete task after today", () => {
    const task = createTask({ date: "2026-11-04" });

    expect(getOccurrenceStatus(task, TODAY)).toBe("upcoming");
  });
});

describe("getDaysFromToday", () => {
  it("returns zero for today", () => {
    expect(getDaysFromToday("2026-11-03", TODAY)).toBe(0);
  });

  it("returns negative numbers for past dates", () => {
    expect(getDaysFromToday("2026-11-02", TODAY)).toBe(-1);
    expect(getDaysFromToday("2026-10-04", TODAY)).toBe(-30);
  });

  it("returns positive numbers for future dates", () => {
    expect(getDaysFromToday("2026-11-04", TODAY)).toBe(1);
  });

  it("stays exact across a daylight saving change", () => {
    expect(getDaysFromToday("2026-11-02", "2026-10-24")).toBe(9);
    expect(getDaysFromToday("2026-03-30", "2026-03-27")).toBe(3);
  });
});

describe("buildSeriesList", () => {
  it("ignores one-time tasks", () => {
    const oneTime = createTask({ repeat: "none", repeatGroupId: null });

    expect(buildSeriesList([oneTime], TODAY)).toEqual([]);
  });

  it("groups occurrences by repeat group id", () => {
    const tasks = [
      ...createDailyGroup("group-a", "2026-11-01", 5),
      ...createDailyGroup("group-b", "2026-11-02", 3),
    ];

    const list = buildSeriesList(tasks, TODAY);

    expect(list).toHaveLength(2);
    expect(list.map((series) => series.total).sort()).toEqual([3, 5]);
  });

  it("sorts occurrences by date inside a series", () => {
    const tasks = createDailyGroup("group-a", "2026-11-01", 4).reverse();

    const [series] = buildSeriesList(tasks, TODAY);

    expect(series.occurrences.map((task) => task.date)).toEqual([
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
    ]);
    expect(series.startDate).toBe("2026-11-01");
    expect(series.endDate).toBe("2026-11-04");
  });

  it("takes title and category from the first occurrence", () => {
    const tasks = [
      createTask({
        id: "late",
        date: "2026-11-05",
        title: "Renamed",
        category: "Work",
      }),
      createTask({
        id: "early",
        date: "2026-11-01",
        title: "Original",
        category: "Health",
      }),
    ];

    const [series] = buildSeriesList(tasks, TODAY);

    expect(series.title).toBe("Original");
    expect(series.category).toBe("Health");
  });

  it("takes the repeat kind from the last occurrence", () => {
    const tasks = [
      createTask({ id: "early", date: "2026-11-01", repeat: "daily" }),
      createTask({ id: "late", date: "2026-11-08", repeat: "weekly" }),
    ];

    const [series] = buildSeriesList(tasks, TODAY);

    expect(series.repeat).toBe("weekly");
  });

  it("counts elapsed, done, missed and remaining occurrences", () => {
    const tasks = createDailyGroup("group-a", "2026-11-01", 6);
    tasks[0].completed = true;
    tasks[2].completed = true;

    const [series] = buildSeriesList(tasks, TODAY);

    expect(series.total).toBe(6);
    expect(series.elapsedCount).toBe(3);
    expect(series.remainingCount).toBe(3);
    expect(series.doneCount).toBe(2);
    expect(series.missedCount).toBe(1);
    expect(series.percent).toBe(67);
  });

  it("does not count completed future occurrences as done", () => {
    const tasks = createDailyGroup("group-a", "2026-11-01", 6);
    tasks[5].completed = true;

    const [series] = buildSeriesList(tasks, TODAY);

    expect(series.doneCount).toBe(0);
    expect(series.percent).toBe(0);
  });

  it("returns zero percent when nothing has elapsed yet", () => {
    const tasks = createDailyGroup("group-a", "2026-11-10", 3);

    const [series] = buildSeriesList(tasks, TODAY);

    expect(series.elapsedCount).toBe(0);
    expect(series.percent).toBe(0);
  });

  it("finds the next incomplete occurrence from today onward", () => {
    const tasks = createDailyGroup("group-a", "2026-11-01", 6);
    tasks[2].completed = true;

    const [series] = buildSeriesList(tasks, TODAY);

    expect(series.nextDate).toBe("2026-11-04");
  });

  it("uses today as the next date while today is incomplete", () => {
    const tasks = createDailyGroup("group-a", "2026-11-01", 6);

    const [series] = buildSeriesList(tasks, TODAY);

    expect(series.nextDate).toBe("2026-11-03");
    expect(series.hasPendingToday).toBe(true);
  });

  it("returns a null next date when nothing is left to do", () => {
    const tasks = createDailyGroup("group-a", "2026-11-01", 3, {
      completed: true,
    });

    const [series] = buildSeriesList(tasks, TODAY);

    expect(series.nextDate).toBeNull();
    expect(series.hasPendingToday).toBe(false);
  });

  it("reports no pending today for a weekly series that skips today", () => {
    const tasks = [
      createTask({ id: "a", date: "2026-11-02", repeat: "weekly" }),
      createTask({ id: "b", date: "2026-11-09", repeat: "weekly" }),
    ];

    const [series] = buildSeriesList(tasks, TODAY);

    expect(series.hasPendingToday).toBe(false);
    expect(series.nextDate).toBe("2026-11-09");
  });

  it("sorts series by next date, then by title, with finished series last", () => {
    const finished = createDailyGroup("done-group", "2026-11-01", 2, {
      completed: true,
      title: "A finished",
    });
    const later = createDailyGroup("later-group", "2026-11-04", 2, {
      title: "B later",
    });
    const sooner = createDailyGroup("sooner-group", "2026-11-03", 2, {
      title: "C sooner",
    });
    const sameDay = createDailyGroup("same-group", "2026-11-03", 2, {
      title: "A same day",
    });

    const list = buildSeriesList(
      [...finished, ...later, ...sooner, ...sameDay],
      TODAY,
    );

    expect(list.map((series) => series.id)).toEqual([
      "same-group",
      "sooner-group",
      "later-group",
      "done-group",
    ]);
  });
});

describe("getSeriesSummary", () => {
  it("sums the figures of every series", () => {
    const first = createDailyGroup("group-a", "2026-11-01", 3);
    first[0].completed = true;
    const second = createDailyGroup("group-b", "2026-11-02", 3);
    second[0].completed = true;
    second[1].completed = true;

    const summary = getSeriesSummary(
      buildSeriesList([...first, ...second], TODAY),
    );

    expect(summary.activeCount).toBe(2);
    expect(summary.pendingTodayCount).toBe(1);
    expect(summary.elapsedCount).toBe(5);
    expect(summary.doneCount).toBe(3);
    expect(summary.percent).toBe(60);
  });

  it("returns zeros for an empty list", () => {
    expect(getSeriesSummary([])).toEqual({
      activeCount: 0,
      pendingTodayCount: 0,
      doneCount: 0,
      elapsedCount: 0,
      percent: 0,
    });
  });
});

describe("filterOccurrences", () => {
  const occurrences = [
    createTask({ id: "a", completed: true }),
    createTask({ id: "b", completed: false }),
    createTask({ id: "c", completed: true }),
  ];

  it("returns every occurrence for the all filter", () => {
    expect(filterOccurrences(occurrences, "all")).toHaveLength(3);
  });

  it("returns only completed occurrences for the done filter", () => {
    const result = filterOccurrences(occurrences, "done");

    expect(result.map((task) => task.id)).toEqual(["a", "c"]);
  });

  it("returns only incomplete occurrences for the todo filter", () => {
    const result = filterOccurrences(occurrences, "todo");

    expect(result.map((task) => task.id)).toEqual(["b"]);
  });
});

describe("pagination helpers", () => {
  it("counts pages with a minimum of one", () => {
    expect(getPageCount(0)).toBe(1);
    expect(getPageCount(8)).toBe(1);
    expect(getPageCount(9)).toBe(2);
    expect(getPageCount(120)).toBe(15);
  });

  it("slices a page and reports the visible range", () => {
    const items = Array.from({ length: 20 }, (_, index) => index);

    const result = getPageSlice(items, 1);

    expect(result.items).toEqual([8, 9, 10, 11, 12, 13, 14, 15]);
    expect(result.page).toBe(1);
    expect(result.pageCount).toBe(3);
    expect(result.from).toBe(9);
    expect(result.to).toBe(16);
    expect(result.total).toBe(20);
  });

  it("returns a short last page", () => {
    const items = Array.from({ length: 20 }, (_, index) => index);

    const result = getPageSlice(items, 2);

    expect(result.items).toEqual([16, 17, 18, 19]);
    expect(result.from).toBe(17);
    expect(result.to).toBe(20);
  });

  it("clamps an out-of-range page", () => {
    const items = Array.from({ length: 20 }, (_, index) => index);

    expect(getPageSlice(items, 99).page).toBe(2);
    expect(getPageSlice(items, -5).page).toBe(0);
  });

  it("handles an empty list", () => {
    const result = getPageSlice([], 0);

    expect(result.items).toEqual([]);
    expect(result.pageCount).toBe(1);
    expect(result.from).toBe(0);
    expect(result.to).toBe(0);
    expect(result.total).toBe(0);
  });

  it("finds the page that holds the first occurrence from today", () => {
    const occurrences = Array.from({ length: 30 }, (_, index) => ({
      date: `2026-10-${String(index + 1).padStart(2, "0")}`,
    })).concat(
      Array.from({ length: 10 }, (_, index) => ({
        date: `2026-11-${String(index + 1).padStart(2, "0")}`,
      })),
    );

    expect(getTodayPageIndex(occurrences, "2026-11-03")).toBe(4);
    expect(getTodayPageIndex(occurrences, "2026-10-01")).toBe(0);
  });

  it("falls back to the last page when every occurrence is in the past", () => {
    const occurrences = Array.from({ length: 20 }, (_, index) => ({
      date: `2026-10-${String(index + 1).padStart(2, "0")}`,
    }));

    expect(getTodayPageIndex(occurrences, "2026-11-03")).toBe(2);
  });

  it("returns page zero for an empty list", () => {
    expect(getTodayPageIndex([], TODAY)).toBe(0);
  });
});

describe("getPaginationItems", () => {
  it("lists every page when there are seven or fewer", () => {
    expect(getPaginationItems(0, 1)).toEqual([0]);
    expect(getPaginationItems(3, 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("collapses the end when the current page is near the start", () => {
    expect(getPaginationItems(0, 15)).toEqual([0, 1, "ellipsis-end", 14]);
    expect(getPaginationItems(2, 15)).toEqual([
      0,
      1,
      2,
      3,
      "ellipsis-end",
      14,
    ]);
  });

  it("collapses both sides in the middle", () => {
    expect(getPaginationItems(7, 15)).toEqual([
      0,
      "ellipsis-start",
      6,
      7,
      8,
      "ellipsis-end",
      14,
    ]);
  });

  it("collapses the start when the current page is near the end", () => {
    expect(getPaginationItems(14, 15)).toEqual([
      0,
      "ellipsis-start",
      13,
      14,
    ]);
    expect(getPaginationItems(12, 15)).toEqual([
      0,
      "ellipsis-start",
      11,
      12,
      13,
      14,
    ]);
  });
});
