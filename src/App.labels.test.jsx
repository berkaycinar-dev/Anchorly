import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { renderApp } from "./test/renderApp";
import { getLocalDateString } from "./utils/dateHelpers";

const TASK_ID = "11111111-1111-4111-8111-111111111111";

function createTask(overrides = {}) {
  return {
    id: TASK_ID,
    title: "Task 1",
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

function seed(language, tasks) {
  localStorage.setItem("language", JSON.stringify(language));
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

async function openDialog(user, overrides) {
  seed("en", [createTask(overrides)]);
  renderApp("/today");

  await user.click(screen.getByRole("button", { name: "Task 1" }));

  return screen.getByRole("dialog", { name: "Task 1" });
}

describe("Today page labels", () => {
  it("labels the search box", () => {
    seed("en", [createTask()]);
    renderApp("/today");

    expect(
      screen.getByRole("textbox", { name: "Search tasks" }),
    ).toBeInTheDocument();
  });

  it("labels the add task form controls", () => {
    seed("en", [createTask()]);
    renderApp("/today");

    expect(
      screen.getByRole("textbox", { name: "New task" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Category" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Date")).toHaveAttribute("type", "date");
  });

  it("labels the search box and form in Turkish", () => {
    seed("tr", [createTask()]);
    renderApp("/today");

    expect(
      screen.getByRole("textbox", { name: "Görev ara" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Yeni görev" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Kategori" }),
    ).toBeInTheDocument();
  });
});

describe("task category badge", () => {
  it("shows the category in Turkish", () => {
    seed("tr", [createTask({ category: "Self Development" })]);
    renderApp("/today");

    const card = screen.getByRole("button", { name: "Task 1" }).closest("li");

    expect(within(card).getByText("Kişisel Gelişim")).toBeInTheDocument();
    expect(within(card).queryByText("Self Development")).toBeNull();
  });

  it("translates the stored Health category", () => {
    seed("tr", [createTask({ category: "Health" })]);
    renderApp("/today");

    expect(screen.getByText("Sağlık")).toBeInTheDocument();
  });

  it("shows the category in English", () => {
    seed("en", [createTask({ category: "Personal" })]);
    renderApp("/today");

    const card = screen.getByRole("button", { name: "Task 1" }).closest("li");

    expect(within(card).getByText("Personal")).toBeInTheDocument();
  });
});

describe("task detail dialog labels", () => {
  it("labels the task checkbox in the header", async () => {
    const user = userEvent.setup();
    const dialog = await openDialog(user);

    expect(
      within(dialog).getByRole("checkbox", { name: 'Complete "Task 1"' }),
    ).toBeInTheDocument();
  });

  it("connects every field to its visible label", async () => {
    const user = userEvent.setup();
    const dialog = await openDialog(user);

    expect(
      within(dialog).getByRole("textbox", { name: "Description" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Date")).toHaveAttribute(
      "type",
      "date",
    );
    expect(
      within(dialog).getByRole("combobox", { name: "Repeat" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Attachments")).toHaveAttribute(
      "type",
      "file",
    );
    expect(
      within(dialog).getByRole("combobox", { name: "Project" }),
    ).toBeInTheDocument();
  });

  it("gives the new step input its own name", async () => {
    const user = userEvent.setup();
    const dialog = await openDialog(user);

    expect(
      within(dialog).getByRole("textbox", { name: "New step" }),
    ).toBeInTheDocument();
  });

  it("names the step checkbox and delete button after the step", async () => {
    const user = userEvent.setup();
    const dialog = await openDialog(user, {
      steps: [{ id: "step-1", text: "Buy milk", done: false }],
    });

    expect(
      within(dialog).getByRole("checkbox", {
        name: 'Complete step "Buy milk"',
      }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: 'Delete step "Buy milk"' }),
    ).toBeInTheDocument();
  });

  it("names the attachment delete button after the file", async () => {
    const user = userEvent.setup();
    const dialog = await openDialog(user, {
      attachments: [
        {
          id: "attachment-1",
          name: "note.txt",
          type: "text/plain",
          data: "data:text/plain;base64,aGk=",
        },
      ],
    });

    expect(
      within(dialog).getByRole("button", {
        name: 'Delete attachment "note.txt"',
      }),
    ).toBeInTheDocument();
  });

  it("uses Turkish labels when the language is Turkish", async () => {
    const user = userEvent.setup();

    seed("tr", [createTask()]);
    renderApp("/today");

    await user.click(screen.getByRole("button", { name: "Task 1" }));

    const dialog = screen.getByRole("dialog", { name: "Task 1" });

    expect(
      within(dialog).getByRole("textbox", { name: "Açıklama" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("textbox", { name: "Yeni adım" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Dosyalar")).toHaveAttribute(
      "type",
      "file",
    );
  });
});

describe("calendar quick add", () => {
  it("labels the quick add title input", async () => {
    const user = userEvent.setup();

    seed("en", [createTask()]);
    renderApp("/calendar");

    await user.click(
      screen.getAllByRole("button", { name: "Add task to this day" })[0],
    );

    expect(
      screen.getByRole("textbox", { name: "Task title" }),
    ).toBeInTheDocument();
  });
});

describe("weekly productivity chart", () => {
  function getBars() {
    return screen.getAllByRole("img", { name: /routines done/ });
  }

  it("exposes one focusable bar per day with a text alternative", () => {
    seed("en", [createTask()]);
    renderApp("/");

    const bars = getBars();

    expect(bars).toHaveLength(7);

    bars.forEach((bar) => {
      expect(bar).toHaveAttribute("tabindex", "0");
      expect(bar).toHaveAccessibleName(
        /^\w+ [\w ]+: \d+ of \d+ routines done, \d+%$/,
      );
    });
  });

  it("describes each bar in Turkish", () => {
    seed("tr", [createTask()]);
    renderApp("/");

    const bars = screen.getAllByRole("img", { name: /rutinden/ });

    expect(bars).toHaveLength(7);
    expect(bars[0]).toHaveAccessibleName(/rutinden \d+ tamamlandı, %\d+$/);
  });

  it("shows the tooltip while a bar has keyboard focus", () => {
    seed("en", [createTask()]);
    renderApp("/");

    const [firstBar] = getBars();

    expect(within(firstBar).queryByText(/routines$/)).toBeNull();

    fireEvent.focus(firstBar);

    expect(within(firstBar).getByText(/routines$/)).toBeInTheDocument();

    fireEvent.blur(firstBar);

    expect(within(firstBar).queryByText(/routines$/)).toBeNull();
  });
});
