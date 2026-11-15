import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { renderApp } from "./test/renderApp";
import { getSidebarLink } from "./test/queries";
import { getLocalDateString } from "./utils/dateHelpers";

function createTask(id, title, overrides = {}) {
  return {
    id,
    title,
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
    ...overrides,
  };
}

function seedTasks() {
  localStorage.setItem("language", JSON.stringify("en"));
  localStorage.setItem(
    "tasks",
    JSON.stringify([
      createTask("11111111-1111-4111-8111-111111111111", "Task 1"),
      createTask("22222222-2222-4222-8222-222222222222", "Task 2", {
        order: 1,
      }),
      createTask("33333333-3333-4333-8333-333333333333", "Task 3", {
        order: 2,
        completed: true,
        completedAt: getLocalDateString(),
      }),
    ]),
  );
}

function getPanel() {
  return screen.getByRole("complementary", { name: "Task details" });
}

function queryPanel() {
  return screen.queryByRole("complementary", { name: "Task details" });
}

async function openPanel(user, title = "Task 1") {
  seedTasks();
  renderApp("/today");

  await user.click(screen.getByRole("button", { name: title }));

  return getPanel();
}

describe("Today task detail panel", () => {
  it("opens beside the list instead of as a dialog", async () => {
    const user = userEvent.setup();
    const panel = await openPanel(user);

    expect(panel).toHaveFocus();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      within(panel).getByRole("textbox", { name: "Task title" }),
    ).toHaveValue("Task 1");
  });

  it("marks the selected task in the list", async () => {
    const user = userEvent.setup();

    await openPanel(user);

    const selected = screen
      .getAllByRole("listitem")
      .filter((item) => item.getAttribute("aria-current") === "true");

    expect(selected).toHaveLength(1);
    expect(within(selected[0]).getByText("Task 1")).toBeInTheDocument();
  });

  it("switches to another task without closing", async () => {
    const user = userEvent.setup();
    await openPanel(user);

    await user.click(screen.getByRole("button", { name: "Task 2" }));

    expect(
      within(getPanel()).getByRole("textbox", { name: "Task title" }),
    ).toHaveValue("Task 2");
  });

  it("closes with the Close button and returns focus to the task", async () => {
    const user = userEvent.setup();
    const panel = await openPanel(user);

    await user.click(within(panel).getByRole("button", { name: "Close" }));

    expect(queryPanel()).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Task 1" })).toHaveFocus();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    await openPanel(user);

    await user.keyboard("{Escape}");

    expect(queryPanel()).not.toBeInTheDocument();
  });

  it("reverts an edited title on the first Escape and closes on the second", async () => {
    const user = userEvent.setup();
    const panel = await openPanel(user);
    const titleInput = within(panel).getByRole("textbox", {
      name: "Task title",
    });

    await user.type(titleInput, " extra");
    await user.keyboard("{Escape}");

    expect(titleInput).toHaveValue("Task 1");
    expect(getPanel()).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(queryPanel()).not.toBeInTheDocument();
  });

  it("renames the task when Enter is pressed", async () => {
    const user = userEvent.setup();
    const panel = await openPanel(user);
    const titleInput = within(panel).getByRole("textbox", {
      name: "Task title",
    });

    await user.clear(titleInput);
    await user.type(titleInput, "Renamed task{Enter}");

    expect(screen.getByRole("button", { name: "Renamed task" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Task 1" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the old title when the new one is empty", async () => {
    const user = userEvent.setup();
    const panel = await openPanel(user);
    const titleInput = within(panel).getByRole("textbox", {
      name: "Task title",
    });

    await user.clear(titleInput);
    await user.tab();

    expect(titleInput).toHaveValue("Task 1");
    expect(screen.getByRole("button", { name: "Task 1" })).toBeVisible();
  });

  it("adds a step", async () => {
    const user = userEvent.setup();
    const panel = await openPanel(user);

    await user.type(
      within(panel).getByRole("textbox", { name: "New step" }),
      "Buy milk{Enter}",
    );

    expect(
      within(getPanel()).getByRole("checkbox", {
        name: 'Complete step "Buy milk"',
      }),
    ).toBeInTheDocument();
  });

  it("deletes the task after confirmation", async () => {
    const user = userEvent.setup();
    const panel = await openPanel(user);

    await user.click(
      within(panel).getByRole("button", { name: "Delete task" }),
    );
    await user.click(screen.getByRole("button", { name: "Yes, Delete" }));

    expect(queryPanel()).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Task 1" }),
    ).not.toBeInTheDocument();
  });

  it("stays open when the delete confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const panel = await openPanel(user);

    await user.click(
      within(panel).getByRole("button", { name: "Delete task" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(getPanel()).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Task 1" })).toBeVisible();
  });

  it("closes when the person leaves the Today page", async () => {
    const user = userEvent.setup();
    await openPanel(user);

    await user.click(getSidebarLink("Calendar"));

    expect(queryPanel()).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Today stats chips", () => {
  it("shows remaining and completed counts", () => {
    seedTasks();
    renderApp("/today");

    const stats = document.querySelector(".today-stats");

    expect(within(stats).getByText("2")).toBeInTheDocument();
    expect(within(stats).getByText("1")).toBeInTheDocument();
  });
});
