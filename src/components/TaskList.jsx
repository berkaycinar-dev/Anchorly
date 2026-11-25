import { useLayoutEffect, useRef, useState, memo } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
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
import {
  Calendar,
  ClipboardList,
  Clock,
  Folder,
  ListChecks,
  Repeat,
  Star,
} from "lucide-react";
import Icon from "./Icon";
import useDragSensors, { SILENT_ANNOUNCEMENTS } from "../hooks/useDragSensors";
import { getCategoryLabel } from "../utils/categoryHelpers";
import { formatShortDate, getDaysFromToday } from "../utils/dateHelpers";

const DRAG_MODIFIERS = [restrictToVerticalAxis, restrictToParentElement];
function getOverdueDays(task, today) {
  if (task.completed || !task.date || !today || task.date >= today) {
    return 0;
  }

  return -getDaysFromToday(task.date, today);
}

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
  selectedTaskId = null,
  variant = "classic",
  projects = [],
  today = "",
  onToggleImportant,
  t,
}) {
  const isTodayVariant = variant === "today";
  const [isCompletedOpen, setIsCompletedOpen] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const pendingFocus = useRef(null);
  const containerRef = useRef(null);
  const sensors = useDragSensors();

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
        <span className="empty-state-icon" aria-hidden="true">
          <Icon icon={ClipboardList} size="xl" />
        </span>
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
    const selected = task.id === selectedTaskId ? " task-card-selected" : "";

    if (task.completed) {
      return `task-card completed-task${selected}`;
    }

    return sortable?.isDragging
      ? `task-card task-card-sortable task-card-dragging${selected}`
      : `task-card task-card-sortable${selected}`;
  }

  function renderTodayMeta(task) {
    const steps = task.steps ?? [];
    const doneSteps = steps.filter((step) => step.done).length;
    const overdueDays = getOverdueDays(task, today);
    const project = projects.find((item) => item.id === task.projectId);
    const items = [];

    if (steps.length > 0) {
      items.push(
        <span key="steps" className="task-meta-item">
          <Icon icon={ListChecks} size="sm" />
          <span className="visually-hidden">{t.stepsLabel}</span>
          {doneSteps}/{steps.length}
        </span>,
      );
    }

    if (task.dueTime) {
      items.push(
        <span key="time" className="task-meta-item task-meta-accent">
          <Icon icon={Clock} size="sm" />
          <span className="visually-hidden">{t.timeLabel}</span>
          {task.dueTime}
        </span>,
      );
    }

    if (overdueDays > 0) {
      items.push(
        <span key="overdue" className="task-meta-item task-meta-overdue">
          <Icon icon={Calendar} size="sm" />
          {t.overdueDaysLabel(overdueDays)}
        </span>,
      );
    } else if (task.date && task.date !== today) {
      items.push(
        <span key="date" className="task-meta-item">
          <Icon icon={Calendar} size="sm" />
          {formatShortDate(task.date, t.dateLocale)}
        </span>,
      );
    }

    if (task.repeat && task.repeat !== "none") {
      items.push(
        <span key="repeat" className="task-meta-item">
          <Icon icon={Repeat} size="sm" />
          {task.repeat === "daily" ? t.repeatDaily : t.repeatWeekly}
        </span>,
      );
    }

    if (project) {
      items.push(
        <span key="project" className="task-meta-item">
          <Icon icon={Folder} size="sm" />
          {project.name}
        </span>,
      );
    }

    return items.length > 0 ? <div className="task-meta">{items}</div> : null;
  }

  function renderClassicMeta(task) {
    return (
      <div className="task-meta">
        <span className="task-badge task-badge-category">
          {getCategoryLabel(task.category, t)}
        </span>

        {task.date && (
          <span className="task-badge task-badge-date">{task.date}</span>
        )}

        {task.dueTime && (
          <span className="task-badge task-badge-time">
            <span className="visually-hidden">{t.timeLabel}</span>
            {task.dueTime}
          </span>
        )}

        {task.repeat !== "none" && (
          <span
            className="task-badge task-badge-repeat"
            title={
              task.repeat === "daily" ? t.repeatDailyHint : t.repeatWeeklyHint
            }
          >
            🔁
          </span>
        )}
      </div>
    );
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
        aria-current={task.id === selectedTaskId ? "true" : undefined}
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

          {isTodayVariant ? renderTodayMeta(task) : renderClassicMeta(task)}
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

        {isTodayVariant && (
          <button
            type="button"
            className={
              task.important ? "task-star task-star-active" : "task-star"
            }
            data-focus="star"
            aria-pressed={task.important === true}
            aria-label={t.importantTaskLabel(task.title)}
            onClick={() => onToggleImportant(task.id)}
          >
            <Icon icon={Star} size="md" />
          </button>
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
    <div
      className={
        isTodayVariant
          ? "task-list-container task-list-today"
          : "task-list-container"
      }
      ref={containerRef}
    >
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
