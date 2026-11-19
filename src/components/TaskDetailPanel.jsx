import { useEffect, useId, useRef, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  Clock,
  Folder,
  Plus,
  Repeat,
  Star,
  StickyNote,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import DateField from "./DateField";
import TimeField from "./TimeField";
import Icon from "./Icon";
import ConfirmDeleteDialog from "./taskDetail/ConfirmDeleteDialog";
import { parseLocalDate } from "../utils/dateHelpers";
import { CATEGORY_OPTIONS, getCategoryLabel } from "../utils/categoryHelpers";

function TaskDetailPanelBody({
  task,
  onClose,
  onToggleTask,
  onToggleImportant,
  onUpdateTitle,
  onUpdateDate,
  onUpdateTime,
  onUpdateCategory,
  onUpdateDescription,
  onAddStep,
  onToggleStep,
  onDeleteStep,
  onUpdateRepeat,
  projects,
  onAssignProject,
  onDeleteTask,
  t,
}) {
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [newStepText, setNewStepText] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const panelRef = useRef(null);
  const fieldId = useId();
  const stepsId = `${fieldId}-steps`;
  const timeId = `${fieldId}-time`;
  const dateId = `${fieldId}-date`;
  const repeatId = `${fieldId}-repeat`;
  const projectId = `${fieldId}-project`;
  const categoryId = `${fieldId}-category`;
  const descriptionId = `${fieldId}-description`;
  const stepInputId = `${fieldId}-step`;

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

  function handleAddStep(event) {
    event.preventDefault();
    onAddStep(task.id, newStepText);
    setNewStepText("");
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
          {t.today}
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

          <button
            type="button"
            className={
              task.important
                ? "task-star task-star-active task-detail-star"
                : "task-star task-detail-star"
            }
            aria-pressed={task.important === true}
            aria-label={t.importantTaskLabel(task.title)}
            onClick={() => onToggleImportant(task.id)}
          >
            <Icon icon={Star} size="md" />
          </button>
        </div>

        <section className="task-detail-section" aria-labelledby={stepsId}>
          <h3 id={stepsId} className="visually-hidden">
            {t.stepsLabel}
          </h3>

          <ul className="task-steps-list">
            {(task.steps || []).map((step) => (
              <li key={step.id}>
                <input
                  type="checkbox"
                  className="task-checkbox task-step-checkbox"
                  aria-label={t.completeStepLabel(step.text)}
                  checked={step.done}
                  onChange={() => onToggleStep(task.id, step.id)}
                />
                <span className={step.done ? "step-done" : ""}>
                  {step.text}
                </span>
                <button
                  type="button"
                  className="step-delete-button"
                  aria-label={t.deleteStepLabel(step.text)}
                  onClick={() => onDeleteStep(task.id, step.id)}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>

          <form className="task-step-form" onSubmit={handleAddStep}>
            <span className="task-step-plus" aria-hidden="true">
              <Icon icon={Plus} size="md" />
            </span>
            <input
              id={stepInputId}
              type="text"
              enterKeyHint="done"
              autoComplete="off"
              aria-label={t.newStepLabel}
              placeholder={t.addStepButtonLabel}
              value={newStepText}
              onChange={(event) => setNewStepText(event.target.value)}
            />
            <button type="submit" className="visually-hidden">
              {t.addButton}
            </button>
          </form>
        </section>

        <section className="task-detail-section">
          <div className="task-detail-row">
            <Icon icon={Clock} size="lg" />
            <label htmlFor={timeId}>{t.timeLabel}</label>
            <div className="task-detail-row-control">
              <TimeField
                id={timeId}
                className="task-detail-input task-detail-time"
                value={task.dueTime || ""}
                onChange={(time) => onUpdateTime(task.id, time)}
                t={t}
              />

              {task.dueTime && (
                <button
                  type="button"
                  className="task-detail-clear"
                  aria-label={t.clearTimeLabel}
                  onClick={() => onUpdateTime(task.id, "")}
                >
                  <Icon icon={X} size="sm" />
                </button>
              )}
            </div>
          </div>

          <div className="task-detail-row">
            <Icon icon={Calendar} size="lg" />
            <label htmlFor={dateId}>{t.dateLabel}</label>
            <div className="task-detail-row-control">
              <DateField
                id={dateId}
                value={task.date || ""}
                onChange={(date) => onUpdateDate(task.id, date)}
                t={t}
              />

              {task.date && (
                <button
                  type="button"
                  className="task-detail-clear"
                  aria-label={t.removeDateButton}
                  onClick={() => onUpdateDate(task.id, "")}
                >
                  <Icon icon={X} size="sm" />
                </button>
              )}
            </div>
          </div>

          <div className="task-detail-row">
            <Icon icon={Repeat} size="lg" />
            <label htmlFor={repeatId}>{t.repeatLabel}</label>
            <div className="task-detail-row-control">
              <select
                id={repeatId}
                className="task-detail-input"
                value={task.repeat || "none"}
                disabled={!task.date}
                onChange={(event) =>
                  onUpdateRepeat(task.id, event.target.value)
                }
              >
                <option value="none">{t.repeatNone}</option>
                <option value="daily">{t.repeatDaily}</option>
                <option value="weekly">{t.repeatWeekly}</option>
              </select>
            </div>
          </div>

          <div className="task-detail-row">
            <Icon icon={Tag} size="lg" />
            <label htmlFor={categoryId}>{t.categoryLabel}</label>
            <div className="task-detail-row-control">
              <select
                id={categoryId}
                className="task-detail-input"
                value={task.category || "Other"}
                onChange={(event) =>
                  onUpdateCategory(task.id, event.target.value)
                }
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {getCategoryLabel(option, t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="task-detail-row">
            <Icon icon={Folder} size="lg" />
            <label htmlFor={projectId}>{t.project}</label>
            <div className="task-detail-row-control">
              <select
                id={projectId}
                className="task-detail-input"
                value={task.projectId ?? ""}
                onChange={(event) =>
                  onAssignProject(task.id, event.target.value || null)
                }
              >
                <option value="">{t.noProject}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="task-detail-note">
          <Icon icon={StickyNote} size="lg" />
          <label htmlFor={descriptionId} className="visually-hidden">
            {t.descriptionLabel}
          </label>
          <textarea
            id={descriptionId}
            className="task-detail-description"
            value={task.description || ""}
            onChange={(event) =>
              onUpdateDescription(task.id, event.target.value)
            }
            placeholder={t.descriptionPlaceholder}
          />
        </section>
      </div>

      <div className="task-detail-footer">
        <button
          type="button"
          className="task-detail-icon-button task-detail-close"
          aria-label={t.closeButton}
          onClick={onClose}
        >
          <Icon icon={X} size="lg" />
        </button>

        <span className="task-detail-created">
          {task.createdAt
            ? t.taskCreatedOn(
                parseLocalDate(task.createdAt).toLocaleDateString(
                  t.dateLocale,
                  { day: "numeric", month: "long" },
                ),
              )
            : ""}
        </span>

        <button
          type="button"
          className="task-detail-icon-button task-detail-delete"
          aria-label={t.deleteButtonAria}
          onClick={() => setIsDeleteConfirmOpen(true)}
        >
          <Icon icon={Trash2} size="lg" />
        </button>
      </div>

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
