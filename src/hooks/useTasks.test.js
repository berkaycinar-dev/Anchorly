import { createElement } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import DataProvider from "../data/DataProvider";
import { isUuid } from "../lib/id";
import useTasks from "./useTasks";

const IDS = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
];

function createTask(id, order) {
  return {
    id,
    title: `Task ${order + 1}`,
    category: "Work",
    date: "2026-10-10",
    completed: false,
    projectId: null,
    description: "",
    steps: [],
    completedAt: null,
    order,
    repeat: "none",
    repeatGroupId: null,
    attachments: [],
  };
}

function createWrapper(today) {
  return function Wrapper({ children }) {
    return createElement(DataProvider, { today }, children);
  };
}

function renderTasks() {
  localStorage.setItem(
    "tasks",
    JSON.stringify(IDS.map((id, index) => createTask(id, index))),
  );

  return renderHook(() => useTasks("2026-10-10"), {
    wrapper: createWrapper("2026-10-10"),
  });
}

function getOrderedIds(tasks) {
  return [...tasks].sort((a, b) => a.order - b.order).map((task) => task.id);
}

function renderTasksWith(tasks, today = "2026-10-10") {
  localStorage.setItem("tasks", JSON.stringify(tasks));

  return renderHook(() => useTasks(today), { wrapper: createWrapper(today) });
}

function findTask(tasks, id) {
  return tasks.find((task) => task.id === id);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useTasks reorderTasks", () => {
  it("moves the dragged task to the position of the target task", () => {
    const { result } = renderTasks();

    act(() => {
      result.current.reorderTasks(IDS[0], IDS[2]);
    });

    expect(getOrderedIds(result.current.tasks)).toEqual([
      IDS[1],
      IDS[2],
      IDS[0],
    ]);
  });

  it("does nothing when a task is dropped on itself", () => {
    const { result } = renderTasks();

    act(() => {
      result.current.reorderTasks(IDS[1], IDS[1]);
    });

    expect(getOrderedIds(result.current.tasks)).toEqual(IDS);
  });

  it("does nothing when the dragged id is unknown", () => {
    const { result } = renderTasks();

    act(() => {
      result.current.reorderTasks("unknown-id", IDS[2]);
    });

    expect(getOrderedIds(result.current.tasks)).toEqual(IDS);
  });
});

describe("useTasks first launch", () => {
  it("seeds demo tasks dated relative to today", () => {
    const { result } = renderHook(() => useTasks("2026-10-11"), {
      wrapper: createWrapper("2026-10-11"),
    });

    const datesByTitle = Object.fromEntries(
      result.current.tasks.map((task) => [task.title, task.date]),
    );

    expect(result.current.tasks).toHaveLength(5);
    expect(datesByTitle["Finish React Project"]).toBe("2026-10-11");
    expect(datesByTitle["Call mom"]).toBe("2026-10-12");
  });

  it("keeps the stored seed dates on a later launch", () => {
    const first = renderHook(() => useTasks("2026-10-11"), {
      wrapper: createWrapper("2026-10-11"),
    });

    expect(first.result.current.tasks[0].date).toBe("2026-10-11");
    first.unmount();

    const second = renderHook(() => useTasks("2026-10-20"), {
      wrapper: createWrapper("2026-10-20"),
    });

    expect(second.result.current.tasks[0].date).toBe("2026-10-11");
  });
});

describe("useTasks addTask", () => {
  it("puts the new task at the start of the list", () => {
    const { result } = renderTasks();

    act(() => {
      result.current.addTask({ title: "Write tests" });
    });

    expect(result.current.tasks).toHaveLength(4);
    expect(result.current.tasks[0].title).toBe("Write tests");
    expect(result.current.tasks.slice(1).map((task) => task.id)).toEqual(IDS);
  });

  it("fills in the default fields", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-10T09:00:00Z"));
    const { result } = renderTasks();

    act(() => {
      result.current.addTask({ title: "Write tests" });
    });

    expect(result.current.tasks[0]).toEqual({
      id: expect.any(String),
      title: "Write tests",
      category: "Work",
      date: "",
      completed: false,
      projectId: null,
      description: "",
      steps: [],
      completedAt: null,
      order: new Date("2026-10-10T09:00:00Z").getTime(),
      repeat: "none",
      repeatGroupId: null,
      attachments: [],
    });
  });

  it("gives the new task a UUID id", () => {
    const { result } = renderTasks();

    act(() => {
      result.current.addTask({ title: "Write tests" });
    });

    expect(isUuid(result.current.tasks[0].id)).toBe(true);
    expect(IDS).not.toContain(result.current.tasks[0].id);
  });

  it("lets the given fields override the defaults", () => {
    const { result } = renderTasks();

    act(() => {
      result.current.addTask({
        title: "Read a book",
        category: "Personal",
        date: "2026-10-12",
        projectId: "project-1",
      });
    });

    expect(result.current.tasks[0]).toMatchObject({
      title: "Read a book",
      category: "Personal",
      date: "2026-10-12",
      projectId: "project-1",
      completed: false,
    });
  });
});

