import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, it, expect } from "vitest";
import { renderApp, getCurrentPath } from "./test/renderApp";
import { getSidebarBadge } from "./test/queries";
import { getLocalDateString } from "./utils/dateHelpers";

const PROJECT_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_PROJECT_ID = "44444444-4444-4444-8444-444444444444";
const today = getLocalDateString();

function createStoredTask(id, title, overrides = {}) {
  return {
    id,
    title,
    category: "Work",
    date: "",
    completed: false,
    projectId: PROJECT_ID,
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

function seed(tasks, projects) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem(
    "projects",
    JSON.stringify(
      projects ?? [
        { id: PROJECT_ID, name: "Project 1", dueDate: "2099-01-10" },
        { id: OTHER_PROJECT_ID, name: "Project 2" },
      ],
    ),
  );
}

function getColumn(name) {
  return screen.getByRole("region", { name });
}

beforeEach(() => {
  localStorage.setItem("language", JSON.stringify("en"));
});

describe("App projects board", () => {
  it("sorts tasks into the to do, in progress and done columns", () => {
    seed([
      createStoredTask("11111111-1111-4111-8111-111111111111", "Plain task"),
      createStoredTask("11111111-1111-4111-8111-111111111112", "Started task", {
        steps: [
          { id: "s1", text: "One", done: true },
          { id: "s2", text: "Two", done: false },
        ],
      }),
      createStoredTask(
        "11111111-1111-4111-8111-111111111113",
        "Finished task",
        {
          completed: true,
          completedAt: today,
        },
      ),
    ]);
    renderApp(`/projects/${PROJECT_ID}`);

    expect(
      within(getColumn("To do")).getByRole("button", { name: /Plain task/ }),
    ).toBeInTheDocument();
    expect(
      within(getColumn("In progress")).getByRole("button", {
        name: /Started task/,
      }),
    ).toBeInTheDocument();
    expect(
      within(getColumn("Done")).getByRole("button", {
        name: /Finished task/,
      }),
    ).toBeInTheDocument();
  });

  it("shows step progress on a card", () => {
    seed([
      createStoredTask("11111111-1111-4111-8111-111111111112", "Started task", {
        steps: [
          { id: "s1", text: "One", done: true },
          { id: "s2", text: "Two", done: false },
          { id: "s3", text: "Three", done: false },
        ],
      }),
    ]);
    renderApp(`/projects/${PROJECT_ID}`);

    expect(
      screen.getByRole("progressbar", { name: "1 of 3 steps completed" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1/3 steps")).toBeInTheDocument();
  });

  it("marks a task due today with a Today chip", () => {
    seed([
      createStoredTask("11111111-1111-4111-8111-111111111111", "Due task", {
        date: today,
      }),
    ]);
    renderApp(`/projects/${PROJECT_ID}`);

    expect(
      within(screen.getByRole("button", { name: /Due task/ })).getByText(
        "Today",
      ),
    ).toBeInTheDocument();
  });

  it("shows the short date instead of Today on a completed task", () => {
    seed([
      createStoredTask("11111111-1111-4111-8111-111111111111", "Done task", {
        date: today,
        completed: true,
        completedAt: today,
      }),
    ]);
    renderApp(`/projects/${PROJECT_ID}`);

    expect(
      within(screen.getByRole("button", { name: /Done task/ })).queryByText(
        "Today",
      ),
    ).not.toBeInTheDocument();
  });

  it("shows three done tasks and reveals the rest on demand", async () => {
    const user = userEvent.setup();
    seed(
      Array.from({ length: 5 }, (_, index) =>
        createStoredTask(
          `11111111-1111-4111-8111-11111111111${index}`,
          `Done ${index}`,
          { completed: true, completedAt: today, order: index },
        ),
      ),
    );
    renderApp(`/projects/${PROJECT_ID}`);

    expect(within(getColumn("Done")).getAllByRole("button")).toHaveLength(4);

    await user.click(screen.getByRole("button", { name: "+2 more tasks" }));

    expect(within(getColumn("Done")).getAllByRole("button")).toHaveLength(5);
  });

  it("opens the task detail when a card is clicked", async () => {
    const user = userEvent.setup();
    seed([
      createStoredTask("11111111-1111-4111-8111-111111111111", "Plain task"),
    ]);
    renderApp(`/projects/${PROJECT_ID}`);

    await user.click(screen.getByRole("button", { name: /Plain task/ }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows only the tasks of the chosen category", async () => {
    const user = userEvent.setup();
    seed([
      createStoredTask("11111111-1111-4111-8111-111111111111", "Work task"),
      createStoredTask("11111111-1111-4111-8111-111111111112", "Health task", {
        category: "Health",
      }),
    ]);
    renderApp(`/projects/${PROJECT_ID}`);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Category filter" }),
      "Health",
    );

    expect(
      screen.queryByRole("button", { name: /Work task/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Health task/ }),
    ).toBeInTheDocument();
  });

  it("shows the list view with the existing task list", async () => {
    const user = userEvent.setup();
    seed([
      createStoredTask("11111111-1111-4111-8111-111111111111", "Plain task"),
    ]);
    renderApp(`/projects/${PROJECT_ID}`);

    await user.click(screen.getByRole("button", { name: "List" }));

    expect(
      screen.queryByRole("group", { name: "Project board" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Plain task")).toBeInTheDocument();
  });

  it("has no add card button in any column", () => {
    seed([]);
    renderApp(`/projects/${PROJECT_ID}`);

    expect(
      screen.queryByRole("button", { name: "Add card" }),
    ).not.toBeInTheDocument();
  });

  it("adds a task to the project from the add task button", async () => {
    const user = userEvent.setup();
    seed([]);
    renderApp(`/projects/${PROJECT_ID}`);

    await user.click(screen.getByRole("button", { name: "Add task" }));
    await user.type(
      screen.getByRole("textbox", { name: "New project task" }),
      "Brand new{Enter}",
    );

    expect(
      within(getColumn("To do")).getByRole("button", { name: /Brand new/ }),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("tasks"))[0].projectId).toBe(
      PROJECT_ID,
    );
  });

  it("shows a task with the stored in progress status in the middle column", () => {
    seed([
      createStoredTask("11111111-1111-4111-8111-111111111111", "Moved task", {
        boardStatus: "doing",
      }),
    ]);
    renderApp(`/projects/${PROJECT_ID}`);

    expect(
      within(getColumn("In progress")).getByRole("button", {
        name: /Moved task/,
      }),
    ).toBeInTheDocument();
  });

  it("describes how to move a card for screen reader users", () => {
    seed([
      createStoredTask("11111111-1111-4111-8111-111111111111", "Plain task"),
    ]);
    renderApp(`/projects/${PROJECT_ID}`);

    const card = screen.getByRole("button", { name: /Plain task/ });
    const instructions = document.getElementById(
      card.getAttribute("aria-describedby"),
    );

    expect(instructions).toHaveTextContent(/Press space to pick up a task/);
  });
});

describe("App projects header", () => {
  it("shows the completed and total task counts", () => {
    seed([
      createStoredTask("11111111-1111-4111-8111-111111111111", "A", {
        completed: true,
        completedAt: today,
      }),
      createStoredTask("11111111-1111-4111-8111-111111111112", "B"),
    ]);
    renderApp(`/projects/${PROJECT_ID}`);

    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "1 of 2 tasks completed" }),
    ).toBeInTheDocument();
  });

  it("shows the due date and the days left", () => {
    seed([]);
    renderApp(`/projects/${PROJECT_ID}`);

    expect(
      screen.getByText(/^Due January 10 · \d+ days left$/),
    ).toBeInTheDocument();
  });

  it("says when the project has no due date", () => {
    seed([]);
    renderApp(`/projects/${OTHER_PROJECT_ID}`);

    expect(screen.getByText("No due date")).toBeInTheDocument();
  });
});

describe("App projects list panel", () => {
  it("shows the open task count of each project", () => {
    seed([
      createStoredTask("11111111-1111-4111-8111-111111111111", "A"),
      createStoredTask("11111111-1111-4111-8111-111111111112", "B", {
        completed: true,
        completedAt: today,
      }),
    ]);
    renderApp("/projects");

    const link = screen.getByRole("link", { name: /^Project 1/ });

    expect(within(link).getByLabelText("1 open task")).toBeInTheDocument();
  });

  it("marks the open project as the current one", () => {
    seed([]);
    renderApp(`/projects/${PROJECT_ID}`);

    expect(screen.getByRole("link", { name: /^Project 1/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: /^Project 2/ }),
    ).not.toHaveAttribute("aria-current");
  });

  it("asks for a project when none is open", () => {
    seed([]);
    renderApp("/projects");

    expect(screen.getByText("Select a project")).toBeInTheDocument();
  });

  it("creates a project with a due date from the plus button", async () => {
    const user = userEvent.setup();
    seed([]);
    renderApp("/projects");

    await user.click(
      screen.getByRole("button", { name: "Create a new project" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "New project" }),
      "Fresh project",
    );
    await user.type(screen.getByLabelText("Due date"), "2099-02-03");
    await user.click(screen.getByRole("button", { name: "Add Project" }));

    const stored = JSON.parse(localStorage.getItem("projects"));

    expect(stored[2]).toEqual({
      id: expect.any(String),
      name: "Fresh project",
      dueDate: "2099-02-03",
    });
    expect(
      screen.queryByRole("textbox", { name: "New project" }),
    ).not.toBeInTheDocument();
  });

  it("creates a project without a due date field in storage when none is chosen", async () => {
    const user = userEvent.setup();
    seed([]);
    renderApp("/projects");

    await user.click(
      screen.getByRole("button", { name: "Create a new project" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "New project" }),
      "Plain project{Enter}",
    );

    const stored = JSON.parse(localStorage.getItem("projects"));

    expect(stored[2]).toEqual({
      id: expect.any(String),
      name: "Plain project",
    });
  });

  it("keeps the form open when the name is empty", async () => {
    const user = userEvent.setup();
    seed([]);
    renderApp("/projects");

    await user.click(
      screen.getByRole("button", { name: "Create a new project" }),
    );
    await user.click(screen.getByRole("button", { name: "Add Project" }));

    expect(
      screen.getByRole("textbox", { name: "New project" }),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("projects"))).toHaveLength(2);
  });
});

describe("App archiving a project", () => {
  it("moves the project to the archived section and back", async () => {
    const user = userEvent.setup();
    seed([]);
    renderApp(`/projects/${PROJECT_ID}`);

    await user.click(
      screen.getByRole("button", { name: "Archive project Project 1" }),
    );

    const archivedSection = screen
      .getByRole("heading", { name: "Archived" })
      .closest(".project-section");

    expect(
      within(archivedSection).getByRole("link", { name: /^Project 1/ }),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("projects"))[0].archived).toBe(true);

    await user.click(
      screen.getByRole("button", { name: "Unarchive project Project 1" }),
    );

    expect(
      screen.queryByRole("heading", { name: "Archived" }),
    ).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("projects"))[0].archived).toBe(
      false,
    );
  });

  it("does not count an archived project in the sidebar badge", () => {
    seed(
      [],
      [
        { id: PROJECT_ID, name: "Project 1", archived: true },
        { id: OTHER_PROJECT_ID, name: "Project 2" },
      ],
    );
    renderApp("/projects");

    expect(getSidebarBadge(/^Projects/)).toHaveTextContent("1");
  });
});

describe("App deleting a project from its page", () => {
  it("returns to the project list and removes the project", async () => {
    const user = userEvent.setup();
    seed([]);
    renderApp(`/projects/${PROJECT_ID}`);

    await user.click(
      screen.getByRole("button", { name: "Delete project Project 1" }),
    );

    expect(getCurrentPath()).toBe("/projects");
    expect(
      screen.queryByRole("link", { name: /^Project 1/ }),
    ).not.toBeInTheDocument();
  });
});
