import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, it, expect } from "vitest";
import { renderApp } from "./test/renderApp";
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

const EARLY = "11111111-1111-4111-8111-111111111111";
const LATE = "22222222-2222-4222-8222-222222222222";
const NONE = "33333333-3333-4333-8333-333333333333";

function seed(tasks) {
  localStorage.setItem("language", JSON.stringify("en"));
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function readTask(id) {
  return JSON.parse(localStorage.getItem("tasks")).find(
    (task) => task.id === id,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("time in the calendar", () => {
  it("lists the day's tasks by time with the time shown", () => {
    seed([
      createTask(NONE, "No time", { order: 0 }),
      createTask(LATE, "Late", { order: 1, dueTime: "14:00" }),
      createTask(EARLY, "Early", { order: 2, dueTime: "09:30" }),
    ]);
    renderApp("/calendar");

    const panel = document.querySelector(".calendar-panel");
    const titles = within(panel)
      .getAllByRole("button")
      .map((button) => button.textContent)
      .filter((text) => ["Early", "Late", "No time"].includes(text));

    expect(titles).toEqual(["Early", "Late", "No time"]);
    expect(within(panel).getByText("09:30")).toBeInTheDocument();
    expect(within(panel).getByText("14:00")).toBeInTheDocument();
  });
});

describe("time in the task detail dialog", () => {
  it("sets and clears the time", async () => {
    const user = userEvent.setup();
    seed([createTask(EARLY, "Task 1")]);
    renderApp("/calendar");

    await user.click(
      within(document.querySelector(".calendar-panel")).getByRole("button", {
        name: "Task 1",
      }),
    );

    const dialog = screen.getByRole("dialog", { name: "Task 1" });
    await user.click(within(dialog).getByLabelText("Time"));
    await user.click(
      within(screen.getByRole("listbox", { name: "Hours" })).getByRole(
        "option",
        { name: "10" },
      ),
    );
    await user.click(
      within(screen.getByRole("listbox", { name: "Minutes" })).getByRole(
        "option",
        { name: "15" },
      ),
    );

    expect(readTask(EARLY).dueTime).toBe("10:15");

    await user.click(
      within(dialog).getByRole("button", { name: "Clear time" }),
    );

    expect(readTask(EARLY).dueTime).toBe("");
  });
});

describe("time on project lists", () => {
  it("shows the time badge on the classic task list", async () => {
    const user = userEvent.setup();
    seed([createTask(EARLY, "Archive me", { dueTime: "08:45", date: "" })]);
    renderApp("/archive");

    await user.click(screen.getByRole("tab", { name: "One-time" }));

    expect(screen.getByText("08:45")).toBeInTheDocument();
  });
});
