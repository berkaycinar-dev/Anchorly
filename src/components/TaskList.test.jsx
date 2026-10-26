import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, it, expect, vi } from "vitest";
import TaskList from "./TaskList";
import { strings } from "../strings";
import {
  getMoveButton,
  getTaskCheckbox,
  getTaskItem,
  getTaskTitleButton,
} from "../test/queries";

const FIRST_ID = "11111111-1111-4111-8111-111111111111";
const SECOND_ID = "22222222-2222-4222-8222-222222222222";
const THIRD_ID = "33333333-3333-4333-8333-333333333333";

function createTask(id, title, order, overrides = {}) {
  return {
    id,
    title,
    category: "Work",
    date: "2026-10-10",
    completed: false,
    projectId: null,
    description: "",
    steps: [],
    completedAt: null,
    order,
    repeat: "none",
    repeatGroupId: null,
    attachments: [],
    ...overrides,
  };
}

function createThreeTasks() {
  return [
    createTask(FIRST_ID, "Task 1", 0),
    createTask(SECOND_ID, "Task 2", 1),
    createTask(THIRD_ID, "Task 3", 2),
  ];
}

function renderCards(tasks = createThreeTasks()) {
  const props = {
    tasks,
    toggleTask: vi.fn(),
    deleteTask: vi.fn(),
    onSelectTask: vi.fn(),
    onReorderTasks: vi.fn(),
    t: strings.en,
  };

  render(<TaskList {...props} />);

  return props;
}

function ReorderableList() {
  const [tasks, setTasks] = useState(createThreeTasks());

  function reorder(draggedId, targetId) {
    setTasks((current) => {
      const sorted = [...current].sort((a, b) => a.order - b.order);
      const from = sorted.findIndex((task) => task.id === draggedId);
      const to = sorted.findIndex((task) => task.id === targetId);
      const [moved] = sorted.splice(from, 1);

      sorted.splice(to, 0, moved);

      return sorted.map((task, index) => ({ ...task, order: index }));
    });
  }

  return (
    <TaskList
      tasks={tasks}
      toggleTask={vi.fn()}
      deleteTask={vi.fn()}
      onSelectTask={vi.fn()}
      onReorderTasks={reorder}
      t={strings.en}
    />
  );
}

function getRenderedTitles() {
  return screen.getAllByText(/^Task \d$/).map((element) => element.textContent);
}

const CARD_HEIGHT = 50;
const CARD_STEP = 60;
const TASK_IDS = [FIRST_ID, SECOND_ID, THIRD_ID];

function mockCardRects() {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function getRect() {
      const isList = this.classList?.contains("task-list");
      const index = TASK_IDS.indexOf(this.dataset?.taskId);
      const top = index === -1 ? 0 : index * CARD_STEP;
      const height = isList
        ? TASK_IDS.length * CARD_STEP
        : index === -1
          ? 0
          : CARD_HEIGHT;
      const width = isList || index !== -1 ? 300 : 0;

      return {
        x: 0,
        y: top,
        top,
        left: 0,
        right: width,
        bottom: top + height,
        width,
        height,
        toJSON() {},
      };
    },
  );
}

function getCardCenterY(index) {
  return index * CARD_STEP + CARD_HEIGHT / 2;
}

function wait(milliseconds) {
  return act(() => new Promise((resolve) => setTimeout(resolve, milliseconds)));
}

function waitForMeasuring() {
  return wait(20);
}

function waitForDragCleanup() {
  return wait(60);
}

async function startDrag(element, fromIndex) {
  const startY = getCardCenterY(fromIndex);

  fireEvent.mouseDown(element, { button: 0, clientX: 10, clientY: startY });
  fireEvent.mouseMove(document, { clientX: 10, clientY: startY + 10 });
  await waitForMeasuring();
}

async function finishDrag(toIndex) {
  const endY = getCardCenterY(toIndex);

  fireEvent.mouseMove(document, { clientX: 10, clientY: endY });
  await waitForMeasuring();
  fireEvent.mouseUp(document, { clientX: 10, clientY: endY });
}

function getAnnouncer() {
  return document.querySelector(
    '.task-list-container > .visually-hidden[role="status"]',
  );
}

