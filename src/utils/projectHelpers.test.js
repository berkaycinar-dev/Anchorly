import { describe, it, expect } from "vitest";
import {
  filterTasksByCategory,
  formatShortDate,
  getDaysLeft,
  getOpenTaskCount,
  getProjectColorKey,
  getProjectInitial,
  getProjectProgress,
  getStepProgress,
  getTaskColumn,
  groupTasksByColumn,
  PROJECT_COLOR_KEYS,
  splitProjects,
} from "./projectHelpers";

function createTask(overrides = {}) {
  return {
    id: "task",
    title: "Task",
    category: "Work",
    completed: false,
    projectId: "project-1",
    steps: [],
    order: 0,
    ...overrides,
  };
}

describe("getTaskColumn", () => {
  it("puts a task without finished steps in todo", () => {
    const task = createTask({
      steps: [{ id: "a", text: "A", done: false }],
    });

    expect(getTaskColumn(task)).toBe("todo");
    expect(getTaskColumn(createTask())).toBe("todo");
  });

  it("puts an open task with a finished step in doing", () => {
    const task = createTask({
      steps: [
        { id: "a", text: "A", done: true },
        { id: "b", text: "B", done: false },
      ],
    });

    expect(getTaskColumn(task)).toBe("doing");
  });

  it("puts a completed task in done even when its steps are not finished", () => {
    const task = createTask({
      completed: true,
      steps: [{ id: "a", text: "A", done: false }],
    });

    expect(getTaskColumn(task)).toBe("done");
  });
});

describe("getTaskColumn with a board status", () => {
  const startedSteps = [{ id: "a", text: "A", done: true }];

  it("keeps a task in doing when the board status says doing", () => {
    expect(getTaskColumn(createTask({ boardStatus: "doing" }))).toBe("doing");
  });

  it("keeps a task with finished steps in todo when the board status says todo", () => {
    const task = createTask({ steps: startedSteps, boardStatus: "todo" });

    expect(getTaskColumn(task)).toBe("todo");
  });

  it("puts a completed task in done whatever the board status is", () => {
    const task = createTask({ completed: true, boardStatus: "doing" });

    expect(getTaskColumn(task)).toBe("done");
  });

  it("ignores an unknown board status", () => {
    const task = createTask({ steps: startedSteps, boardStatus: "other" });

    expect(getTaskColumn(task)).toBe("doing");
  });
});

describe("groupTasksByColumn", () => {
  it("groups tasks by column and keeps the task order inside each column", () => {
    const tasks = [
      createTask({ id: "b", order: 2 }),
      createTask({ id: "a", order: 1 }),
      createTask({ id: "c", order: 3, completed: true }),
    ];

    const columns = groupTasksByColumn(tasks);

    expect(columns.todo.map((task) => task.id)).toEqual(["a", "b"]);
    expect(columns.doing).toEqual([]);
    expect(columns.done.map((task) => task.id)).toEqual(["c"]);
  });

  it("does not change the order of the given array", () => {
    const tasks = [
      createTask({ id: "b", order: 2 }),
      createTask({ id: "a", order: 1 }),
    ];

    groupTasksByColumn(tasks);

    expect(tasks.map((task) => task.id)).toEqual(["b", "a"]);
  });
});

describe("getProjectProgress", () => {
  it("counts completed tasks and gives the ratio", () => {
    const tasks = [
      createTask({ completed: true }),
      createTask({ completed: false }),
      createTask({ completed: true }),
      createTask({ completed: false }),
    ];

    expect(getProjectProgress(tasks)).toEqual({
      done: 2,
      total: 4,
      ratio: 0.5,
    });
  });

  it("gives a zero ratio for a project without tasks", () => {
    expect(getProjectProgress([])).toEqual({ done: 0, total: 0, ratio: 0 });
  });
});

describe("getStepProgress", () => {
  it("counts finished and all steps", () => {
    const task = createTask({
      steps: [
        { id: "a", text: "A", done: true },
        { id: "b", text: "B", done: false },
        { id: "c", text: "C", done: true },
      ],
    });

    expect(getStepProgress(task)).toEqual({ done: 2, total: 3 });
  });
});

describe("getOpenTaskCount", () => {
  it("counts only the open tasks of the given project", () => {
    const tasks = [
      createTask({ projectId: "project-1" }),
      createTask({ projectId: "project-1", completed: true }),
      createTask({ projectId: "project-2" }),
      createTask({ projectId: null }),
    ];

    expect(getOpenTaskCount(tasks, "project-1")).toBe(1);
  });
});

describe("getDaysLeft", () => {
  it("gives the number of days until the due date", () => {
    expect(getDaysLeft("2026-11-15", "2026-11-02")).toBe(13);
  });

  it("gives zero on the due date and a negative number after it", () => {
    expect(getDaysLeft("2026-11-02", "2026-11-02")).toBe(0);
    expect(getDaysLeft("2026-11-01", "2026-11-02")).toBe(-1);
  });

  it("counts whole days across a daylight saving change", () => {
    expect(getDaysLeft("2026-04-01", "2026-03-20")).toBe(12);
  });
});

describe("formatShortDate", () => {
  it("formats the day and short month for the given locale", () => {
    expect(formatShortDate("2026-10-24", "en-US")).toBe("Oct 24");
    expect(formatShortDate("2026-10-24", "tr-TR")).toBe("24 Eki");
  });
});

describe("getProjectColorKey", () => {
  it("always gives the same known color for the same id", () => {
    const first = getProjectColorKey("678e4529-fa35-432c-8baa-6a1298ba43f1");

    expect(PROJECT_COLOR_KEYS).toContain(first);
    expect(getProjectColorKey("678e4529-fa35-432c-8baa-6a1298ba43f1")).toBe(
      first,
    );
  });

  it("uses more than one color across different ids", () => {
    const colors = new Set(
      Array.from({ length: 30 }, (_, index) =>
        getProjectColorKey(`id-${index}`),
      ),
    );

    expect(colors.size).toBeGreaterThan(1);
  });
});

describe("getProjectInitial", () => {
  it("gives the first letter in upper case", () => {
    expect(getProjectInitial("anchorly-api")).toBe("A");
    expect(getProjectInitial("  portföy")).toBe("P");
  });

  it("upper-cases a Turkish dotted i with the default locale rules of the runtime", () => {
    expect(getProjectInitial("iş")).toMatch(/^[Iİ]$/);
  });

  it("gives a question mark for an empty name", () => {
    expect(getProjectInitial("   ")).toBe("?");
  });
});

describe("filterTasksByCategory", () => {
  const tasks = [
    createTask({ id: "a", category: "Work" }),
    createTask({ id: "b", category: "Health" }),
  ];

  it("keeps every task for all", () => {
    expect(filterTasksByCategory(tasks, "all")).toEqual(tasks);
  });

  it("keeps only the tasks of the chosen category", () => {
    expect(
      filterTasksByCategory(tasks, "Health").map((task) => task.id),
    ).toEqual(["b"]);
  });
});

describe("splitProjects", () => {
  it("separates archived projects from active ones", () => {
    const projects = [
      { id: "a", name: "A" },
      { id: "b", name: "B", archived: true },
      { id: "c", name: "C", archived: false },
    ];

    const { active, archived } = splitProjects(projects);

    expect(active.map((project) => project.id)).toEqual(["a", "c"]);
    expect(archived.map((project) => project.id)).toEqual(["b"]);
  });
});
