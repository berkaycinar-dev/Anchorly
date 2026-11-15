import { screen, within } from "@testing-library/react";
import { beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { renderApp } from "./test/renderApp";
import { getLocalDateString } from "./utils/dateHelpers";

function readTasks() {
  return JSON.parse(localStorage.getItem("tasks") ?? "[]");
}

describe("Today add task bar", () => {
  beforeEach(() => {
    localStorage.setItem("language", JSON.stringify("en"));
  });

  it("adds a task with time and shows it in the list", async () => {
    const user = userEvent.setup();
    renderApp("/today");

    await user.type(screen.getByRole("textbox", { name: "New task" }), "Call");
    await user.click(screen.getByRole("button", { name: "Time" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Hours" })).getByRole(
        "option",
        { name: "09" },
      ),
    );
    await user.click(
      within(screen.getByRole("listbox", { name: "Minutes" })).getByRole(
        "option",
        { name: "30" },
      ),
    );
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByRole("button", { name: "Call" })).toBeInTheDocument();
    expect(readTasks().find((task) => task.title === "Call")).toMatchObject({
      title: "Call",
      dueTime: "09:30",
    });
  });

  it("creates repeat occurrences for a repeating task", async () => {
    const user = userEvent.setup();
    renderApp("/today");

    await user.type(screen.getByRole("textbox", { name: "New task" }), "Gym");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Repeat" }),
      "daily",
    );
    await user.click(screen.getByRole("button", { name: "Add" }));

    const gyms = readTasks().filter((task) => task.title === "Gym");

    expect(gyms.length).toBeGreaterThan(1);
    expect(new Set(gyms.map((task) => task.repeatGroupId)).size).toBe(1);
  });

  it("toggles the important star", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "11111111-1111-4111-8111-111111111111",
          title: "Task 1",
          category: "Other",
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

    const star = screen.getByRole("button", { name: '"Task 1" is important' });
    await user.click(star);

    expect(star).toHaveAttribute("aria-pressed", "true");
    expect(readTasks()[0].important).toBe(true);
    expect(
      within(document.querySelector(".today-stats")).getByText("1"),
    ).toBeInTheDocument();
  });

  it("shows overdue tasks with an overdue chip", () => {
    localStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "22222222-2222-4222-8222-222222222222",
          title: "Old task",
          category: "Other",
          date: "2000-01-01",
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

    expect(
      screen.getByRole("button", { name: "Old task" }),
    ).toBeInTheDocument();
    expect(document.querySelector(".today-stat-overdue")).not.toBeNull();
  });
});