describe("TaskList drag and drop", () => {
  afterEach(() => waitForDragCleanup());

  it("passes the dragged id and the target id when a card is dropped", async () => {
    mockCardRects();
    const props = renderCards();

    await startDrag(getTaskItem("Task 1"), 0);
    await finishDrag(2);

    expect(props.onReorderTasks).toHaveBeenCalledWith(FIRST_ID, THIRD_ID);
  });

  it("moves the card to its new place in the list", async () => {
    mockCardRects();
    render(<ReorderableList />);

    await startDrag(getTaskItem("Task 1"), 0);
    await finishDrag(2);

    expect(getRenderedTitles()).toEqual(["Task 2", "Task 3", "Task 1"]);
  });

  it("marks only the dragged card while dragging", async () => {
    mockCardRects();
    renderCards();

    await startDrag(getTaskItem("Task 1"), 0);

    expect(getTaskItem("Task 1")).toHaveClass("task-card-dragging");
    expect(getTaskItem("Task 2")).not.toHaveClass("task-card-dragging");

    await finishDrag(0);

    expect(getTaskItem("Task 1")).not.toHaveClass("task-card-dragging");
  });

  it("does not reorder when the card is dropped on itself", async () => {
    mockCardRects();
    const props = renderCards();

    await startDrag(getTaskItem("Task 2"), 1);
    await finishDrag(1);

    expect(props.onReorderTasks).not.toHaveBeenCalled();
  });

  it("does not start a drag on a small mouse movement", () => {
    mockCardRects();
    const props = renderCards();
    const card = getTaskItem("Task 1");

    fireEvent.mouseDown(card, { button: 0, clientX: 10, clientY: 25 });
    fireEvent.mouseMove(document, { clientX: 10, clientY: 29 });
    fireEvent.mouseUp(document, { clientX: 10, clientY: 29 });

    expect(card).not.toHaveClass("task-card-dragging");
    expect(props.onReorderTasks).not.toHaveBeenCalled();
  });

  it("does not open the task when a drag ends on its title", async () => {
    mockCardRects();
    const props = renderCards();

    await startDrag(getTaskTitleButton("Task 1"), 0);
    await finishDrag(2);
    fireEvent.click(getTaskTitleButton("Task 1"));

    expect(props.onSelectTask).not.toHaveBeenCalled();
  });

  it("announces the new position after a drag", async () => {
    mockCardRects();
    renderCards();

    await startDrag(getTaskItem("Task 1"), 0);
    await finishDrag(2);

    expect(getAnnouncer()).toHaveTextContent(
      "Task 1: moved to position 3 of 3",
    );
  });

  it("does not make completed tasks draggable", () => {
    renderCards([
      createTask(FIRST_ID, "Task 1", 0),
      createTask(SECOND_ID, "Task 2", 1, { completed: true }),
    ]);

    expect(getTaskItem("Task 1")).toHaveClass("task-card-sortable");
    expect(getTaskItem("Task 2")).not.toHaveClass("task-card-sortable");
  });
});

describe("TaskList card actions", () => {
  it("opens a task from its title button", async () => {
    const user = userEvent.setup();
    const props = renderCards();

    await user.click(getTaskTitleButton("Task 2"));

    expect(props.onSelectTask).toHaveBeenCalledWith(SECOND_ID);
  });

  it("uses a real button for the title", () => {
    renderCards();

    expect(getTaskTitleButton("Task 1")).toHaveAttribute("type", "button");
  });

  it("does not attach the open action to the card itself", async () => {
    const user = userEvent.setup();
    const props = renderCards();

    await user.click(getTaskItem("Task 1"));

    expect(props.onSelectTask).not.toHaveBeenCalled();
  });

  it("names the checkbox after the task and toggles without opening", async () => {
    const user = userEvent.setup();
    const props = renderCards();

    expect(
      screen.getByRole("checkbox", { name: 'Complete "Task 1"' }),
    ).toBeInTheDocument();

    await user.click(getTaskCheckbox("Task 1"));

    expect(props.toggleTask).toHaveBeenCalledWith(FIRST_ID);
    expect(props.onSelectTask).not.toHaveBeenCalled();
  });

  it("names the delete button after the task and deletes without opening", async () => {
    const user = userEvent.setup();
    const props = renderCards();

    await user.click(screen.getByRole("button", { name: 'Delete "Task 3"' }));

    expect(props.deleteTask).toHaveBeenCalledWith(THIRD_ID);
    expect(props.onSelectTask).not.toHaveBeenCalled();
  });
});

describe("TaskList move buttons", () => {
  it("offers move buttons for active tasks only", () => {
    renderCards([
      createTask(FIRST_ID, "Task 1", 0),
      createTask(SECOND_ID, "Task 2", 1),
      createTask(THIRD_ID, "Task 3", 2, { completed: true }),
    ]);

    expect(getMoveButton("Task 1", "down")).toBeInTheDocument();
    expect(getMoveButton("Task 2", "up")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Move "Task 3"/ }),
    ).not.toBeInTheDocument();
  });

  it("disables moving the first task up and the last task down", () => {
    renderCards();

    expect(getMoveButton("Task 1", "up")).toBeDisabled();
    expect(getMoveButton("Task 1", "down")).toBeEnabled();
    expect(getMoveButton("Task 2", "up")).toBeEnabled();
    expect(getMoveButton("Task 2", "down")).toBeEnabled();
    expect(getMoveButton("Task 3", "up")).toBeEnabled();
    expect(getMoveButton("Task 3", "down")).toBeDisabled();
  });

  it("moves a task down by swapping with the task below", async () => {
    const user = userEvent.setup();
    const props = renderCards();

    await user.click(getMoveButton("Task 1", "down"));

    expect(props.onReorderTasks).toHaveBeenCalledWith(FIRST_ID, SECOND_ID);
  });

  it("moves a task up by swapping with the task above", async () => {
    const user = userEvent.setup();
    const props = renderCards();

    await user.click(getMoveButton("Task 3", "up"));

    expect(props.onReorderTasks).toHaveBeenCalledWith(THIRD_ID, SECOND_ID);
  });

  it("does not open the task when a move button is pressed", async () => {
    const user = userEvent.setup();
    const props = renderCards();

    await user.click(getMoveButton("Task 2", "down"));

    expect(props.onSelectTask).not.toHaveBeenCalled();
  });
});

