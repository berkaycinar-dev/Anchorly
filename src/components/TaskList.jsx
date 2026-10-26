import { useLayoutEffect, useRef, useState, memo } from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { getCategoryLabel } from "../utils/categoryHelpers";

const DRAG_MODIFIERS = [restrictToVerticalAxis, restrictToParentElement];
const SILENT_ANNOUNCEMENTS = {
  onDragStart: () => undefined,
  onDragOver: () => undefined,
  onDragEnd: () => undefined,
  onDragCancel: () => undefined,
};

function SortableTaskItem({ id, children }) {
  const { setNodeRef, listeners, transform, transition, isDragging } =
    useSortable({ id });

  return children({
    ref: setNodeRef,
    listeners,
    isDragging,
    style: {
      transform: CSS.Translate.toString(transform),
      transition,
    },
  });
}

function TaskList({
  tasks,
  toggleTask,
  deleteTask,
  onSelectTask,
  onReorderTasks,
  t,
}) {
  const [isCompletedOpen, setIsCompletedOpen] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const pendingFocus = useRef(null);
  const containerRef = useRef(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  const activeTasks = tasks
    .filter((task) => !task.completed)
    .sort((a, b) => a.order - b.order);

  useLayoutEffect(() => {
    const pending = pendingFocus.current;

    if (!pending || !containerRef.current) {
      return;
    }

    pendingFocus.current = null;

    const card = containerRef.current.querySelector(
      `[data-task-id="${pending.taskId}"]`,
    );
    const target = card?.querySelector(`[data-focus="${pending.focus}"]`);
    const fallback = card?.querySelector(`[data-focus="${pending.fallback}"]`);

    if (target && !target.disabled) {
      target.focus();
    } else if (fallback) {
      fallback.focus();
    }
  });

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">📋</span>
        <p className="empty-state-title">{t.emptyTaskTitle}</p>
        <p className="empty-state-subtitle">{t.emptyTaskSubtitle}</p>
      </div>
    );
  }

  const completedTasks = tasks.filter((task) => task.completed);

  function moveTask(task, direction, focus) {
    const index = activeTasks.findIndex((item) => item.id === task.id);
    const neighbour = activeTasks[index + direction];

    if (!neighbour) {
      return;
    }

    pendingFocus.current = {
      taskId: task.id,
      focus,
      fallback: direction === 1 ? "up" : "down",
    };
    onReorderTasks(task.id, neighbour.id);
    setAnnouncement(
      t.taskMovedAnnouncement(
        task.title,
        index + direction + 1,
        activeTasks.length,
      ),
    );
  }

  function toggleWithFocus(task) {
    pendingFocus.current = {
      taskId: task.id,
      focus: "checkbox",
      fallback: "title",
    };
    toggleTask(task.id);
  }

  function deleteWithFocus(task) {
    const siblings = task.completed ? completedTasks : activeTasks;
    const index = siblings.findIndex((item) => item.id === task.id);
    const neighbour = siblings[index + 1] ?? siblings[index - 1];

    if (neighbour) {
      pendingFocus.current = {
        taskId: neighbour.id,
        focus: "title",
        fallback: "title",
      };
    }

    deleteTask(task.id);
  }

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) {
      return;
    }

    const task = activeTasks.find((item) => item.id === active.id);
    const targetIndex = activeTasks.findIndex((item) => item.id === over.id);

    onReorderTasks(active.id, over.id);
    setAnnouncement(
      t.taskMovedAnnouncement(task.title, targetIndex + 1, activeTasks.length),
    );
  }

  function handleKeyDown(event, task) {
    if (task.completed || !event.altKey) {
      return;
    }

    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
      return;
    }

    event.preventDefault();

    const focus = event.target.dataset.focus ?? "title";

    moveTask(task, event.key === "ArrowDown" ? 1 : -1, focus);
  }

  function getCardClassName(task, sortable) {
    if (task.completed) {
      return "task-card completed-task";
    }

    return sortable?.isDragging
      ? "task-card task-card-sortable task-card-dragging"
      : "task-card task-card-sortable";
  }

  function renderTaskCard(task, sortable) {
    const isDraggable = Boolean(sortable);
    const index = activeTasks.findIndex((item) => item.id === task.id);

    return (
      <li
        key={task.id}
        ref={sortable?.ref}
        style={sortable?.style}
        data-task-id={task.id}
        className={getCardClassName(task, sortable)}
        onKeyDown={(event) => handleKeyDown(event, task)}
        {...sortable?.listeners}
      >
        <input
          type="checkbox"
          className="task-checkbox"
          data-focus="checkbox"
          aria-label={t.completeTaskLabel(task.title)}
          checked={task.completed}
          onChange={() => toggleWithFocus(task)}
        />

        <div className="task-card-content">
          <button
            type="button"
            className="task-title"
            data-focus="title"
            onClick={() => onSelectTask(task.id)}
          >
            {task.title}
          </button>

          <div className="task-meta">
            <span className="task-badge task-badge-category">
              {getCategoryLabel(task.category, t)}
            </span>

            {task.date && (
              <span className="task-badge task-badge-date">{task.date}</span>
            )}

            {task.repeat !== "none" && (
              <span
                className="task-badge task-badge-repeat"
                title={
                  task.repeat === "daily"
                    ? t.repeatDailyHint
                    : t.repeatWeeklyHint
                }
              >
                🔁
              </span>
            )}
          </div>
        </div>

        {isDraggable && (
          <div className="task-move-controls">
            <button
              type="button"
              className="task-move-button"
              data-focus="up"
              aria-label={t.moveTaskUpLabel(task.title)}
              disabled={index === 0}
              onClick={() => moveTask(task, -1, "up")}
            >
              <span aria-hidden="true">▲</span>
            </button>
            <button
              type="button"
              className="task-move-button"
              data-focus="down"
              aria-label={t.moveTaskDownLabel(task.title)}
              disabled={index === activeTasks.length - 1}
              onClick={() => moveTask(task, 1, "down")}
            >
              <span aria-hidden="true">▼</span>
            </button>
          </div>
        )}

        <button
          type="button"
          className="task-delete-button"
          aria-label={t.deleteTaskLabel(task.title)}
          onClick={() => deleteWithFocus(task)}
        >
          <span aria-hidden="true">×</span>
        </button>
      </li>
    );
  }

  return (
    <div className="task-list-container" ref={containerRef}>
      <div className="visually-hidden" role="status">
        {announcement}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={DRAG_MODIFIERS}
        accessibility={{ announcements: SILENT_ANNOUNCEMENTS }}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={activeTasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="task-list">
            {activeTasks.map((task) => (
              <SortableTaskItem key={task.id} id={task.id}>
                {(sortable) => renderTaskCard(task, sortable)}
              </SortableTaskItem>
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {completedTasks.length > 0 && (
        <div className="completed-section">
          <button
            className="completed-toggle"
            onClick={() => setIsCompletedOpen(!isCompletedOpen)}
          >
            <span
              className={isCompletedOpen ? "chevron chevron-open" : "chevron"}
            >
              ▸
            </span>
            {t.completedSection} ({completedTasks.length})
          </button>

          {isCompletedOpen && (
            <ul className="task-list">
              {completedTasks.map((task) => renderTaskCard(task, null))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(TaskList);
