import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderApp } from "./test/renderApp";

let counter = 0;

function createTask(title, date, overrides = {}) {
  counter += 1;

  return {
    id: `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`,
    title,
    category: "Work",
    date,
    completed: false,
    projectId: null,
    description: "",
    steps: [],
    completedAt: null,
    order: counter,
    repeat: "none",
    repeatGroupId: null,
    attachments: [],
    ...overrides,
  };
}

function seed({ language = "en", tasks = [], routines = [], weekStart } = {}) {
  localStorage.setItem("language", JSON.stringify(language));
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("routines", JSON.stringify(routines));
  localStorage.setItem("routineChecks", JSON.stringify({}));

  if (weekStart) {
    localStorage.setItem("weekStartDay", JSON.stringify(weekStart));
  }
}

function getGrid() {
  return document.querySelector(".calendar-grid");
}

function getPanel() {
  return document.querySelector(".calendar-panel");
}

function getCell(name) {
  return within(getGrid()).getByRole("button", { name });
}

function getPanelTitles() {
  return Array.from(
    getPanel().querySelectorAll(".calendar-panel-task-title"),
  ).map((button) => button.textContent);
}

function seedMonth() {
  seed({
    tasks: [
      createTask("Old errand", "2026-10-08", { completed: true }),
      createTask("Finished report", "2026-10-10", { completed: true }),
      createTask("Call the bank", "2026-10-10"),
      createTask("Dentist", "2026-10-12"),
      createTask("One", "2026-10-14"),
      createTask("Two", "2026-10-14"),
      createTask("Three", "2026-10-14"),
      createTask("Four", "2026-10-14"),
      createTask("Five", "2026-10-14"),
      createTask("A", "2026-10-17"),
      createTask("B", "2026-10-17"),
      createTask("C", "2026-10-17"),
      createTask("D", "2026-10-17"),
      createTask("E", "2026-10-17"),
      createTask("F", "2026-10-17"),
    ],
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 10, 12, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("App calendar month grid", () => {
  it("renders one button for every day of the month and the neighbouring days as plain cells", () => {
    seedMonth();
    renderApp("/calendar");

    expect(within(getGrid()).getAllByRole("button")).toHaveLength(31);
    expect(getGrid().querySelectorAll(".calendar-cell-outside")).toHaveLength(
      4,
    );
  });

  it("names the weekday columns with full names and short weekend names", () => {
    seedMonth();
    renderApp("/calendar");

    const labels = Array.from(
      getGrid().querySelectorAll(".calendar-weekday"),
    ).map((header) => header.textContent);

    expect(labels).toEqual([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SAT",
      "SUN",
    ]);
  });

  it("puts the weekend columns on both ends when the week starts on Sunday", () => {
    seed({ weekStart: "sunday" });
    renderApp("/calendar");

    const headers = Array.from(getGrid().querySelectorAll(".calendar-weekday"));

    expect(getGrid()).toHaveAttribute("data-week-start", "sunday");
    expect(headers[0]).toHaveAttribute("data-weekend");
    expect(headers[6]).toHaveAttribute("data-weekend");
    expect(headers[3]).not.toHaveAttribute("data-weekend");
  });

  it("marks weekend and today cells", () => {
    seedMonth();
    renderApp("/calendar");

    expect(getCell("Saturday, October 10, 2 tasks")).toHaveAttribute(
      "data-weekend",
    );
    expect(getCell("Saturday, October 10, 2 tasks")).toHaveAttribute(
      "data-today",
    );
    expect(getCell("Monday, October 12, 1 task")).not.toHaveAttribute(
      "data-weekend",
    );
    expect(getCell("Monday, October 12, 1 task")).not.toHaveAttribute(
      "data-today",
    );
  });

  it("shows the completion percent only for today and past days with tasks", () => {
    seedMonth();
    renderApp("/calendar");

    expect(
      getCell("Thursday, October 8, 1 task").querySelector(
        ".calendar-cell-percent",
      ).textContent,
    ).toBe("100%");
    expect(
      getCell("Saturday, October 10, 2 tasks").querySelector(
        ".calendar-cell-percent",
      ).textContent,
    ).toBe("50%");
    expect(
      getCell("Sunday, October 11").querySelector(".calendar-cell-percent"),
    ).toBeNull();
    expect(
      getCell("Monday, October 12, 1 task").querySelector(
        ".calendar-cell-percent",
      ),
    ).toBeNull();
  });

  it("lists up to three tasks on a weekday and summarises the rest", () => {
    seedMonth();
    renderApp("/calendar");

    const cell = getCell("Wednesday, October 14, 5 tasks");
    const titles = Array.from(
      cell.querySelectorAll(".calendar-cell-task-title"),
    ).map((title) => title.textContent);

    expect(titles).toEqual(["One", "Two", "Three"]);
    expect(cell.querySelector(".calendar-cell-more").textContent).toBe(
      "+2 more",
    );
  });

  it("shows only coloured dots on a weekend day", () => {
    seedMonth();
    renderApp("/calendar");

    const cell = getCell("Saturday, October 17, 6 tasks");

    expect(cell.querySelectorAll(".calendar-dot")).toHaveLength(4);
    expect(cell.querySelector(".calendar-cell-task")).toBeNull();
    expect(cell.querySelector(".calendar-cell-more").textContent).toBe("+2");
  });

  it("renders Turkish weekday names and the Turkish today label", () => {
    seed({ language: "tr", tasks: [createTask("Rapor", "2026-10-10")] });
    renderApp("/calendar");

    const labels = Array.from(
      getGrid().querySelectorAll(".calendar-weekday"),
    ).map((header) => header.textContent);

    expect(labels[0]).toBe("PAZARTESİ");
    expect(labels[2]).toBe("ÇARŞAMBA");
    expect(labels[5]).toBe("CMT");
    expect(
      getPanel().querySelector(".calendar-panel-eyebrow").textContent,
    ).toBe("BUGÜN · CUMARTESİ");
  });
});

describe("App calendar day panel", () => {
  it("shows today by default with its summary and progress", () => {
    seedMonth();
    renderApp("/calendar");

    const panel = within(getPanel());

    expect(
      panel.getByRole("heading", { name: "October 10" }),
    ).toBeInTheDocument();
    expect(panel.getByText("TODAY · SATURDAY")).toBeInTheDocument();
    expect(panel.getByText("2 tasks · 1 completed")).toBeInTheDocument();
    expect(panel.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
  });

  it("lists open tasks before completed ones", () => {
    seedMonth();
    renderApp("/calendar");

    expect(getPanelTitles()).toEqual(["Call the bank", "Finished report"]);
  });

  it("switches to another day when its cell is selected", async () => {
    const user = userEvent.setup();
    seedMonth();
    renderApp("/calendar");

    await user.click(getCell("Monday, October 12, 1 task"));

    const panel = within(getPanel());

    expect(
      panel.getByRole("heading", { name: "October 12" }),
    ).toBeInTheDocument();
    expect(panel.getByText("MONDAY")).toBeInTheDocument();
    expect(panel.getByText("1 task · 0 completed")).toBeInTheDocument();
    expect(getCell("Monday, October 12, 1 task")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(getCell("Saturday, October 10, 2 tasks")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows an empty state for a day without tasks", async () => {
    const user = userEvent.setup();
    seedMonth();
    renderApp("/calendar");

    await user.click(getCell("Sunday, October 11"));

    expect(within(getPanel()).getByText("No tasks")).toBeInTheDocument();
    expect(
      within(getPanel()).getByText("No tasks on this day."),
    ).toBeInTheDocument();
    expect(within(getPanel()).queryByRole("progressbar")).toBeNull();
  });

  it("completes a task from the panel and updates the summary and cell", async () => {
    const user = userEvent.setup();
    seedMonth();
    renderApp("/calendar");

    await user.click(
      within(getPanel()).getByRole("checkbox", {
        name: 'Complete "Call the bank"',
      }),
    );

    expect(
      within(getPanel()).getByText("2 tasks · 2 completed"),
    ).toBeInTheDocument();
    expect(
      getCell("Saturday, October 10, 2 tasks").querySelector(
        ".calendar-cell-percent",
      ).textContent,
    ).toBe("100%");
  });

  it("opens the task details from the panel", async () => {
    const user = userEvent.setup();
    seedMonth();
    renderApp("/calendar");

    await user.click(
      within(getPanel()).getByRole("button", { name: "Call the bank" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Call the bank" }),
    ).toBeInTheDocument();
  });

  it("adds a task to the selected day", async () => {
    const user = userEvent.setup();
    seedMonth();
    renderApp("/calendar");

    await user.click(getCell("Sunday, October 11"));
    await user.type(
      within(getPanel()).getByRole("textbox", { name: "Add task to this day" }),
      "Water the plants",
    );
    await user.click(within(getPanel()).getByRole("button", { name: "Add" }));

    expect(getPanelTitles()).toEqual(["Water the plants"]);
    expect(getCell("Sunday, October 11, 1 task")).toBeInTheDocument();
  });

  it("does not add a task with an empty title", async () => {
    const user = userEvent.setup();
    seedMonth();
    renderApp("/calendar");

    await user.click(getCell("Sunday, October 11"));
    await user.click(within(getPanel()).getByRole("button", { name: "Add" }));

    expect(getPanelTitles()).toEqual([]);
  });

  it("does not show routines in the panel even when routines exist", () => {
    seed({
      routines: [
        { id: "r1", title: "Water" },
        { id: "r2", title: "Read" },
      ],
    });
    renderApp("/calendar");

    expect(
      within(getPanel()).queryByRole("button", { name: "Water" }),
    ).toBeNull();
    expect(within(getPanel()).queryByText(/Routines/)).toBeNull();
  });

  it("keeps the hide button inside the panel header", () => {
    seedMonth();
    renderApp("/calendar");

    const toggle = within(getPanel()).getByRole("button", {
      name: "Hide panel",
    });

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("aria-controls", getPanel().id);
    expect(
      within(document.querySelector(".calendar-toolbar")).queryByRole(
        "button",
        { name: /panel/i },
      ),
    ).toBeNull();
  });

  it("collapses to a rail with the day number and task count", async () => {
    const user = userEvent.setup();
    seedMonth();
    renderApp("/calendar");

    await user.click(getCell("Monday, October 12, 1 task"));
    await user.click(
      within(getPanel()).getByRole("button", { name: "Hide panel" }),
    );

    const rail = document.querySelector(".calendar-panel-rail");

    expect(getPanel()).toBeNull();
    expect(rail).toHaveAttribute("aria-label", "Monday, October 12");
    expect(rail.querySelector(".calendar-rail-day").textContent).toBe("12");
    expect(rail.querySelector(".calendar-rail-label").textContent).toBe(
      "1 task",
    );
    expect(
      within(rail).getByRole("button", { name: "Show panel" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(within(rail).queryByRole("checkbox")).toBeNull();
    expect(within(rail).queryByRole("textbox")).toBeNull();
  });

  it("updates the rail when another day is selected while collapsed", async () => {
    const user = userEvent.setup();
    seedMonth();
    renderApp("/calendar");

    await user.click(
      within(getPanel()).getByRole("button", { name: "Hide panel" }),
    );
    await user.click(getCell("Wednesday, October 14, 5 tasks"));

    const rail = document.querySelector(".calendar-panel-rail");

    expect(rail.querySelector(".calendar-rail-day").textContent).toBe("14");
    expect(rail.querySelector(".calendar-rail-label").textContent).toBe(
      "5 tasks",
    );

    await user.click(getCell("Sunday, October 11"));

    expect(document.querySelector(".calendar-rail-label").textContent).toBe(
      "No tasks",
    );
  });

  it("expands the panel again on the same day", async () => {
    const user = userEvent.setup();
    seedMonth();
    renderApp("/calendar");

    await user.click(getCell("Monday, October 12, 1 task"));
    await user.click(
      within(getPanel()).getByRole("button", { name: "Hide panel" }),
    );
    await user.click(screen.getByRole("button", { name: "Show panel" }));

    expect(document.querySelector(".calendar-panel-rail")).toBeNull();
    expect(
      within(getPanel()).getByRole("heading", { name: "October 12" }),
    ).toBeInTheDocument();
    expect(getCell("Monday, October 12, 1 task")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("App calendar navigation", () => {
  it("moves between months and selects the first day of another month", async () => {
    const user = userEvent.setup();
    seedMonth();
    renderApp("/calendar");

    expect(
      screen.getByRole("heading", { name: "October 2026" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByRole("heading", { name: "November 2026" }),
    ).toBeInTheDocument();
    expect(
      within(getPanel()).getByRole("heading", { name: "November 1" }),
    ).toBeInTheDocument();
    expect(within(getGrid()).getAllByRole("button")).toHaveLength(30);

    await user.click(screen.getByRole("button", { name: "Previous" }));
    await user.click(screen.getByRole("button", { name: "Previous" }));

    expect(
      screen.getByRole("heading", { name: "September 2026" }),
    ).toBeInTheDocument();
  });

  it("returns to the current month and day with the Today button", async () => {
    const user = userEvent.setup();
    seedMonth();
    renderApp("/calendar");

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Today" }));

    expect(
      screen.getByRole("heading", { name: "October 2026" }),
    ).toBeInTheDocument();
    expect(
      within(getPanel()).getByRole("heading", { name: "October 10" }),
    ).toBeInTheDocument();
  });

  it("no longer offers a week view toggle", () => {
    seedMonth();
    renderApp("/calendar");

    expect(screen.queryByRole("button", { name: "October 2026" })).toBeNull();
  });
});