describe("TaskList Alt+Arrow shortcuts", () => {
  it("moves the task down with Alt+ArrowDown and prevents the default", () => {
    const props = renderCards();

    const wasNotPrevented = fireEvent.keyDown(getTaskTitleButton("Task 1"), {
      key: "ArrowDown",
      altKey: true,
    });

    expect(wasNotPrevented).toBe(false);
    expect(props.onReorderTasks).toHaveBeenCalledWith(FIRST_ID, SECOND_ID);
  });

  it("moves the task up with Alt+ArrowUp", () => {
    const props = renderCards();

    fireEvent.keyDown(getTaskTitleButton("Task 3"), {
      key: "ArrowUp",
      altKey: true,
    });

    expect(props.onReorderTasks).toHaveBeenCalledWith(THIRD_ID, SECOND_ID);
  });

  it("works from any element inside the card", () => {
    const props = renderCards();

    fireEvent.keyDown(getTaskCheckbox("Task 2"), {
      key: "ArrowDown",
      altKey: true,
    });

    expect(props.onReorderTasks).toHaveBeenCalledWith(SECOND_ID, THIRD_ID);
  });

  it("does nothing at the edges of the list", () => {
    const props = renderCards();

    fireEvent.keyDown(getTaskTitleButton("Task 1"), {
      key: "ArrowUp",
      altKey: true,
    });
    fireEvent.keyDown(getTaskTitleButton("Task 3"), {
      key: "ArrowDown",
      altKey: true,
    });

    expect(props.onReorderTasks).not.toHaveBeenCalled();
  });

  it("ignores the arrow keys without Alt", () => {
    const props = renderCards();

    const wasNotPrevented = fireEvent.keyDown(getTaskTitleButton("Task 1"), {
      key: "ArrowDown",
    });

    expect(wasNotPrevented).toBe(true);
    expect(props.onReorderTasks).not.toHaveBeenCalled();
  });

  it("ignores completed tasks", () => {
    const props = renderCards([
      createTask(FIRST_ID, "Task 1", 0),
      createTask(SECOND_ID, "Task 2", 1, { completed: true }),
    ]);

    fireEvent.keyDown(getTaskTitleButton("Task 2"), {
      key: "ArrowUp",
      altKey: true,
    });
    fireEvent.keyDown(getTaskTitleButton("Task 2"), {
      key: "ArrowDown",
      altKey: true,
    });

    expect(props.onReorderTasks).not.toHaveBeenCalled();
  });
});

describe("TaskList announcements", () => {
  it("starts with an empty live region", () => {
    renderCards();

    expect(getAnnouncer()).toBeEmptyDOMElement();
  });

  it("announces the new position after moving down", async () => {
    const user = userEvent.setup();
    renderCards();

    await user.click(getMoveButton("Task 1", "down"));

    expect(getAnnouncer()).toHaveTextContent(
      "Task 1: moved to position 2 of 3",
    );
  });

  it("announces the new position after moving up with the keyboard", () => {
    renderCards();

    fireEvent.keyDown(getTaskTitleButton("Task 3"), {
      key: "ArrowUp",
      altKey: true,
    });

    expect(getAnnouncer()).toHaveTextContent(
      "Task 3: moved to position 2 of 3",
    );
  });
});

describe("TaskList focus after reordering", () => {
  it("keeps focus on the pressed move button", async () => {
    const user = userEvent.setup();
    render(<ReorderableList />);

    await user.click(getMoveButton("Task 1", "down"));

    expect(getRenderedTitles()).toEqual(["Task 2", "Task 1", "Task 3"]);
    expect(getMoveButton("Task 1", "down")).toHaveFocus();
  });

  it("moves focus to the other button when the task reaches the end", async () => {
    const user = userEvent.setup();
    render(<ReorderableList />);

    await user.click(getMoveButton("Task 1", "down"));
    await user.click(getMoveButton("Task 1", "down"));

    expect(getRenderedTitles()).toEqual(["Task 2", "Task 3", "Task 1"]);
    expect(getMoveButton("Task 1", "down")).toBeDisabled();
    expect(getMoveButton("Task 1", "up")).toHaveFocus();
  });

  it("keeps focus on the title button after Alt+ArrowDown", () => {
    render(<ReorderableList />);

    focusElement(getTaskTitleButton("Task 1"));
    fireEvent.keyDown(getTaskTitleButton("Task 1"), {
      key: "ArrowDown",
      altKey: true,
    });

    expect(getRenderedTitles()).toEqual(["Task 2", "Task 1", "Task 3"]);
    expect(getTaskTitleButton("Task 1")).toHaveFocus();
  });
});

function focusElement(element) {
  element.focus();
}
