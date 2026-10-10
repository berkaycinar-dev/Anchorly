import { afterEach, describe, it, expect, vi } from "vitest";
import { addFutureOccurrences, generateRepeatOccurrences } from "./taskHelpers";

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

describe("generateRepeatOccurrences", () => {
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