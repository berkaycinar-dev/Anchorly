import { afterEach, describe, it, expect, vi } from "vitest";
import {
  addFutureOccurrences,
  applyTaskOrder,
  generateRepeatOccurrences,
  getReorderedActiveTaskIds,
  isTaskVisibleToday,
} from "./taskHelpers";

function createRepeatingTask(overrides = {}) {
  return {
    id: "task-1",
    title: "Drink water",
    category: "Personal",
    date: "2026-10-10",
    completed: true,
    completedAt: "2026-10-10",
    projectId: null,
    description: "",
    steps: [{ id: "step-1", text: "Fill the glass", done: true }],
    order: 0,
    repeat: "daily",
    repeatGroupId: "group-1",
    attachments: [
      { id: "file-1", name: "note.txt", type: "text/plain", data: "" },
    ],
    ...overrides,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("addFutureOccurrences", () => {
  it("generates a daily task up to the 120-day horizon from today", () => {
    const baseTask = createRepeatingTask();

    const result = generateRepeatOccurrences(
      baseTask,
      [baseTask],
      "2026-10-10",
    );

    expect(result).toHaveLength(120);
    expect(result[0].date).toBe("2026-10-11");
    expect(result[119].date).toBe("2027-02-07");
  });

  it("generates a weekly task 7 days apart", () => {
    const baseTask = createRepeatingTask({ repeat: "weekly" });

    const result = generateRepeatOccurrences(
      baseTask,
      [baseTask],
      "2026-10-10",
    );

    expect(result).toHaveLength(17);
    expect(result[0].date).toBe("2026-10-17");
    expect(result[16].date).toBe("2027-02-06");
  });

  it("generates new tasks in a reset state", () => {
    const baseTask = createRepeatingTask();

    const [first] = generateRepeatOccurrences(
      baseTask,
      [baseTask],
      "2026-10-10",
    );

    expect(first.completed).toBe(false);
    expect(first.completedAt).toBeNull();
    expect(first.steps).toEqual([
      { id: "step-1", text: "Fill the glass", done: false },
    ]);
    expect(first.attachments).toEqual([]);
    expect(first.repeatGroupId).toBe("group-1");
    expect(first.id).not.toBe(baseTask.id);
  });

  it("does not regenerate dates that already exist in the same group", () => {
    const baseTask = createRepeatingTask();
    const existing = createRepeatingTask({ id: "task-2", date: "2026-10-11" });

    const result = generateRepeatOccurrences(
      baseTask,
      [baseTask, existing],
      "2026-10-10",
    );

    expect(result.map((task) => task.date)).not.toContain("2026-10-11");
    expect(result).toHaveLength(119);
  });

  it("returns an empty list for a task without a repeat", () => {
    const baseTask = createRepeatingTask({ repeat: "none" });

    expect(
      generateRepeatOccurrences(baseTask, [baseTask], "2026-10-10"),
    ).toEqual([]);
  });

  it("uses the local day when today is not given (midnight bug)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-08T21:30:00Z"));
    const baseTask = createRepeatingTask({ date: "2026-10-09" });

    const result = generateRepeatOccurrences(baseTask, [baseTask]);

    expect(result[result.length - 1].date).toBe("2027-02-06");
  });
});

