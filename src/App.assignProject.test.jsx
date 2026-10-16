import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { renderApp } from "./test/renderApp";
import { getLocalDateString } from "./utils/dateHelpers";

const TASK_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "22222222-2222-4222-8222-222222222222";

function readStoredTask() {
  return JSON.parse(localStorage.getItem("tasks")).find(
    (task) => task.id === TASK_ID,
  );
}

async function openTaskModal(user) {
  localStorage.setItem("language", JSON.stringify("en"));
  localStorage.setItem(
    "tasks",
    JSON.stringify([
      {
        id: TASK_ID,
        title: "Task 1",
        category: "Work",
        date: getLocalDateString(),
        completed: false,
        projectId: null,
        description: "",
        steps: [],
        completedAt: null,
        order: 0,
        repeat: "none",
        repeatGroupId: null,
        attachments: [],
      },
    ]),
  );
  localStorage.setItem(
    "projects",
    JSON.stringify([{ id: PROJECT_ID, name: "Project 1" }]),
  );

  renderApp("/today");

  await user.click(screen.getByText("Task 1"));
}

describe("App assigning a task to a project", () => {
  it("stores the project id on the task", async () => {
    const user = userEvent.setup();
    await openTaskModal(user);

    await user.selectOptions(screen.getByLabelText("Project"), PROJECT_ID);

    expect(readStoredTask().projectId).toBe(PROJECT_ID);
  });

  it("clears the project id when no project is chosen", async () => {
    const user = userEvent.setup();
    await openTaskModal(user);

    await user.selectOptions(screen.getByLabelText("Project"), PROJECT_ID);
    await user.selectOptions(screen.getByLabelText("Project"), "");

    expect(readStoredTask().projectId).toBeNull();
  });
});