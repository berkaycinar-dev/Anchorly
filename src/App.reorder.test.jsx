import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { renderApp } from "./test/renderApp";
import { getMoveButton, getTaskTitleButton } from "./test/queries";
import { getLocalDateString } from "./utils/dateHelpers";

function seedTasks() {
  localStorage.setItem("language", JSON.stringify("en"));
  localStorage.setItem(
    "tasks",
    JSON.stringify(
      ["Task 1", "Task 2", "Task 3"].map((title, index) => ({
        id: `${index + 1}${index + 1}${index + 1}${index + 1}${index + 1}${index + 1}${index + 1}${index + 1}-1111-4111-8111-111111111111`,
        title,
        category: "Work",
        date: getLocalDateString(),
        completed: false,
        projectId: null,
        description: "",
        steps: [],
        completedAt: null,
        order: index,
        repeat: "none",
        repeatGroupId: null,
        attachments: [],
      })),
    ),
  );
}

function getTitles() {
  return screen.getAllByText(/^Task \d$/).map((element) => element.textContent);
}

describe("App keyboard reordering", () => {
  it("reorders tasks with the move buttons", async () => {
    const user = userEvent.setup();
    seedTasks();
    renderApp("/today");

    await user.click(getMoveButton("Task 3", "up"));

    expect(getTitles()).toEqual(["Task 1", "Task 3", "Task 2"]);
  });

  it("reorders tasks with Alt+ArrowDown and keeps focus on the title", async () => {
    const user = userEvent.setup();
    seedTasks();
    renderApp("/today");

    getTaskTitleButton("Task 1").focus();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");

    expect(getTitles()).toEqual(["Task 2", "Task 1", "Task 3"]);
    expect(getTaskTitleButton("Task 1")).toHaveFocus();
  });

  it("saves the new order", async () => {
    const user = userEvent.setup();
    seedTasks();
    renderApp("/today");

    await user.click(getMoveButton("Task 1", "down"));

    const saved = JSON.parse(localStorage.getItem("tasks"));
    const byTitle = Object.fromEntries(
      saved.map((task) => [task.title, task.order]),
    );

    expect(byTitle["Task 2"]).toBeLessThan(byTitle["Task 1"]);
    expect(byTitle["Task 1"]).toBeLessThan(byTitle["Task 3"]);
  });

  it("announces the move in the language of the app", async () => {
    const user = userEvent.setup();
    seedTasks();
    renderApp("/today");

    await user.click(getMoveButton("Task 1", "down"));

    expect(
      screen.getByText("Task 1: moved to position 2 of 3"),
    ).toBeInTheDocument();
  });
});