describe("useTasks toggleTask", () => {
  it("completes a dated task with the date of the task", () => {
    const task = { ...createTask(IDS[0], 0), date: "2026-10-08" };
    const { result } = renderTasksWith([task]);

    act(() => {
      result.current.toggleTask(IDS[0]);
    });

    expect(findTask(result.current.tasks, IDS[0])).toMatchObject({
      completed: true,
      completedAt: "2026-10-08",
    });
  });

  it("completes a dateless task with today", () => {
    const task = { ...createTask(IDS[0], 0), date: "" };
    const { result } = renderTasksWith([task]);

    act(() => {
      result.current.toggleTask(IDS[0]);
    });

    expect(findTask(result.current.tasks, IDS[0])).toMatchObject({
      completed: true,
      completedAt: "2026-10-10",
    });
  });

  it("clears completedAt when the task is reopened", () => {
    const { result } = renderTasks();

    act(() => {
      result.current.toggleTask(IDS[0]);
    });

    act(() => {
      result.current.toggleTask(IDS[0]);
    });

    expect(findTask(result.current.tasks, IDS[0])).toMatchObject({
      completed: false,
      completedAt: null,
    });
  });
});

describe("useTasks deleteTask", () => {
  it("removes only the given task", () => {
    const { result } = renderTasks();

    act(() => {
      result.current.deleteTask(IDS[1]);
    });

    expect(result.current.tasks.map((task) => task.id)).toEqual([
      IDS[0],
      IDS[2],
    ]);
  });
});

describe("useTasks text updates", () => {
  it("updates only the title of the given task", () => {
    const { result } = renderTasks();

    act(() => {
      result.current.updateTaskTitle(IDS[1], "Renamed task");
    });

    expect(findTask(result.current.tasks, IDS[1]).title).toBe("Renamed task");
    expect(findTask(result.current.tasks, IDS[0]).title).toBe("Task 1");
  });

  it("updates only the description of the given task", () => {
    const { result } = renderTasks();

    act(() => {
      result.current.updateTaskDescription(IDS[1], "A longer note");
    });

    expect(findTask(result.current.tasks, IDS[1]).description).toBe(
      "A longer note",
    );
    expect(findTask(result.current.tasks, IDS[0]).description).toBe("");
  });
});

describe("useTasks updateTaskDate", () => {
  const repeatingTask = {
    ...createTask(IDS[0], 0),
    repeat: "weekly",
    repeatGroupId: "group-1",
  };

  it("clears the date, the repeat and the repeat group for an empty date", () => {
    const { result } = renderTasksWith([repeatingTask]);

    act(() => {
      result.current.updateTaskDate(IDS[0], "");
    });

    expect(findTask(result.current.tasks, IDS[0])).toMatchObject({
      date: "",
      repeat: "none",
      repeatGroupId: null,
    });
  });

  it("changes only the date for a filled date", () => {
    const { result } = renderTasksWith([repeatingTask]);

    act(() => {
      result.current.updateTaskDate(IDS[0], "2026-10-14");
    });

    expect(findTask(result.current.tasks, IDS[0])).toMatchObject({
      date: "2026-10-14",
      repeat: "weekly",
      repeatGroupId: "group-1",
    });
  });
});

describe("useTasks steps", () => {
  const steps = [
    { id: "step-1", text: "Fill the glass", done: false },
    { id: "step-2", text: "Drink it", done: false },
  ];

  it("adds a step with a UUID id that is not done", () => {
    const { result } = renderTasks();

    act(() => {
      result.current.addTaskStep(IDS[0], "Buy milk");
    });

    const [step] = findTask(result.current.tasks, IDS[0]).steps;

    expect(step).toEqual({
      id: expect.any(String),
      text: "Buy milk",
      done: false,
    });
    expect(isUuid(step.id)).toBe(true);
  });

  it("does not add a step with empty or blank text", () => {
    const { result } = renderTasks();

    act(() => {
      result.current.addTaskStep(IDS[0], "");
      result.current.addTaskStep(IDS[0], "   ");
    });

    expect(findTask(result.current.tasks, IDS[0]).steps).toEqual([]);
  });

  it("toggles only the given step", () => {
    const { result } = renderTasksWith([{ ...createTask(IDS[0], 0), steps }]);

    act(() => {
      result.current.toggleTaskStep(IDS[0], "step-1");
    });

    expect(findTask(result.current.tasks, IDS[0]).steps).toEqual([
      { id: "step-1", text: "Fill the glass", done: true },
      { id: "step-2", text: "Drink it", done: false },
    ]);
  });

  it("deletes only the given step", () => {
    const { result } = renderTasksWith([{ ...createTask(IDS[0], 0), steps }]);

    act(() => {
      result.current.deleteTaskStep(IDS[0], "step-1");
    });

    expect(findTask(result.current.tasks, IDS[0]).steps).toEqual([steps[1]]);
  });
});

