import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { renderApp } from "./test/renderApp";

function createTask(id, title, date, completed = false) {
  return {
    id,
    title,
    category: "Work",
    date,
    completed,
    projectId: null,
    description: "",
    steps: [],
    completedAt: null,
    order: 0,
    repeat: "none",
    repeatGroupId: null,
    attachments: [],
  };
}

function getAgenda() {
  return document.querySelector(".calendar-agenda");
}

function getPicker() {
  return within(getAgenda()).getByRole("group", { name: "Choose a day" });
}

function getDayButton(name) {
  return within(getPicker()).getByRole("button", { name });
}

function getAgendaTaskTitles() {
  const list = getAgenda().querySelector(".calendar-agenda-list");

  return list
    ? within(list)
        .getAllByRole("button")
        .map((button) => button.textContent)
    : [];
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 10, 12, 0));
  localStorage.setItem("language", JSON.stringify("en"));
  localStorage.setItem(
    "tasks",
    JSON.stringify([
      createTask("a", "Finished report", "2026-10-10", true),
      createTask("b", "Call the bank", "2026-10-10"),
      createTask("c", "Dentist", "2026-10-12"),
    ]),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe("App calendar agenda", () => {
  it("shows one button for every day of the month and selects today", () => {
    renderApp("/calendar");

    expect(within(getPicker()).getAllByRole("button")).toHaveLength(31);
    expect(getDayButton("Saturday, October 10, 2 tasks")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("names each day with its number of tasks", () => {
    renderApp("/calendar");

    expect(getDayButton("Saturday, October 10, 2 tasks")).toBeInTheDocument();
    expect(getDayButton("Monday, October 12, 1 task")).toBeInTheDocument();
    expect(getDayButton("Sunday, October 11")).toBeInTheDocument();
  });

  it("lists the tasks of the selected day with open tasks first", () => {
    renderApp("/calendar");

    expect(
      within(getAgenda()).getByRole("heading", {
        name: "Saturday, October 10",
      }),
    ).toBeInTheDocument();
    expect(getAgendaTaskTitles()).toEqual(["Call the bank", "Finished report"]);
  });

  it("shows an empty message for a day without tasks", async () => {
    const user = userEvent.setup();
    renderApp("/calendar");

    await user.click(getDayButton("Sunday, October 11"));

    expect(
      within(getAgenda()).getByText("No tasks on this day."),
    ).toBeInTheDocument();
  });

  it("opens the task details from the agenda", async () => {
    const user = userEvent.setup();
    renderApp("/calendar");

    await user.click(
      within(getAgenda()).getByRole("button", { name: "Call the bank" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Call the bank" }),
    ).toBeInTheDocument();
  });

  it("adds a task to the selected day", async () => {
    const user = userEvent.setup();
    renderApp("/calendar");

    await user.click(getDayButton("Sunday, October 11"));
    await user.type(
      within(getAgenda()).getByRole("textbox", {
        name: "Add task to this day",
      }),
      "Water the plants",
    );
    await user.click(within(getAgenda()).getByRole("button", { name: "Add" }));

    expect(getAgendaTaskTitles()).toEqual(["Water the plants"]);
    expect(getDayButton("Sunday, October 11, 1 task")).toBeInTheDocument();
  });

  it("does not add a task with an empty title", async () => {
    const user = userEvent.setup();
    renderApp("/calendar");

    await user.click(getDayButton("Sunday, October 11"));
    await user.click(within(getAgenda()).getByRole("button", { name: "Add" }));

    expect(
      within(getAgenda()).getByText("No tasks on this day."),
    ).toBeInTheDocument();
  });

  it("shows the seven days of the week in week view", async () => {
    const user = userEvent.setup();
    renderApp("/calendar");

    await user.click(screen.getByRole("button", { name: "October 2026" }));

    expect(within(getPicker()).getAllByRole("button")).toHaveLength(7);
    expect(getDayButton("Saturday, October 10, 2 tasks")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("selects the first day after moving to another month", async () => {
    const user = userEvent.setup();
    renderApp("/calendar");

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(within(getPicker()).getAllByRole("button")).toHaveLength(30);
    expect(getDayButton("Sunday, November 1")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});