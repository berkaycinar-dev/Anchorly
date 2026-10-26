import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { renderApp } from "./test/renderApp";

const WATER_ID = "11111111-1111-4111-8111-111111111111";
const READ_ID = "22222222-2222-4222-8222-222222222222";

function getDayView() {
  return document.querySelector(".routine-day-view");
}

function getDayPicker() {
  return within(getDayView()).getByRole("group", { name: "Choose a day" });
}

function getDayButton(name) {
  return within(getDayPicker()).getByRole("button", { name });
}

function getRoutineCheckbox(title) {
  return within(getDayView()).getByRole("checkbox", { name: title });
}

beforeEach(() => {
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
});

describe("App routine day view", () => {
  it("shows one button for every day of the month", () => {
    renderApp("/routine");

    expect(within(getDayPicker()).getAllByRole("button")).toHaveLength(31);
  });

  it("selects today when the current month is open", () => {
    renderApp("/routine");

    expect(getDayButton("Saturday, October 10")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(getDayButton("Friday, October 9")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows the checks of the selected day", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    expect(getRoutineCheckbox("Water")).toBeChecked();
    expect(getRoutineCheckbox("Read")).not.toBeChecked();

    await user.click(getDayButton("Friday, October 9"));

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

  it("marks only fully completed days", () => {
    renderApp("/routine");

    expect(
      getDayButton("Friday, October 9").querySelector(".routine-day-dot"),
    ).toHaveClass("routine-day-dot-visible");
    expect(
      getDayButton("Saturday, October 10").querySelector(".routine-day-dot"),
    ).not.toHaveClass("routine-day-dot-visible");
  });

  it("shows the monthly progress of each routine", () => {
    renderApp("/routine");

    const waterItem = getRoutineCheckbox("Water").closest("li");

    expect(within(waterItem).getByText("This month 2/31")).toBeInTheDocument();
  });

  it("selects the first day after moving to another month", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(within(getDayPicker()).getAllByRole("button")).toHaveLength(30);
    expect(getDayButton("Sunday, November 1")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("deletes a routine from the day view", async () => {
    const user = userEvent.setup();
    renderApp("/routine");

    await user.click(
      within(getDayView()).getByRole("button", {
        name: 'Delete routine "Read"',
      }),
    );

    expect(
      within(getDayView()).queryByRole("checkbox", { name: "Read" }),
    ).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no routines", () => {
    localStorage.setItem("routines", JSON.stringify([]));
    renderApp("/routine");

    expect(
      within(getDayView()).getByText("No routines yet"),
    ).toBeInTheDocument();
  });
});

describe("App routine table labels", () => {
  it("names every day checkbox after its routine and day", () => {
    renderApp("/routine");

    const table = screen.getByRole("table");

    expect(
      within(table).getByRole("checkbox", { name: '"Water", day 10' }),
    ).toBeChecked();
    expect(
      within(table).getByRole("checkbox", { name: '"Read", day 10' }),
    ).not.toBeChecked();
  });

  it("names the delete button in the user's language", () => {
    renderApp("/routine");

    expect(
      within(screen.getByRole("table")).getByRole("button", {
        name: 'Delete routine "Water"',
      }),
    ).toBeInTheDocument();
  });
});
