import { act, renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
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

function renderTasks() {
  localStorage.setItem(
    "tasks",
    JSON.stringify(IDS.map((id, index) => createTask(id, index))),
  );

  return renderHook(() => useTasks("2026-10-10"));
}

function getOrderedIds(tasks) {
  return [...tasks].sort((a, b) => a.order - b.order).map((task) => task.id);
}

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
    const { result } = renderHook(() => useTasks("2026-10-11"));

    const datesByTitle = Object.fromEntries(
      result.current.tasks.map((task) => [task.title, task.date]),
    );

    expect(result.current.tasks).toHaveLength(5);
    expect(datesByTitle["Finish React Project"]).toBe("2026-10-11");
    expect(datesByTitle["Call mom"]).toBe("2026-10-12");
  });

  it("keeps the stored seed dates on a later launch", () => {
    const first = renderHook(() => useTasks("2026-10-11"));

    expect(first.result.current.tasks[0].date).toBe("2026-10-11");
    first.unmount();

    const second = renderHook(() => useTasks("2026-10-20"));

    expect(second.result.current.tasks[0].date).toBe("2026-10-11");
  });
});