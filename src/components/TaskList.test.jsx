import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TaskList from "./TaskList";
import { strings } from "../strings";

const FIRST_ID = "11111111-1111-4111-8111-111111111111";
const SECOND_ID = "22222222-2222-4222-8222-222222222222";

function createTask(id, title, order) {
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
  };
}

function renderTaskList(onReorderTasks = vi.fn()) {
  render(
    <TaskList
      tasks={[
        createTask(FIRST_ID, "Task 1", 0),
        createTask(SECOND_ID, "Task 2", 1),
      ]}
      toggleTask={vi.fn()}
      deleteTask={vi.fn()}
      onSelectTask={vi.fn()}
      onReorderTasks={onReorderTasks}
      t={strings.en}
    />,
  );

  return {
    firstCard: screen.getByText("Task 1").closest("li"),
    secondCard: screen.getByText("Task 2").closest("li"),
  };
}

describe("TaskList drag and drop", () => {
  it("stores the dragged task id in the drag data", () => {
    const { firstCard } = renderTaskList();
    const dataTransfer = { setData: vi.fn() };

    fireEvent.dragStart(firstCard, { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", FIRST_ID);
  });

  it("marks only the dragged card while dragging", () => {
    const { firstCard, secondCard } = renderTaskList();

    fireEvent.dragStart(firstCard, { dataTransfer: { setData: vi.fn() } });

    expect(firstCard).toHaveClass("task-card-dragging");
    expect(secondCard).not.toHaveClass("task-card-dragging");

    fireEvent.dragEnd(firstCard);

    expect(firstCard).not.toHaveClass("task-card-dragging");
  });

  it("passes the dragged id and the target id when a card is dropped", () => {
    const onReorderTasks = vi.fn();
    const { secondCard } = renderTaskList(onReorderTasks);

    fireEvent.drop(secondCard, {
      dataTransfer: { getData: () => FIRST_ID },
    });

    expect(onReorderTasks).toHaveBeenCalledWith(FIRST_ID, SECOND_ID);
  });
});
