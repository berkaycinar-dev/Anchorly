import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import TaskList from "./TaskList";
import { strings } from "../strings";
import {
  getDeleteButton,
  getTaskCheckbox,
  getTaskTitleButton,
} from "../test/queries";

function createTask(n, overrides = {}) {
  return {
    id: `${n}${n}${n}${n}${n}${n}${n}${n}-1111-4111-8111-111111111111`,
    title: `Task ${n}`,
    category: "Work",
    date: "2026-10-10",
    completed: false,
    projectId: null,
    description: "",
    steps: [],
    completedAt: null,
    order: n,
    repeat: "none",
    repeatGroupId: null,
    attachments: [],
    ...overrides,
  };
}

function StatefulList({ initial }) {
  const [tasks, setTasks] = useState(initial);

  return (
    <TaskList
      tasks={tasks}
      toggleTask={(id) =>
        setTasks((current) =>
          current.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task,
          ),
        )
      }
      deleteTask={(id) =>
        setTasks((current) => current.filter((task) => task.id !== id))
      }
      onSelectTask={vi.fn()}
      onReorderTasks={vi.fn()}
      t={strings.en}
    />
  );
}

function renderList(...tasks) {
  render(<StatefulList initial={tasks} />);
}

describe("TaskList focus after completing", () => {
  it("keeps focus on the checkbox when a task moves to the completed list", async () => {
    const user = userEvent.setup();
    renderList(createTask(1), createTask(2));

    getTaskCheckbox("Task 1").focus();
    await user.keyboard(" ");

    expect(getTaskCheckbox("Task 1")).toBeChecked();
    expect(getTaskCheckbox("Task 1")).toHaveFocus();
  });

  it("keeps focus on the checkbox when a task returns to the active list", async () => {
    const user = userEvent.setup();
    renderList(createTask(1, { completed: true }), createTask(2));

    getTaskCheckbox("Task 1").focus();
    await user.keyboard(" ");

    expect(getTaskCheckbox("Task 1")).not.toBeChecked();
    expect(getTaskCheckbox("Task 1")).toHaveFocus();
  });
});

describe("TaskList focus after deleting", () => {
  it("moves focus to the title of the next task", async () => {
    const user = userEvent.setup();
    renderList(createTask(1), createTask(2), createTask(3));

    getDeleteButton("Task 2").focus();
    await user.keyboard("{Enter}");

    expect(screen.queryByText("Task 2")).not.toBeInTheDocument();
    expect(getTaskTitleButton("Task 3")).toHaveFocus();
  });

  it("moves focus to the title of the previous task when the last one is deleted", async () => {
    const user = userEvent.setup();
    renderList(createTask(1), createTask(2));

    getDeleteButton("Task 2").focus();
    await user.keyboard("{Enter}");

    expect(getTaskTitleButton("Task 1")).toHaveFocus();
  });

  it("moves focus within the completed list too", async () => {
    const user = userEvent.setup();
    renderList(
      createTask(1),
      createTask(2, { completed: true }),
      createTask(3, { completed: true }),
    );

    getDeleteButton("Task 2").focus();
    await user.keyboard("{Enter}");

    expect(getTaskTitleButton("Task 3")).toHaveFocus();
  });

  it("does not fail when the last task is deleted", async () => {
    const user = userEvent.setup();
    renderList(createTask(1));

    getDeleteButton("Task 1").focus();
    await user.keyboard("{Enter}");

    expect(screen.getByText(strings.en.emptyTaskTitle)).toBeInTheDocument();
  });
});