import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { WIDE_SCREEN_MEDIA_QUERY } from "./hooks/useMediaQuery";
import { renderApp } from "./test/renderApp";

const WATER_ID = "11111111-1111-4111-8111-111111111111";
const READ_ID = "22222222-2222-4222-8222-222222222222";

function useWideScreen() {
  window.matchMedia = (media) => ({
    matches: media === WIDE_SCREEN_MEDIA_QUERY,
    media,
    addEventListener() {},
    removeEventListener() {},
  });
}

function getWeekPicker() {
  return screen.getByRole("group", { name: "Choose a day" });
}

function getDayButton(name) {
  return within(getWeekPicker()).getByRole("button", {
    name: new RegExp(`^${name},`),
  });
}

function getRoutineCheckbox(title) {
  return screen.getByRole("checkbox", { name: title });
}

function getRoutineCard(title) {
  return getRoutineCheckbox(title).closest("article");
}

function getSummaryCard(title) {
  return screen.getByRole("heading", { name: title }).closest("section");
}

beforeEach(() => {
  useWideScreen();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 10, 12, 0));
  localStorage.setItem("language", JSON.stringify("en"));
  localStorage.setItem(
    "routines",
    JSON.stringify([
      { id: WATER_ID, title: "Water" },
      { id: READ_ID, title: "Read" },
    ]),
  );
  localStorage.setItem(
    "routineChecks",
    JSON.stringify({
      [`2026-10-${WATER_ID}-10`]: true,
      [`2026-10-${WATER_ID}-9`]: true,
      [`2026-10-${READ_ID}-9`]: true,
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  delete window.matchMedia;
});

describe("App routine week view layout", () => {
  it("has no add button above the week strip", () => {
    renderApp("/routine");

    expect(
      screen.queryByRole("button", { name: "Add Routine" }),
    ).not.toBeInTheDocument();
  });

  it("replaces the mobile day view on wide screens", () => {
    renderApp("/routine");

    expect(document.querySelector(".routine-week-view")).toBeInTheDocument();
    expect(document.querySelector(".routine-day-view")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Next" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the mobile day view on narrow screens", () => {
    delete window.matchMedia;
    renderApp("/routine");

    expect(document.querySelector(".routine-day-view")).toBeInTheDocument();
    expect(
      document.querySelector(".routine-week-view"),
    ).not.toBeInTheDocument();
  });
});

describe("App routine week view week strip", () => {
  it("shows the seven days of the current week starting on Monday", () => {
    renderApp("/routine");

    const buttons = within(getWeekPicker()).getAllByRole("button");

    expect(buttons).toHaveLength(7);
    expect(buttons[0]).toHaveAccessibleName(/^Monday, October 5,/);
    expect(buttons[6]).toHaveAccessibleName(/^Sunday, October 11,/);
  });

  it("starts the week on Sunday when the setting says so", () => {
    localStorage.setItem("weekStartDay", JSON.stringify("sunday"));
    renderApp("/routine");

    const buttons = within(getWeekPicker()).getAllByRole("button");

    expect(buttons[0]).toHaveAccessibleName(/^Sunday, October 4,/);
  });

  it("selects today and names the progress of each day", () => {
    renderApp("/routine");

    expect(getDayButton("Saturday, October 10")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(getDayButton("Saturday, October 10")).toHaveAccessibleName(
      "Saturday, October 10, 1 of 2 routines done",
    );
    expect(getDayButton("Friday, October 9")).toHaveAccessibleName(
      "Friday, October 9, 2 of 2 routines done",
    );
  });

  it("moves to the previous and the next week", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    await user.click(screen.getByRole("button", { name: "Previous week" }));

    expect(getDayButton("Saturday, October 3")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Next week" }));
    await user.click(screen.getByRole("button", { name: "Next week" }));

    expect(getDayButton("Saturday, October 17")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows the days of the next month when the week crosses it", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole("button", { name: "Next week" }));
    }

    const buttons = within(getWeekPicker()).getAllByRole("button");

    expect(buttons[0]).toHaveAccessibleName(/^Monday, October 26,/);
    expect(buttons[6]).toHaveAccessibleName(/^Sunday, November 1,/);
  });

  it("shows the selected date above the week", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    expect(screen.getByText("Saturday, October 10, 2026")).toBeInTheDocument();

    await user.click(getDayButton("Friday, October 9"));

    expect(screen.getByText("Friday, October 9, 2026")).toBeInTheDocument();
  });

  it("goes back to today with the back to today button", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    expect(
      screen.queryByRole("button", { name: "Back to today" }),
    ).not.toBeInTheDocument();

    await user.click(getDayButton("Friday, October 9"));
    await user.click(screen.getByRole("button", { name: "Back to today" }));

    expect(getDayButton("Saturday, October 10")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.queryByRole("button", { name: "Back to today" }),
    ).not.toBeInTheDocument();
  });
});

describe("App routine week view cards", () => {
  it("shows the checks of the selected day", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    expect(
      screen.getByRole("heading", { name: "Today's routines" }),
    ).toBeInTheDocument();
    expect(getRoutineCheckbox("Water")).toBeChecked();
    expect(getRoutineCheckbox("Read")).not.toBeChecked();

    await user.click(getDayButton("Friday, October 9"));

    expect(
      screen.getByRole("heading", { name: "Routines for October 9" }),
    ).toBeInTheDocument();
    expect(getRoutineCheckbox("Water")).toBeChecked();
    expect(getRoutineCheckbox("Read")).toBeChecked();
  });

  it("toggles a routine for the selected day only", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    await user.click(getDayButton("Sunday, October 11"));
    await user.click(getRoutineCheckbox("Read"));

    expect(getRoutineCheckbox("Read")).toBeChecked();

    await user.click(getDayButton("Saturday, October 10"));

    expect(getRoutineCheckbox("Read")).not.toBeChecked();
  });

  it("toggles a day in the next month from the week strip", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole("button", { name: "Next week" }));
    }

    await user.click(getDayButton("Sunday, November 1"));
    await user.click(getRoutineCheckbox("Water"));

    expect(getRoutineCheckbox("Water")).toBeChecked();
    expect(
      within(getRoutineCard("Water")).getByText("This month 1/30"),
    ).toBeInTheDocument();
  });

  it("shows the monthly progress and the streak of each routine", () => {
    renderApp("/routine");

    const waterCard = getRoutineCard("Water");

    expect(within(waterCard).getByText("This month 2/31")).toBeInTheDocument();
    expect(within(waterCard).getByText("2 days")).toBeInTheDocument();
  });

  it("describes the last 14 days of each routine", () => {
    renderApp("/routine");

    expect(
      within(getRoutineCard("Water")).getByRole("img", {
        name: '"Water", done on 2 of the last 14 days',
      }),
    ).toBeInTheDocument();
  });

  it("shows no streak for a routine without recent checks", () => {
    localStorage.setItem("routineChecks", JSON.stringify({}));
    renderApp("/routine");

    expect(
      within(getRoutineCard("Water")).getByText("No streak"),
    ).toBeInTheDocument();
  });

  it("deletes a routine from its options menu", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    const optionsButton = screen.getByRole("button", {
      name: 'Options for "Read"',
    });

    expect(optionsButton).toHaveAttribute("aria-expanded", "false");

    await user.click(optionsButton);

    expect(optionsButton).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("menuitem", { name: "Delete routine" }));

    expect(
      screen.queryByRole("checkbox", { name: "Read" }),
    ).not.toBeInTheDocument();
  });

  it("closes the options menu with Escape and returns focus", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    const optionsButton = screen.getByRole("button", {
      name: 'Options for "Water"',
    });

    await user.click(optionsButton);

    expect(
      screen.getByRole("menuitem", { name: "Delete routine" }),
    ).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(optionsButton).toHaveFocus();
  });

  it("shows an empty state when there are no routines", () => {
    localStorage.setItem("routines", JSON.stringify([]));
    renderApp("/routine");

    expect(screen.getByText("No routines yet")).toBeInTheDocument();
    expect(
      screen.getByText("Add your first routine below to get started."),
    ).toBeInTheDocument();
  });
});

