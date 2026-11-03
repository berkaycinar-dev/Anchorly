import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, it, expect } from "vitest";
import { renderApp, getCurrentPath } from "./test/renderApp";
import { addDaysToDateString, getLocalDateString } from "./utils/dateHelpers";

const today = getLocalDateString();
const SERIES_LENGTH = 125;
const PAGE_COUNT = 16;
const GROUP_ID = "55555555-5555-4555-8555-555555555555";

function createStoredTask(id, title, overrides = {}) {
  return {
    id,
    title,
    category: "Health",
    date: today,
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

function createSeriesTasks() {
  return Array.from({ length: SERIES_LENGTH }, (_, index) => {
    const offset = index - 4;

    return createStoredTask(`series-${index}`, "Morning walk", {
      date: addDaysToDateString(today, offset),
      completed: index < 2,
      repeat: "daily",
      repeatGroupId: GROUP_ID,
      order: index,
    });
  });
}

function seed(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function getDateRows() {
  return screen
    .getAllByRole("checkbox", { name: /Complete the .* repeat of/ })
    .map((checkbox) => checkbox.closest("li"));
}

beforeEach(() => {
  localStorage.setItem("language", JSON.stringify("en"));
});

describe("App archive series list", () => {
  it("lists each recurring series as one row with summary cards", () => {
    seed([
      ...createSeriesTasks(),
      createStoredTask("once-1", "Buy stamps", { repeat: "none" }),
    ]);
    renderApp("/archive");

    expect(
      screen.getByRole("tab", { name: "Recurring series" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("link", { name: "Open series Morning walk" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Buy stamps")).not.toBeInTheDocument();
    expect(screen.getByText("Active series")).toBeInTheDocument();
    expect(screen.getByText("Pending today")).toBeInTheDocument();
    expect(screen.getByText("Overall completion")).toBeInTheDocument();
  });

  it("shows an empty state when there are no recurring tasks", () => {
    seed([createStoredTask("once-1", "Buy stamps")]);
    renderApp("/archive");

    expect(screen.getByText("No recurring series yet")).toBeInTheDocument();
  });

  it("opens the series detail from a row", async () => {
    const user = userEvent.setup();

    seed(createSeriesTasks());
    renderApp("/archive");

    await user.click(
      screen.getByRole("link", { name: "Open series Morning walk" }),
    );

    expect(getCurrentPath()).toBe(`/archive/series/${GROUP_ID}`);
    expect(
      screen.getByRole("heading", { name: "Morning walk" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Series status")).toBeInTheDocument();
  });
});

describe("App archive series detail", () => {
  it("redirects to the archive when the series does not exist", () => {
    seed(createSeriesTasks());
    renderApp("/archive/series/missing");

    expect(getCurrentPath()).toBe("/archive");
  });

  it("goes back to the archive with the back button", async () => {
    const user = userEvent.setup();

    seed(createSeriesTasks());
    renderApp(`/archive/series/${GROUP_ID}`);

    await user.click(screen.getByRole("button", { name: "← Back to Archive" }));

    expect(getCurrentPath()).toBe("/archive");
  });

  it("opens on the page that holds today and pages through the dates", async () => {
    const user = userEvent.setup();

    seed(createSeriesTasks());
    renderApp(`/archive/series/${GROUP_ID}`);

    expect(getDateRows()).toHaveLength(8);
    expect(screen.getByText(`Page 1 / ${PAGE_COUNT}`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(getDateRows()).toHaveLength(8);
    expect(screen.getByText(`Page 2 / ${PAGE_COUNT}`)).toBeInTheDocument();
    expect(
      screen.getByText(`9–16 of ${SERIES_LENGTH} dates`),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Page 1" }));

    expect(getDateRows()).toHaveLength(8);

    await user.click(
      screen.getByRole("button", { name: `Page ${PAGE_COUNT}` }),
    );

    expect(getDateRows()).toHaveLength(SERIES_LENGTH - (PAGE_COUNT - 1) * 8);
  });

  it("jumps back to today", async () => {
    const user = userEvent.setup();

    seed(createSeriesTasks());
    renderApp(`/archive/series/${GROUP_ID}`);

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Go to today" }));

    expect(screen.getByText(`Page 1 / ${PAGE_COUNT}`)).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: `Complete the ${today} repeat of Morning walk`,
      }),
    ).toBeInTheDocument();
  });

  it("completes a repeat from its tick button", async () => {
    const user = userEvent.setup();

    seed(createSeriesTasks());
    renderApp(`/archive/series/${GROUP_ID}`);

    const checkbox = screen.getByRole("checkbox", {
      name: `Complete the ${today} repeat of Morning walk`,
    });

    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();

    const stored = JSON.parse(localStorage.getItem("tasks"));

    expect(stored.find((task) => task.date === today).completed).toBe(true);
  });

  it("filters the dates by done and pending", async () => {
    const user = userEvent.setup();

    seed(createSeriesTasks());
    renderApp(`/archive/series/${GROUP_ID}`);

    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(getDateRows()).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Pending" }));

    expect(getDateRows()).toHaveLength(8);
    expect(screen.getByText(`Page 1 / ${PAGE_COUNT}`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));

    expect(
      screen.getByText(`1–8 of ${SERIES_LENGTH} dates`),
    ).toBeInTheDocument();
  });

  it("opens the task detail from a date", async () => {
    const user = userEvent.setup();

    seed(createSeriesTasks());
    renderApp(`/archive/series/${GROUP_ID}`);

    await user.click(
      screen.getByRole("button", {
        name: `Open details of the ${today} repeat`,
      }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("App archive one-time tasks", () => {
  function seedOneTime() {
    seed([
      createStoredTask("once-1", "Buy stamps", { order: 0 }),
      createStoredTask("once-2", "Call dentist", { order: 1 }),
      createStoredTask("once-3", "File taxes", {
        completed: true,
        order: 2,
      }),
      ...createSeriesTasks(),
    ]);
  }

  it("lists only one-time tasks with completed ones in their own section", async () => {
    const user = userEvent.setup();

    seedOneTime();
    renderApp("/archive");

    await user.click(screen.getByRole("tab", { name: "One-time" }));

    expect(screen.getByText("Buy stamps")).toBeInTheDocument();
    expect(screen.getByText("Call dentist")).toBeInTheDocument();
    expect(screen.getByText("Completed (1)")).toBeInTheDocument();
    expect(screen.queryByText("Morning walk")).not.toBeInTheDocument();
  });

  it("shows only not completed tasks with the filter", async () => {
    const user = userEvent.setup();

    seedOneTime();
    renderApp("/archive");

    await user.click(screen.getByRole("tab", { name: "One-time" }));
    await user.click(screen.getByRole("button", { name: "Not completed" }));

    expect(screen.getByText("Buy stamps")).toBeInTheDocument();
    expect(screen.queryByText("File taxes")).not.toBeInTheDocument();
  });

  it("shows only completed tasks with the filter", async () => {
    const user = userEvent.setup();

    seedOneTime();
    renderApp("/archive");

    await user.click(screen.getByRole("tab", { name: "One-time" }));
    await user.click(screen.getByRole("button", { name: "Completed" }));

    expect(screen.queryByText("Buy stamps")).not.toBeInTheDocument();
    expect(screen.getByText("File taxes")).toBeInTheDocument();
  });

  it("shows an empty message when the filter matches nothing", async () => {
    const user = userEvent.setup();

    seed([createStoredTask("once-1", "Buy stamps")]);
    renderApp("/archive");

    await user.click(screen.getByRole("tab", { name: "One-time" }));
    await user.click(screen.getByRole("button", { name: "Completed" }));

    expect(screen.getByText("No tasks match this filter")).toBeInTheDocument();
  });
});
