import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { renderApp } from "./test/renderApp";
import {
  getCompletedToggle,
  getDeleteButton,
  getFilterButton,
  getSidebarBadge,
  getSidebarLink,
  getTaskCheckbox,
  getTaskItem,
  queryTaskItem,
} from "./test/queries";

const TODAY = "2026-10-10";
const FIRST_ID = "11111111-1111-4111-8111-111111111111";
const SECOND_ID = "22222222-2222-4222-8222-222222222222";
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";

function createStoredTask(id, title, overrides = {}) {
  return {
    id,
    title,
    category: "Work",
    date: TODAY,
    completed: false,
    projectId: null,
    description: "",
    steps: [],
    completedAt: null,
    order: 0,
    repeat: "none",
    repeatGroupId: null,
    attachments: [],
    ...overrides,
  };
}

function seedTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function readStoredTasks() {
  return JSON.parse(localStorage.getItem("tasks"));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 10, 12));
  localStorage.setItem("language", JSON.stringify("en"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("App adding a task", () => {
  it("shows a new task in the list and clears the input", async () => {
    const user = userEvent.setup();
    seedTasks([createStoredTask(FIRST_ID, "Task 1")]);
    renderApp("/today");

    const input = screen.getByPlaceholderText("Add a new task...");

    await user.type(input, "Write report");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(getTaskItem("Write report")).toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(readStoredTasks()).toHaveLength(2);
  });

  it("does not add a task with a blank title", async () => {
    const user = userEvent.setup();
    seedTasks([createStoredTask(FIRST_ID, "Task 1")]);
    renderApp("/today");

    await user.type(screen.getByPlaceholderText("Add a new task..."), "   ");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(readStoredTasks()).toHaveLength(1);
  });
});

describe("App completing a task", () => {
  it("moves a completed task to the Completed section", async () => {
    const user = userEvent.setup();
    seedTasks([
      createStoredTask(FIRST_ID, "Task 1"),
      createStoredTask(SECOND_ID, "Task 2", { order: 1 }),
    ]);
    renderApp("/today");

    await user.click(getTaskCheckbox("Task 1"));

    expect(getTaskItem("Task 1")).toHaveClass("completed-task");
    expect(getTaskItem("Task 2")).not.toHaveClass("completed-task");
    expect(getCompletedToggle(1)).toBeInTheDocument();
    expect(readStoredTasks()[0]).toMatchObject({
      completed: true,
      completedAt: TODAY,
    });
  });

  it("moves a reopened task back to the active list", async () => {
    const user = userEvent.setup();
    seedTasks([
      createStoredTask(FIRST_ID, "Task 1", {
        completed: true,
        completedAt: TODAY,
      }),
    ]);
    renderApp("/today");

    expect(getTaskItem("Task 1")).toHaveClass("completed-task");

    await user.click(getTaskCheckbox("Task 1"));

    expect(getTaskItem("Task 1")).not.toHaveClass("completed-task");
    expect(screen.queryByText(/^Completed \(/)).not.toBeInTheDocument();
    expect(readStoredTasks()[0]).toMatchObject({
      completed: false,
      completedAt: null,
    });
  });
});

describe("App deleting a task", () => {
  it("removes the task from the list and from storage", async () => {
    const user = userEvent.setup();
    seedTasks([
      createStoredTask(FIRST_ID, "Task 1"),
      createStoredTask(SECOND_ID, "Task 2", { order: 1 }),
    ]);
    renderApp("/today");

    await user.click(getDeleteButton("Task 1"));

    expect(queryTaskItem("Task 1")).not.toBeInTheDocument();
    expect(getTaskItem("Task 2")).toBeInTheDocument();
    expect(readStoredTasks().map((task) => task.id)).toEqual([SECOND_ID]);
  });
});

describe("App searching and filtering tasks", () => {
  it("shows only the tasks that match the search text", async () => {
    const user = userEvent.setup();
    seedTasks([
      createStoredTask(FIRST_ID, "Buy milk"),
      createStoredTask(SECOND_ID, "Write report", { order: 1 }),
    ]);
    renderApp("/today");

    await user.type(screen.getByPlaceholderText("Search tasks..."), "MILK");

    expect(getTaskItem("Buy milk")).toBeInTheDocument();
    expect(queryTaskItem("Write report")).not.toBeInTheDocument();
  });

  it("shows only active tasks with the Active filter", async () => {
    const user = userEvent.setup();
    seedTasks([
      createStoredTask(FIRST_ID, "Task 1"),
      createStoredTask(SECOND_ID, "Task 2", {
        order: 1,
        completed: true,
        completedAt: TODAY,
      }),
    ]);
    renderApp("/today");

    await user.click(getFilterButton("Active"));

    expect(getTaskItem("Task 1")).toBeInTheDocument();
    expect(queryTaskItem("Task 2")).not.toBeInTheDocument();
  });

  it("shows only completed tasks with the Completed filter", async () => {
    const user = userEvent.setup();
    seedTasks([
      createStoredTask(FIRST_ID, "Task 1"),
      createStoredTask(SECOND_ID, "Task 2", {
        order: 1,
        completed: true,
        completedAt: TODAY,
      }),
    ]);
    renderApp("/today");

    await user.click(getFilterButton("Completed"));

    expect(getTaskItem("Task 2")).toBeInTheDocument();
    expect(queryTaskItem("Task 1")).not.toBeInTheDocument();
  });
});

describe("App deleting a project", () => {
  it("releases its tasks so they show up on the Today page", async () => {
    const user = userEvent.setup();
    seedTasks([
      createStoredTask(FIRST_ID, "Project task", {
        date: "",
        projectId: PROJECT_ID,
      }),
    ]);
    localStorage.setItem(
      "projects",
      JSON.stringify([{ id: PROJECT_ID, name: "Project 1" }]),
    );
    renderApp("/today");

    expect(queryTaskItem("Project task")).not.toBeInTheDocument();

    await user.click(getSidebarLink(/^Projects/));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(getSidebarLink(/^Today/));

    expect(getTaskItem("Project task")).toBeInTheDocument();
    expect(readStoredTasks()[0].projectId).toBeNull();
  });
});

describe("App sidebar badge for Today", () => {
  it("counts a task that was just added", async () => {
    const user = userEvent.setup();
    seedTasks([
      createStoredTask(FIRST_ID, "Task 1"),
      createStoredTask(SECOND_ID, "Task 2", { order: 1 }),
    ]);
    renderApp("/today");

    expect(getSidebarBadge(/^Today/)).toHaveTextContent("2");

    await user.type(
      screen.getByPlaceholderText("Add a new task..."),
      "Write report",
    );
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(getSidebarBadge(/^Today/)).toHaveTextContent("3");
  });

  it("drops a completed task and disappears at zero", async () => {
    const user = userEvent.setup();
    seedTasks([
      createStoredTask(FIRST_ID, "Task 1"),
      createStoredTask(SECOND_ID, "Task 2", { order: 1 }),
    ]);
    renderApp("/today");

    await user.click(getTaskCheckbox("Task 1"));

    expect(getSidebarBadge(/^Today/)).toHaveTextContent("1");

    await user.click(getTaskCheckbox("Task 2"));

    expect(getSidebarBadge(/^Today/)).toBeNull();
  });
});