import { useLayoutEffect, useRef, useState, memo } from "react";
import { getCategoryLabel } from "../utils/categoryHelpers";

function TaskList({
  tasks,
  toggleTask,
  deleteTask,
  onSelectTask,
  onReorderTasks,
  t,
}) {
  const [isCompletedOpen, setIsCompletedOpen] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const pendingFocus = useRef(null);
  const containerRef = useRef(null);

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

  function renderTaskCard(task, isDraggable) {
    const index = activeTasks.findIndex((item) => item.id === task.id);

    return (
      <li
        key={task.id}
        data-task-id={task.id}
        className={
          task.completed
            ? "task-card completed-task"
            : draggedTaskId === task.id
              ? "task-card task-card-dragging"
              : "task-card"
        }
        draggable={isDraggable}
        onKeyDown={(event) => handleKeyDown(event, task)}
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", task.id);
          setDraggedTaskId(task.id);
        }}
        onDragEnd={() => setDraggedTaskId(null)}
        onDragOver={(event) => {
          if (isDraggable) {
            event.preventDefault();
          }
        }}
        onDrop={(event) => {
          if (!isDraggable) {
            return;
          }
          event.preventDefault();
          const draggedId = event.dataTransfer.getData("text/plain");
          onReorderTasks(draggedId, task.id);
        }}
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

      <ul className="task-list">
        {activeTasks.map((task) => renderTaskCard(task, true))}
      </ul>

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
              {completedTasks.map((task) => renderTaskCard(task, false))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(TaskList);