import { screen, within } from "@testing-library/react";
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

const DETAIL_SURFACES = {
  panel: {
    async open(user, language) {
      renderApp("/today");

      await user.click(screen.getByRole("button", { name: "Task 1" }));

      return screen.getByRole("complementary", {
        name: language === "tr" ? "Görev ayrıntıları" : "Task details",
      });
    },
  },
  dialog: {
    async open(user) {
      renderApp("/calendar");

      await user.click(
        within(document.querySelector(".calendar-panel")).getByRole("button", {
          name: "Task 1",
        }),
      );

      return screen.getByRole("dialog", { name: "Task 1" });
    },
  },
};

async function openDetail(surface, user, overrides, language = "en") {
  seed(language, [createTask(overrides)]);

  return DETAIL_SURFACES[surface].open(user, language);
}

describe("Today page labels", () => {
  it("labels the add task bar controls", () => {
    seed("en", [createTask()]);
    renderApp("/today");

    expect(
      screen.getByRole("textbox", { name: "New task" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
    expect(screen.getByLabelText("Date")).toHaveAttribute("type", "date");
    expect(screen.getByRole("button", { name: "Time" })).toHaveAttribute(
      "aria-haspopup",
      "true",
    );
    expect(
      screen.getByRole("combobox", { name: "Repeat" }),
    ).toBeInTheDocument();
  });

  it("labels the add task bar controls in Turkish", () => {
    seed("tr", [createTask()]);
    renderApp("/today");

    expect(
      screen.getByRole("textbox", { name: "Yeni görev" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saat" })).toHaveAttribute(
      "aria-haspopup",
      "true",
    );
    expect(
      screen.getByRole("combobox", { name: "Tekrar" }),
    ).toBeInTheDocument();
  });

  it("names the important star after the task", () => {
    seed("en", [createTask()]);
    renderApp("/today");

    expect(
      screen.getByRole("button", { name: '"Task 1" is important' }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});

describe.each(["panel", "dialog"])("task detail %s labels", (surface) => {
  it("labels the task checkbox in the header", async () => {
    const user = userEvent.setup();
    const dialog = await openDetail(surface, user);

    expect(
      within(dialog).getByRole("checkbox", { name: 'Complete "Task 1"' }),
    ).toBeInTheDocument();
  });

  it("connects every field to its visible label", async () => {
    const user = userEvent.setup();
    const dialog = await openDetail(surface, user);

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
    if (surface === "dialog") {
      expect(within(dialog).getByLabelText("Attachments")).toHaveAttribute(
        "type",
        "file",
      );
    } else {
      expect(within(dialog).getByLabelText("Time")).toHaveAttribute(
        "aria-haspopup",
        "true",
      );
    }
    expect(
      within(dialog).getByRole("combobox", { name: "Project" }),
    ).toBeInTheDocument();
  });

  it("gives the new step input its own name", async () => {
    const user = userEvent.setup();
    const dialog = await openDetail(surface, user);

    expect(
      within(dialog).getByRole("textbox", { name: "New step" }),
    ).toBeInTheDocument();
  });

  it("names the step checkbox and delete button after the step", async () => {
    const user = userEvent.setup();
    const dialog = await openDetail(surface, user, {
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

  it.runIf(surface === "dialog")(
    "names the attachment delete button after the file",
    async () => {
      const user = userEvent.setup();
      const dialog = await openDetail(surface, user, {
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
    },
  );

  it("uses Turkish labels when the language is Turkish", async () => {
    const user = userEvent.setup();

    const dialog = await openDetail(surface, user, {}, "tr");

    expect(
      within(dialog).getByRole("textbox", { name: "Açıklama" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("textbox", { name: "Yeni adım" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("combobox", { name: "Proje" }),
    ).toBeInTheDocument();
  });
});

describe("calendar day panel", () => {
  it("labels the add task input of the selected day", () => {
    seed("en", [createTask()]);
    renderApp("/calendar");

    const panel = document.querySelector(".calendar-panel");

    expect(
      within(panel).getByRole("textbox", { name: "Add task to this day" }),
    ).toBeInTheDocument();
  });

  it("labels the task checkboxes and the progress bar", () => {
    seed("en", [createTask()]);
    renderApp("/calendar");

    const panel = document.querySelector(".calendar-panel");

    expect(
      within(panel).getByRole("checkbox", { name: 'Complete "Task 1"' }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole("progressbar", {
        name: "0 of 1 tasks completed",
      }),
    ).toBeInTheDocument();
  });
});

describe("weekly productivity chart", () => {
  function getBars() {
    return screen.getAllByRole("button", { name: /routines done/ });
  }

  it("exposes one focusable bar per day with a text alternative", () => {
    seed("en", [createTask()]);
    renderApp("/");

    const bars = getBars();

    expect(bars).toHaveLength(7);

    bars.forEach((bar) => {
      expect(bar).toHaveAccessibleName(
        /^\w+ [\w ]+: \d+ of \d+ routines done, \d+%$/,
      );
    });
  });

  it("describes each bar in Turkish", () => {
    seed("tr", [createTask()]);
    renderApp("/");

    const bars = screen.getAllByRole("button", { name: /rutinden/ });

    expect(bars).toHaveLength(7);
    expect(bars[0]).toHaveAccessibleName(/rutinden \d+ tamamlandı, %\d+$/);
  });

  it("gives every bar a decorative tooltip with the percent and routines", () => {
    seed("en", [createTask()]);
    renderApp("/");

    const [firstBar] = getBars();
    const tooltip = firstBar.querySelector(".dashboard-tooltip");

    expect(tooltip).toHaveAttribute("aria-hidden", "true");
    expect(tooltip).toHaveTextContent(/\d+% done/);
    expect(tooltip).toHaveTextContent(/\d+ \/ \d+ routines done/);
  });
});
