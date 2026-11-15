import { describe, it, expect } from "vitest";
import { compareTasksForDay } from "./taskTime";

describe("compareTasksForDay", () => {
  it("puts timed tasks first, ordered by time, then untimed ones", () => {
    const tasks = [
      { id: "a", completed: false, dueTime: "" },
      { id: "b", completed: false, dueTime: "14:00" },
      { id: "c", completed: false, dueTime: "09:30" },
    ];

    expect([...tasks].sort(compareTasksForDay).map((task) => task.id)).toEqual([
      "c",
      "b",
      "a",
    ]);
  });

  it("keeps completed tasks last and the original order for ties", () => {
    const tasks = [
      { id: "a", completed: true, dueTime: "08:00" },
      { id: "b", completed: false, dueTime: "" },
      { id: "c", completed: false, dueTime: "" },
    ];

    expect([...tasks].sort(compareTasksForDay).map((task) => task.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });
});
