import { useId, useState } from "react";
import {
  Calendar,
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
import Icon from "../Icon";
import DateField from "../DateField";
import TimeField from "../TimeField";
import { parseLocalDate } from "../../utils/dateHelpers";
import {
  CATEGORY_OPTIONS,
  getCategoryLabel,
} from "../../utils/categoryHelpers";

// Building blocks shared by TaskDetailModal and TaskDetailPanel.

export function TaskStarButton({ task, onToggleImportant, t }) {
  return (
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
  );
}

export function TaskStepsSection({
  task,
  onAddStep,
  onToggleStep,
  onDeleteStep,
  heading,
  t,
}) {
  const [newStepText, setNewStepText] = useState("");
  const headingId = useId();

  function handleAddStep(event) {
    event.preventDefault();
    onAddStep(task.id, newStepText);
    setNewStepText("");
  }

  return (
    <section
      className="task-detail-section"
      aria-labelledby={heading ? headingId : undefined}
    >
      {heading && (
        <h3 id={headingId} className="visually-hidden">
          {heading}
        </h3>
      )}

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
            <span className={step.done ? "step-done" : ""}>{step.text}</span>
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
  );
}

export function DetailRow({ icon, label, htmlFor, className, children }) {
  return (
    <div
      className={className ? `task-detail-row ${className}` : "task-detail-row"}
    >
      <Icon icon={icon} size="lg" />
      <label htmlFor={htmlFor}>{label}</label>
      <div className="task-detail-row-control">{children}</div>
    </div>
  );
}

function ClearButton({ label, onClick }) {
  return (
    <button
      type="button"
      className="task-detail-clear"
      aria-label={label}
      onClick={onClick}
    >
      <Icon icon={X} size="sm" />
    </button>
  );
}

// Time, date, repeat, category and project rows. `children` is rendered at
// the end of the section for extra rows.
export function TaskFieldsSection({
  task,
  onUpdateTime,
  onUpdateDate,
  onUpdateRepeat,
  onUpdateCategory,
  projects,
  onAssignProject,
  t,
  children,
}) {
  const fieldId = useId();
  const timeId = `${fieldId}-time`;
  const dateId = `${fieldId}-date`;
  const repeatId = `${fieldId}-repeat`;
  const categoryId = `${fieldId}-category`;
  const projectId = `${fieldId}-project`;

  return (
    <section className="task-detail-section">
      <DetailRow icon={Clock} label={t.timeLabel} htmlFor={timeId}>
        <TimeField
          id={timeId}
          className="task-detail-input task-detail-time"
          value={task.dueTime || ""}
          onChange={(time) => onUpdateTime(task.id, time)}
          t={t}
        />
        {task.dueTime && (
          <ClearButton
            label={t.clearTimeLabel}
            onClick={() => onUpdateTime(task.id, "")}
          />
        )}
      </DetailRow>

      <DetailRow icon={Calendar} label={t.dateLabel} htmlFor={dateId}>
        <DateField
          id={dateId}
          value={task.date || ""}
          onChange={(date) => onUpdateDate(task.id, date)}
          t={t}
        />
        {task.date && (
          <ClearButton
            label={t.removeDateButton}
            onClick={() => onUpdateDate(task.id, "")}
          />
        )}
      </DetailRow>

      <DetailRow icon={Repeat} label={t.repeatLabel} htmlFor={repeatId}>
        <select
          id={repeatId}
          className="task-detail-input"
          value={task.repeat || "none"}
          disabled={!task.date}
          onChange={(event) => onUpdateRepeat(task.id, event.target.value)}
        >
          <option value="none">{t.repeatNone}</option>
          <option value="daily">{t.repeatDaily}</option>
          <option value="weekly">{t.repeatWeekly}</option>
        </select>
      </DetailRow>

      <DetailRow icon={Tag} label={t.categoryLabel} htmlFor={categoryId}>
        <select
          id={categoryId}
          className="task-detail-input"
          value={task.category || "Other"}
          onChange={(event) => onUpdateCategory(task.id, event.target.value)}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {getCategoryLabel(option, t)}
            </option>
          ))}
        </select>
      </DetailRow>

      <DetailRow icon={Folder} label={t.project} htmlFor={projectId}>
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
      </DetailRow>

      {children}
    </section>
  );
}

export function TaskNoteSection({ task, onUpdateDescription, t }) {
  const descriptionId = useId();

  return (
    <section className="task-detail-note">
      <Icon icon={StickyNote} size="lg" />
      <label htmlFor={descriptionId} className="visually-hidden">
        {t.descriptionLabel}
      </label>
      <textarea
        id={descriptionId}
        className="task-detail-description"
        value={task.description || ""}
        onChange={(event) => onUpdateDescription(task.id, event.target.value)}
        placeholder={t.descriptionPlaceholder}
      />
    </section>
  );
}

export function TaskDetailFooter({ task, onClose, onDelete, t }) {
  return (
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
              parseLocalDate(task.createdAt).toLocaleDateString(t.dateLocale, {
                day: "numeric",
                month: "long",
              }),
            )
          : ""}
      </span>

      <button
        type="button"
        className="task-detail-icon-button task-detail-delete"
        aria-label={t.deleteButtonAria}
        onClick={onDelete}
      >
        <Icon icon={Trash2} size="lg" />
      </button>
    </div>
  );
}
