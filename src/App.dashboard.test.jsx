import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { renderApp, getCurrentPath } from "./test/renderApp";
import { addDaysToDateString, getLocalDateString } from "./utils/dateHelpers";

const TODAY = getLocalDateString();
const PROJECT_ID = "aaaaaaaa-0000-4000-8000-000000000001";
let counter = 0;

function task(title, date, extra = {}) {
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
    ...extra,
  };
}

function seed({ tasks = [], routines = [], projects = [], layout } = {}) {
  localStorage.setItem("language", JSON.stringify("en"));
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("routines", JSON.stringify(routines));
  localStorage.setItem("routineChecks", JSON.stringify({}));
  localStorage.setItem("projects", JSON.stringify(projects));

  if (layout) {
    localStorage.setItem("dashboardLayout", JSON.stringify(layout));
  }
}

function card(name) {
  return screen.getByRole("region", { name });
}

function queryCard(name) {
  return screen.queryByRole("region", { name });
}

const ALL_CARDS = [
  "todayRing",
  "weeklyRoutine",
  "todayTasks",
  "overdue",
  "upcoming",
  "routines",
  "streaks",
  "projects",
  "calendar",
  "categories",
].map((id) => ({ id, size: id === "upcoming" ? "wide" : "small" }));

beforeEach(() => {
  counter = 0;
});