describe("App routine week view summary", () => {
  it("shows the progress of the selected day", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    expect(
      within(getSummaryCard("Today's progress")).getByText(/^1 \/ 2/),
    ).toBeInTheDocument();

    await user.click(getDayButton("Friday, October 9"));

    expect(
      within(getSummaryCard("Selected day's progress")).getByText(/^2 \/ 2/),
    ).toBeInTheDocument();
  });

  it("shows the longest active streak and its routine", () => {
    renderApp("/routine");

    const card = getSummaryCard("Longest active streak");

    expect(within(card).getByText(/^2 days/)).toBeInTheDocument();
    expect(within(card).getByText("Water")).toBeInTheDocument();
  });

  it("shows the average of the current month", () => {
    renderApp("/routine");

    expect(
      within(getSummaryCard("October average")).getByText(/^15%/),
    ).toBeInTheDocument();
  });
});

describe("App routine week view add form", () => {
  it("adds a routine from the add tile", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    await user.type(
      screen.getByRole("textbox", { name: "New routine" }),
      "Stretch",
    );
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(getRoutineCheckbox("Stretch")).not.toBeChecked();
    expect(screen.getByRole("textbox", { name: "New routine" })).toHaveValue(
      "",
    );
  });
});

describe("App routine week view transitions", () => {
  function getDayPanel() {
    return document.querySelector(".routine-day-panel");
  }

  it("does not animate on the first render", () => {
    renderApp("/routine");

    expect(getDayPanel()).not.toHaveClass("routine-transition-forward");
    expect(getDayPanel()).not.toHaveClass("routine-transition-back");
  });

  it("slides the day content back and forward when the day changes", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    await user.click(getDayButton("Friday, October 9"));

    expect(getDayPanel()).toHaveClass("routine-transition-back");

    await user.click(getDayButton("Sunday, October 11"));

    expect(getDayPanel()).toHaveClass("routine-transition-forward");
  });

  it("slides the days of the week when the week changes", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    await user.click(screen.getByRole("button", { name: "Next week" }));

    expect(getWeekPicker()).toHaveClass("routine-transition-forward");

    await user.click(screen.getByRole("button", { name: "Previous week" }));

    expect(getWeekPicker()).toHaveClass("routine-transition-back");
  });

  it("keeps the checkbox focused after toggling a routine", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    await user.click(getRoutineCheckbox("Read"));

    expect(getRoutineCheckbox("Read")).toHaveFocus();
  });
});
