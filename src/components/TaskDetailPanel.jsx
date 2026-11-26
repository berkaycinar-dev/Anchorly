import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import Icon from "./Icon";
import ConfirmDeleteDialog from "./taskDetail/ConfirmDeleteDialog";
import {
  TaskDetailFooter,
  TaskFieldsSection,
  TaskNoteSection,
  TaskStarButton,
  TaskStepsSection,
} from "./taskDetail/TaskDetailParts";

function TaskDetailPanelBody({
  task,
  onClose,
  onToggleTask,
  onUpdateTitle,
  onDeleteTask,
  t,
  ...handlers
}) {
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    panelRef.current.focus({ preventScroll: true });
  }, []);

  function saveTitle() {
    const trimmedTitle = titleDraft.trim();

    if (trimmedTitle === "") {
      setTitleDraft(task.title);
      return;
    }

    setTitleDraft(trimmedTitle);

    if (trimmedTitle !== task.title) {
      onUpdateTitle(task.id, trimmedTitle);
    }
  }

  function handleTitleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Escape" && titleDraft !== task.title) {
      event.stopPropagation();
      setTitleDraft(task.title);
    }
  }

  function handlePanelKeyDown(event) {
    if (event.key !== "Escape" || event.defaultPrevented) {
      return;
    }

    if (event.target.closest("dialog") || event.target.tagName === "SELECT") {
      return;
    }

    onClose();
  }

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      className="task-detail-panel"
      aria-label={t.taskDetailsLabel}
      onKeyDown={handlePanelKeyDown}
    >
      <div className="task-detail-topbar">
        <button
          type="button"
          className="task-detail-back"
          aria-label={t.backToListLabel}
          onClick={onClose}
        >
          <Icon icon={ChevronLeft} size="lg" />
          <span className="label-desktop">{t.today}</span>
        </button>
      </div>

      <div className="task-detail-scroll">
        <div className="task-detail-header">
          <input
            type="checkbox"
            className="task-checkbox"
            aria-label={t.completeTaskLabel(task.title)}
            checked={task.completed}
            onChange={() => onToggleTask(task.id)}
          />

          <textarea
            rows={1}
            enterKeyHint="done"
            autoComplete="off"
            className={
              task.completed
                ? "task-detail-title task-detail-title-done"
                : "task-detail-title"
            }
            aria-label={t.taskTitleLabel}
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={saveTitle}
            onKeyDown={handleTitleKeyDown}
          />

          <TaskStarButton task={task} t={t} {...handlers} />
        </div>

        <TaskStepsSection
          task={task}
          heading={t.stepsLabel}
          t={t}
          {...handlers}
        />
        <TaskFieldsSection task={task} t={t} {...handlers} />
        <TaskNoteSection task={task} t={t} {...handlers} />
      </div>

      <TaskDetailFooter
        task={task}
        onClose={onClose}
        onDelete={() => setIsDeleteConfirmOpen(true)}
        t={t}
      />

      {isDeleteConfirmOpen && (
        <ConfirmDeleteDialog
          message={t.confirmDeleteMessage(task.title)}
          cancelLabel={t.confirmDeleteCancel}
          confirmLabel={t.confirmDeleteConfirm}
          onCancel={() => setIsDeleteConfirmOpen(false)}
          onConfirm={() => onDeleteTask(task.id)}
        />
      )}
    </aside>
  );
}

function TaskDetailPanel(props) {
  const { task } = props;
  const taskId = task?.id ?? null;
  const lastTaskIdRef = useRef(null);

  useEffect(() => {
    if (taskId) {
      lastTaskIdRef.current = taskId;
      return;
    }

    const lastTaskId = lastTaskIdRef.current;

    lastTaskIdRef.current = null;

    if (lastTaskId) {
      document
        .querySelector(`[data-task-id="${lastTaskId}"] [data-focus="title"]`)
        ?.focus();
    }
  }, [taskId]);

  if (!task) {
    return null;
  }

  return <TaskDetailPanelBody key={task.id} {...props} />;
}

export default TaskDetailPanel;