describe("dashboard", () => {
  it("shows the default cards and the summary", () => {
    seed({ tasks: [task("Write report", TODAY)] });
    renderApp("/");

    expect(card("Today's progress")).toBeInTheDocument();
    expect(card("Weekly routine")).toBeInTheDocument();
    expect(card("Upcoming")).toBeInTheDocument();
    expect(queryCard("Streaks")).toBeNull();
    expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
  });

  it("links each card to its page", async () => {
    const user = userEvent.setup();
    seed();
    renderApp("/");

    await user.click(
      within(card("Upcoming")).getByRole("link", { name: "Open Calendar" }),
    );

    expect(getCurrentPath()).toBe("/calendar");
  });

  it("shows empty states", () => {
    seed({ layout: ALL_CARDS });
    renderApp("/");

    expect(
      within(card("Upcoming")).getByText("No tasks in the next 7 days."),
    ).toBeInTheDocument();
    expect(
      within(card("Overdue tasks")).getByText("No overdue tasks."),
    ).toBeInTheDocument();
    expect(
      within(card("Today's routines")).getByText("No routines yet."),
    ).toBeInTheDocument();
    expect(
      within(card("Projects")).getByText("No projects yet."),
    ).toBeInTheDocument();
    expect(
      within(card("Today's tasks")).getByText("No tasks for today."),
    ).toBeInTheDocument();
  });

  it("shows three of today's tasks and opens the rest as a day list", async () => {
    const user = userEvent.setup();
    seed({
      layout: [{ id: "todayTasks", size: "small" }],
      tasks: ["A", "B", "C", "D", "E"].map((title) => task(title, TODAY)),
    });
    renderApp("/");

    const list = card("Today's tasks");

    expect(
      within(list).getAllByRole("button", { name: /^Open the details/ }),
    ).toHaveLength(3);

    await user.click(
      within(list).getByRole("button", { name: /2 more tasks/ }),
    );

    const dialog = screen.getByRole("dialog");

    expect(
      within(dialog).getAllByRole("button", { name: /^Open the details/ }),
    ).toHaveLength(5);
  });

  it("opens one of today's tasks in the task details", async () => {
    const user = userEvent.setup();
    seed({
      layout: [{ id: "todayTasks", size: "small" }],
      tasks: [task("Write report", TODAY)],
    });
    renderApp("/");

    await user.click(
      within(card("Today's tasks")).getByRole("button", {
        name: "Open the details of Write report",
      }),
    );

    expect(
      screen.getByRole("dialog", { name: "Write report" }),
    ).toBeInTheDocument();
  });

  it("lists undated tasks in today's day list too", async () => {
    const user = userEvent.setup();
    seed({
      layout: [{ id: "todayTasks", size: "small" }],
      tasks: [
        ...["A", "B", "C", "D"].map((title) => task(title, TODAY)),
        task("Someday", null),
      ],
    });
    renderApp("/");

    await user.click(
      within(card("Today's tasks")).getByRole("button", {
        name: /2 more tasks/,
      }),
    );

    expect(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Open the details of Someday",
      }),
    ).toBeInTheDocument();
  });

  it("shows two overdue tasks and counts the rest", () => {
    seed({
      layout: [{ id: "overdue", size: "small" }],
      tasks: ["A", "B", "C"].map((title) =>
        task(title, addDaysToDateString(TODAY, -3)),
      ),
    });
    renderApp("/");

    const overdue = card("Overdue tasks");

    expect(
      within(overdue).getAllByRole("button", { name: /^Open the details/ }),
    ).toHaveLength(2);
    expect(within(overdue).getByText("+1 more tasks")).toBeInTheDocument();
    expect(within(overdue).getByText("3")).toBeInTheDocument();
  });

  it("shows two upcoming days when small and three when wide", () => {
    const days = [1, 2, 3].map((offset) => addDaysToDateString(TODAY, offset));
    seed({
      layout: [{ id: "upcoming", size: "small" }],
      tasks: days.map((day, index) => task(`Day ${index + 1}`, day)),
    });
    const { unmount } = renderApp("/");

    expect(
      within(card("Upcoming")).getAllByRole("button", {
        name: /^Open the task list/,
      }),
    ).toHaveLength(2);
    expect(
      within(card("Upcoming")).getByText(/\+1 more days/),
    ).toBeInTheDocument();
    unmount();

    localStorage.setItem(
      "dashboardLayout",
      JSON.stringify([{ id: "upcoming", size: "wide" }]),
    );
    renderApp("/");

    expect(
      within(card("Upcoming")).getAllByRole("button", {
        name: /^Open the task list/,
      }),
    ).toHaveLength(3);
    expect(within(card("Upcoming")).queryByText(/more days/)).toBeNull();
  });

  it("opens a task from the day list and returns to the list afterwards", async () => {
    const user = userEvent.setup();
    seed({
      layout: [{ id: "calendar", size: "small" }],
      tasks: [task("Dentist", TODAY)],
    });
    renderApp("/");

    await user.click(
      within(card("Mini calendar")).getAllByRole("button", {
        name: /^Open the task list/,
      })[Number(TODAY.slice(8)) - 1],
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Open the details of Dentist",
      }),
    );

    const detail = screen.getByRole("dialog", { name: "Dentist" });

    fireEvent(detail, new Event("close"));

    expect(
      await screen.findByRole("button", {
        name: "Open the details of Dentist",
      }),
    ).toBeInTheDocument();
  });

  it("opens overdue and upcoming tasks in the task details", async () => {
    const user = userEvent.setup();
    seed({
      layout: [
        { id: "overdue", size: "small" },
        { id: "upcoming", size: "wide" },
      ],
      tasks: [
        task("Late report", addDaysToDateString(TODAY, -2)),
        task("Call mom", addDaysToDateString(TODAY, 1)),
      ],
    });
    renderApp("/");

    await user.click(
      within(card("Overdue tasks")).getByRole("button", {
        name: "Open the details of Late report",
      }),
    );

    expect(
      screen.getByRole("dialog", { name: "Late report" }),
    ).toBeInTheDocument();

    fireEvent(
      screen.getByRole("dialog", { name: "Late report" }),
      new Event("close"),
    );
    await user.click(
      within(card("Upcoming")).getByRole("button", {
        name: "Open the details of Call mom",
      }),
    );

    expect(
      screen.getByRole("dialog", { name: "Call mom" }),
    ).toBeInTheDocument();
  });

  it("limits a busy upcoming day to three tasks and a link to the rest", async () => {
    const user = userEvent.setup();
    const day = addDaysToDateString(TODAY, 2);
    seed({
      tasks: ["A", "B", "C", "D", "E"].map((title) => task(title, day)),
    });
    renderApp("/");

    const upcoming = card("Upcoming");

    expect(
      within(upcoming).getAllByRole("button", { name: /^Open the details/ }),
    ).toHaveLength(3);
    expect(within(upcoming).getByText("+2 more tasks")).toBeInTheDocument();

    await user.click(within(upcoming).getByText("+2 more tasks"));

    expect(
      within(screen.getByRole("dialog")).getAllByRole("listitem"),
    ).toHaveLength(5);
  });

  it("checks off today's routines from the card", async () => {
    const user = userEvent.setup();
    seed({
      layout: [{ id: "routines", size: "small" }],
      routines: [
        { id: "r1", title: "Water" },
        { id: "r2", title: "Read" },
      ],
    });
    renderApp("/");

    const routine = within(card("Today's routines")).getByRole("checkbox", {
      name: /Water/,
    });

    expect(routine).toHaveAttribute("aria-checked", "false");

    await user.click(routine);

    expect(routine).toHaveAttribute("aria-checked", "true");
    expect(
      within(card("Today's routines")).getByText("1 / 2"),
    ).toBeInTheDocument();
  });

  it("opens a project from the projects card", async () => {
    const user = userEvent.setup();
    seed({
      layout: [{ id: "projects", size: "small" }],
      projects: [{ id: PROJECT_ID, name: "Portfolio" }],
    });
    renderApp("/");

    await user.click(
      within(card("Projects")).getByRole("button", {
        name: "Open the Portfolio project",
      }),
    );

    expect(getCurrentPath()).toBe(`/projects/${PROJECT_ID}`);
  });
});

