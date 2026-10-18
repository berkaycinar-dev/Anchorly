import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { renderApp } from "./test/renderApp";
import { getLocalDateString } from "./utils/dateHelpers";

const TASK_ID = "11111111-1111-4111-8111-111111111111";

async function openTaskDialog(user) {
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

  renderApp("/today");

  await user.click(screen.getByText("Task 1"));
}

describe("App task detail dialog", () => {
  it("opens the task as a labelled dialog", async () => {
    const user = userEvent.setup();
    await openTaskDialog(user);

    expect(screen.getByRole("dialog", { name: "Task 1" })).toBeInTheDocument();
  });

  it("closes when the Close button is pressed", async () => {
    const user = userEvent.setup();
    await openTaskDialog(user);

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when the dialog reports a native close", async () => {
    const user = userEvent.setup();
    await openTaskDialog(user);

    fireEvent(screen.getByRole("dialog"), new Event("close"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("leaves closing on Escape to the dialog itself", async () => {
    const user = userEvent.setup();
    await openTaskDialog(user);

    fireEvent.keyDown(document.body, { key: "Escape" });

    expect(screen.getByRole("dialog", { name: "Task 1" })).toBeInTheDocument();
  });

  it("does not run the page shortcut for keys pressed inside the dialog", async () => {
    const user = userEvent.setup();
    await openTaskDialog(user);

    const wasNotPrevented = fireEvent.keyDown(
      screen.getByRole("button", { name: "Close" }),
      { key: "n" },
    );

    expect(wasNotPrevented).toBe(true);
  });

  it("still runs the page shortcut outside the dialog", async () => {
    renderApp("/today");

    const wasNotPrevented = fireEvent.keyDown(document.body, { key: "n" });

    expect(wasNotPrevented).toBe(false);
  });
});