describe("isTaskVisibleToday", () => {
  const today = "2026-10-10";

  function createTask(overrides = {}) {
    return {
      id: "task-1",
      title: "Write report",
      date: today,
      completed: false,
      completedAt: null,
      projectId: null,
      ...overrides,
    };
  }

  it("shows an incomplete task dated today", () => {
    expect(isTaskVisibleToday(createTask(), today)).toBe(true);
  });

  it("hides a task dated tomorrow", () => {
    expect(isTaskVisibleToday(createTask({ date: "2026-10-11" }), today)).toBe(
      false,
    );
  });

  it("hides an incomplete task dated yesterday", () => {
    expect(isTaskVisibleToday(createTask({ date: "2026-10-09" }), today)).toBe(
      false,
    );
  });

  it("shows a dateless task that has no project", () => {
    expect(isTaskVisibleToday(createTask({ date: "" }), today)).toBe(true);
  });

  it("hides a dateless task that belongs to a project", () => {
    expect(
      isTaskVisibleToday(
        createTask({ date: "", projectId: "project-1" }),
        today,
      ),
    ).toBe(false);
  });

  it("shows a task dated today that belongs to a project", () => {
    expect(
      isTaskVisibleToday(createTask({ projectId: "project-1" }), today),
    ).toBe(true);
  });

  it("shows a task that was completed today", () => {
    const task = createTask({ completed: true, completedAt: today });

    expect(isTaskVisibleToday(task, today)).toBe(true);
  });

  it("hides a task that was completed yesterday", () => {
    const task = createTask({
      date: "",
      completed: true,
      completedAt: "2026-10-09",
    });

    expect(isTaskVisibleToday(task, today)).toBe(false);
  });
});

describe("addFutureOccurrences", () => {
  it("continues from the last task of each repeat group", () => {
    const first = createRepeatingTask({ date: "2026-10-10" });
    const last = createRepeatingTask({ id: "task-2", date: "2026-10-12" });

    const result = addFutureOccurrences([first, last], "2026-10-10");

    const dates = result.map((task) => task.date).sort();

    expect(result).toHaveLength(2 + 118);
    expect(dates[dates.length - 1]).toBe("2027-02-07");
  });

  it("leaves non-repeating tasks untouched", () => {
    const single = createRepeatingTask({ repeat: "none", repeatGroupId: null });

    expect(addFutureOccurrences([single], "2026-10-10")).toEqual([single]);
  });
});
function createOrderedTask(id, order, completed = false) {
  return { id, title: `Task ${id}`, order, completed };
}

describe("getReorderedActiveTaskIds", () => {
  const tasks = [
    createOrderedTask("c", 2),
    createOrderedTask("a", 0),
    createOrderedTask("done", 1, true),
    createOrderedTask("b", 1),
  ];

  it("returns the active ids sorted by order when a task moves down", () => {
    expect(getReorderedActiveTaskIds(tasks, "a", "c")).toEqual(["b", "c", "a"]);
  });

  it("returns the active ids sorted by order when a task moves up", () => {
    expect(getReorderedActiveTaskIds(tasks, "c", "a")).toEqual(["c", "a", "b"]);
  });

  it("leaves completed tasks out of the list", () => {
    expect(getReorderedActiveTaskIds(tasks, "b", "a")).not.toContain("done");
  });

  it("returns null when the dragged or target task is not active", () => {
    expect(getReorderedActiveTaskIds(tasks, "done", "a")).toBeNull();
    expect(getReorderedActiveTaskIds(tasks, "a", "missing")).toBeNull();
  });

  it("does not change the tasks it receives", () => {
    const copy = structuredClone(tasks);

    getReorderedActiveTaskIds(tasks, "a", "c");

    expect(tasks).toEqual(copy);
  });
});

describe("applyTaskOrder", () => {
  it("sets each listed task's order to its position in the list", () => {
    const tasks = [createOrderedTask("a", 0), createOrderedTask("b", 1)];

    const result = applyTaskOrder(tasks, ["b", "a"]);

    expect(result).toEqual([
      createOrderedTask("a", 1),
      createOrderedTask("b", 0),
    ]);
  });

  it("keeps tasks that are not in the list unchanged", () => {
    const done = createOrderedTask("done", 7, true);
    const tasks = [createOrderedTask("a", 0), done];

    const result = applyTaskOrder(tasks, ["a"]);

    expect(result[1]).toBe(done);
  });

  it("does not change the tasks it receives", () => {
    const tasks = [createOrderedTask("a", 0), createOrderedTask("b", 1)];
    const copy = structuredClone(tasks);

    applyTaskOrder(tasks, ["b", "a"]);

    expect(tasks).toEqual(copy);
  });
});