describe("useTasks attachments", () => {
  const first = { id: "file-1", name: "a.txt", type: "text/plain", data: "" };
  const second = { id: "file-2", name: "b.txt", type: "text/plain", data: "" };

  it("adds an attachment to the end of the list", () => {
    const { result } = renderTasksWith([
      { ...createTask(IDS[0], 0), attachments: [first] },
    ]);

    act(() => {
      result.current.addTaskAttachment(IDS[0], second);
    });

    expect(findTask(result.current.tasks, IDS[0]).attachments).toEqual([
      first,
      second,
    ]);
  });

  it("deletes only the given attachment", () => {
    const { result } = renderTasksWith([
      { ...createTask(IDS[0], 0), attachments: [first, second] },
    ]);

    act(() => {
      result.current.deleteTaskAttachment(IDS[0], "file-1");
    });

    expect(findTask(result.current.tasks, IDS[0]).attachments).toEqual([
      second,
    ]);
  });
});

describe("useTasks updateTaskRepeat", () => {
  const baseTask = createTask(IDS[0], 0);
  const dailyTask = { ...baseTask, repeat: "daily", repeatGroupId: "group-1" };

  it("gives the task a repeat group and creates the future copies", () => {
    const { result } = renderTasksWith([baseTask]);

    act(() => {
      result.current.updateTaskRepeat(IDS[0], "daily");
    });

    const target = findTask(result.current.tasks, IDS[0]);
    const copies = result.current.tasks.filter((task) => task.id !== IDS[0]);

    expect(target.repeat).toBe("daily");
    expect(isUuid(target.repeatGroupId)).toBe(true);
    expect(copies).toHaveLength(120);
    expect(
      copies.every((task) => task.repeatGroupId === target.repeatGroupId),
    ).toBe(true);
    expect(copies.every((task) => task.completed === false)).toBe(true);
    expect(copies.map((task) => task.date).sort()[0]).toBe("2026-10-11");
  });

  it("clears the repeat group and removes the future copies for none", () => {
    const { result } = renderTasksWith([dailyTask]);

    expect(result.current.tasks).toHaveLength(121);

    act(() => {
      result.current.updateTaskRepeat(IDS[0], "none");
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0]).toMatchObject({
      id: IDS[0],
      repeat: "none",
      repeatGroupId: null,
    });
  });

  it("replaces the old future copies when the repeat changes", () => {
    const { result } = renderTasksWith([dailyTask]);

    act(() => {
      result.current.updateTaskRepeat(IDS[0], "weekly");
    });

    const dates = result.current.tasks.map((task) => task.date).sort();

    expect(result.current.tasks).toHaveLength(18);
    expect(dates[0]).toBe("2026-10-10");
    expect(dates[1]).toBe("2026-10-17");
    expect(dates[17]).toBe("2027-02-06");
    expect(
      result.current.tasks.every((task) => task.repeatGroupId === "group-1"),
    ).toBe(true);
  });

  it("does not change the tasks for an unknown id", () => {
    const { result } = renderTasks();
    const before = result.current.tasks;

    act(() => {
      result.current.updateTaskRepeat("unknown-id", "daily");
    });

    expect(result.current.tasks).toEqual(before);
  });
});

describe("useTasks clearProjectFromTasks", () => {
  it("clears the project only from the tasks of that project", () => {
    const { result } = renderTasksWith([
      { ...createTask(IDS[0], 0), projectId: "project-1" },
      { ...createTask(IDS[1], 1), projectId: "project-2" },
      { ...createTask(IDS[2], 2), projectId: "project-1" },
    ]);

    act(() => {
      result.current.clearProjectFromTasks("project-1");
    });

    expect(result.current.tasks.map((task) => task.projectId)).toEqual([
      null,
      "project-2",
      null,
    ]);
  });
});

describe("useTasks stored tasks", () => {
  it("adds the missing fields to tasks saved by an older version", () => {
    const { result } = renderTasksWith([
      {
        id: IDS[0],
        title: "Old task",
        category: "Work",
        date: "2026-10-10",
        completed: false,
        projectId: null,
      },
      {
        id: IDS[1],
        title: "Older task",
        category: "Work",
        date: "2026-10-10",
        completed: false,
        projectId: null,
      },
    ]);

    expect(result.current.tasks[0]).toEqual({
      id: IDS[0],
      title: "Old task",
      category: "Work",
      date: "2026-10-10",
      completed: false,
      projectId: null,
      description: "",
      steps: [],
      completedAt: null,
      order: 0,
      repeat: "none",
      repeatGroupId: null,
      attachments: [],
    });
    expect(result.current.tasks[1].order).toBe(1);
  });
});