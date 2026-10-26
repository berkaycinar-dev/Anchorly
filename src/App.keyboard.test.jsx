import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { renderApp } from "./test/renderApp";
import {
  getDeleteButton,
  getTaskCheckbox,
  getTaskTitleButton,
} from "./test/queries";
import { getLocalDateString } from "./utils/dateHelpers";

function seedOneTask() {
  localStorage.setItem("language", JSON.stringify("en"));
  localStorage.setItem(
    "tasks",
    JSON.stringify([
      {
        id: "11111111-1111-4111-8111-111111111111",
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
}

async function tabTo(user, getTarget) {
  for (let step = 0; step < 80; step += 1) {
    const target = getTarget();

    if (document.activeElement === target) {
      return;
    }

    await user.tab();

    expect(document.activeElement).not.toBe(document.body);
  }

  throw new Error("Could not reach the element with the Tab key");
}

function getActiveTitles() {
  return screen
    .getAllByRole("button", { name: /^(Task 1|Write report)$/ })
    .map((button) => button.textContent);
}

describe("App keyboard-only task flow", () => {
  it("adds, opens, closes, reorders, deletes and completes without a mouse", async () => {
    const user = userEvent.setup();
    seedOneTask();
    renderApp("/today");

    screen.getByRole("textbox", { name: "New task" }).focus();
    await user.keyboard("Write report{Enter}");

    expect(getTaskTitleButton("Write report")).toBeInTheDocument();

    await tabTo(user, () => getTaskTitleButton("Write report"));
    await user.keyboard("{Enter}");

    const dialog = screen.getByRole("dialog", { name: "Write report" });

    expect(screen.getByRole("heading", { name: "Write report" })).toHaveFocus();

    await tabTo(user, () => screen.getByRole("button", { name: "Close" }));
    await user.keyboard("{Enter}");

    expect(dialog).not.toBeInTheDocument();
    expect(getTaskTitleButton("Write report")).toHaveFocus();

    const before = getActiveTitles();
    const key = before[0] === "Write report" ? "ArrowDown" : "ArrowUp";

    await user.keyboard(`{Alt>}{${key}}{/Alt}`);

    expect(getActiveTitles()).toEqual([...before].reverse());
    expect(getTaskTitleButton("Write report")).toHaveFocus();

    await tabTo(user, () => getDeleteButton("Task 1"));
    await user.keyboard("{Enter}");

    expect(screen.queryByText("Task 1")).not.toBeInTheDocument();
    expect(getTaskTitleButton("Write report")).toHaveFocus();

    await user.tab({ shift: true });

    expect(getTaskCheckbox("Write report")).toHaveFocus();

    await user.keyboard(" ");

    expect(getTaskCheckbox("Write report")).toBeChecked();
    expect(getTaskCheckbox("Write report")).toHaveFocus();
  });
});