describe("editing the dashboard", () => {
  it("adds, resizes and removes cards and saves them on Done", async () => {
    const user = userEvent.setup();
    seed();
    renderApp("/");

    await user.click(screen.getByRole("button", { name: "Edit dashboard" }));

    const library = screen.getByRole("complementary", { name: "Card library" });

    expect(within(library).getByText("3 / 10 cards shown")).toBeInTheDocument();

    await user.click(
      within(library).getByRole("button", { name: "Add the Streaks card" }),
    );
    await user.click(
      within(card("Upcoming")).getByRole("button", { name: "Small" }),
    );
    await user.click(
      within(card("Today's progress")).getByRole("button", {
        name: "Remove the Today's progress card",
      }),
    );

    expect(
      screen.getByText(
        "Today's progress card removed. You can add it again from the library.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(JSON.parse(localStorage.getItem("dashboardLayout"))).toEqual([
      { id: "weeklyRoutine", size: "small" },
      { id: "upcoming", size: "small" },
      { id: "streaks", size: "small" },
    ]);
    expect(
      screen.queryByRole("complementary", { name: "Card library" }),
    ).toBeNull();
  });

  it("restores the layout on Cancel", async () => {
    const user = userEvent.setup();
    seed();
    renderApp("/");

    await user.click(screen.getByRole("button", { name: "Edit dashboard" }));
    await user.click(
      within(card("Upcoming")).getByRole("button", {
        name: "Remove the Upcoming card",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(card("Upcoming")).toBeInTheDocument();
    expect(localStorage.getItem("dashboardLayout")).toBe(
      JSON.stringify([
        { id: "todayRing", size: "small" },
        { id: "weeklyRoutine", size: "small" },
        { id: "upcoming", size: "wide" },
      ]),
    );
  });

  it("moves cards with the arrow buttons and announces it", async () => {
    const user = userEvent.setup();
    seed();
    renderApp("/");

    await user.click(screen.getByRole("button", { name: "Edit dashboard" }));

    expect(
      screen.getByRole("button", { name: "Move the Today's progress card up" }),
    ).toBeDisabled();

    await user.click(
      screen.getByRole("button", {
        name: "Move the Today's progress card down",
      }),
    );

    expect(
      screen.getByText("Today's progress card moved from position 1 to 2."),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("region")
        .map((region) => region.getAttribute("aria-label")),
    ).toEqual(["Weekly routine", "Today's progress", "Upcoming"]);
  });

  it("offers an empty slot and fills it from the library", async () => {
    const user = userEvent.setup();
    seed({
      layout: [
        { id: "todayRing", size: "small" },
        { id: "upcoming", size: "wide" },
      ],
    });
    renderApp("/");

    await user.click(screen.getByRole("button", { name: "Edit dashboard" }));
    await user.click(screen.getByRole("button", { name: "Add a card" }));

    const library = screen.getByRole("complementary", { name: "Card library" });

    expect(
      within(library).getByRole("button", { name: "Add the Streaks card" }),
    ).toHaveTextContent("Add to slot");

    await user.click(
      within(library).getByRole("button", { name: "Add the Streaks card" }),
    );

    expect(
      screen
        .getAllByRole("region")
        .map((region) => region.getAttribute("aria-label")),
    ).toEqual(["Today's progress", "Streaks", "Upcoming"]);
    expect(screen.queryByRole("button", { name: "Add a card" })).toBeNull();
  });

  it("hides card links and item actions while editing", async () => {
    const user = userEvent.setup();
    seed();
    renderApp("/");

    await user.click(screen.getByRole("button", { name: "Edit dashboard" }));

    expect(within(card("Upcoming")).queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit dashboard" })).toBeNull();
  });

  it("shows an empty dashboard message without cards", () => {
    seed({ layout: [] });
    renderApp("/");

    expect(screen.getByText("No cards on the dashboard")).toBeInTheDocument();
  });
});
