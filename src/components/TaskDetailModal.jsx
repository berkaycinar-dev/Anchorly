import { useEffect, useId, useRef, useState } from "react";
import {
  Calendar,
  Clock,
  Folder,
  Paperclip,
  Plus,
  Repeat,
  Star,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import Icon from "./Icon";
import { parseLocalDate } from "../utils/dateHelpers";
import { useToastHost } from "./toast/useToast";
import DateField from "./DateField";
import TimeField from "./TimeField";
import ConfirmDeleteDialog from "./taskDetail/ConfirmDeleteDialog";
import { useAttachmentUpload } from "./taskDetail/useAttachmentUpload";
import { useBackdropClose } from "./taskDetail/useBackdropClose";

function TaskDetailModal({
  task,
  onClose,
  onToggleTask,
  onToggleImportant,
  onUpdateTitle,
  onUpdateDate,
  onUpdateTime,
  onUpdateDescription,
  onAddStep,
  onToggleStep,
  onDeleteStep,
  onUpdateRepeat,
  onAddAttachment,
  onDeleteAttachment,
  projects,
  onAssignProject,
  onDeleteTask,
  t,
}) {
  const [newStepText, setNewStepText] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const titleRef = useRef(null);
  const titleId = useId();
  const fieldId = useId();
  const descriptionId = `${fieldId}-description`;
  const timeId = `${fieldId}-time`;
  const dateId = `${fieldId}-date`;
  const repeatId = `${fieldId}-repeat`;
  const fileId = `${fieldId}-file`;
  const projectId = `${fieldId}-project`;
  const stepInputId = `${fieldId}-step`;
  const setToastHost = useToastHost();
  const backdropClose = useBackdropClose(dialogRef);
  const hasTask = Boolean(task);
  const handleFileUpload = useAttachmentUpload({
    taskId: task?.id,
    onAddAttachment,
    t,
  });

  useEffect(() => {
    if (!hasTask) {
      return undefined;
    }

    const dialog = dialogRef.current;

    if (!dialog.hasAttribute("open")) {
      openerRef.current = document.activeElement;
      dialog.showModal();
      titleRef.current?.focus();
    }

    return () => {
      const opener = openerRef.current;

      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus();
      }
    };
  }, [hasTask]);

  if (!task) {
    return null;
  }

  function handleAddStep(event) {
    event.preventDefault();
    onAddStep(task.id, newStepText);
    setNewStepText("");
  }

  function startEditingTitle() {
    setEditedTitle(task.title);
    setIsEditingTitle(true);
  }

  function saveTitle() {
    const trimmedTitle = editedTitle.trim();

    if (trimmedTitle === "") {
      setEditedTitle(task.title);
      setIsEditingTitle(false);
      return;
    }

    onUpdateTitle(task.id, trimmedTitle);
    setIsEditingTitle(false);
  }

  function handleTitleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveTitle();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setEditedTitle(task.title);
      setIsEditingTitle(false);
    }
  }

  function requestClose() {
    dialogRef.current.close();
  }

  function handleDialogClose(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleDialogCancel(event) {
    if (event.target === event.currentTarget && isEditingTitle) {
      event.preventDefault();
    }
  }

  function handleDeleteTask() {
    setIsDeleteConfirmOpen(true);
  }

  function confirmDeleteTask() {
    onDeleteTask(task.id);
    onClose();
  }

  function cancelDeleteTask() {
    setIsDeleteConfirmOpen(false);
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal-dialog"
      aria-labelledby={titleId}
      onClose={handleDialogClose}
      onCancel={handleDialogCancel}
      onMouseDown={backdropClose.onMouseDown}
      onClick={backdropClose.onClick}
    >
      <div className="task-detail-panel task-detail-panel-dialog">
        <div className="task-detail-scroll">
          <div className="task-detail-header">
            <input
              type="checkbox"
              className="task-checkbox"
              aria-label={t.completeTaskLabel(task.title)}
              checked={task.completed}
              onChange={() => onToggleTask(task.id)}
            />

            {isEditingTitle ? (
              <input
                id={titleId}
                type="text"
                enterKeyHint="done"
                autoComplete="off"
                className="task-detail-title task-detail-title-input"
                value={editedTitle}
                autoFocus
                onChange={(event) => setEditedTitle(event.target.value)}
                onBlur={saveTitle}
                onKeyDown={handleTitleKeyDown}
              />
            ) : (
              <h2
                id={titleId}
                ref={titleRef}
                tabIndex={-1}
                className={
                  task.completed
                    ? "task-detail-title task-detail-title-done"
                    : "task-detail-title"
                }
                onDoubleClick={startEditingTitle}
                title={t.editTitleHint}
              >
                {task.title}
              </h2>
            )}

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

          <section className="task-detail-section">
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

            <div className="task-detail-row task-detail-row-files">
              <Icon icon={Paperclip} size="lg" />
              <label htmlFor={fileId}>{t.attachmentsLabel}</label>
              <div className="task-detail-row-control">
                <input
                  id={fileId}
                  type="file"
                  onChange={handleFileUpload}
                  className="task-detail-file"
                />
              </div>
            </div>

            {task.attachments.length > 0 && (
              <div className="attachments-list">
                {task.attachments.map((attachment) => (
                  <div className="attachment-item" key={attachment.id}>
                    <a
                      href={attachment.data}
                      download={attachment.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="attachment-link"
                    >
                      {attachment.type.startsWith("image/") ? (
                        <img
                          src={attachment.data}
                          alt={attachment.name}
                          className="attachment-preview"
                        />
                      ) : (
                        <span className="attachment-name">
                          📄 {attachment.name}
                        </span>
                      )}
                    </a>

                    <button
                      type="button"
                      className="attachment-delete-button"
                      aria-label={t.deleteAttachmentLabel(attachment.name)}
                      onClick={() => onDeleteAttachment(task.id, attachment.id)}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            onClick={requestClose}
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
            onClick={handleDeleteTask}
          >
            <Icon icon={Trash2} size="lg" />
          </button>
        </div>
      </div>

      {isDeleteConfirmOpen && (
        <ConfirmDeleteDialog
          message={t.confirmDeleteMessage(task.title)}
          cancelLabel={t.confirmDeleteCancel}
          confirmLabel={t.confirmDeleteConfirm}
          onCancel={cancelDeleteTask}
          onConfirm={confirmDeleteTask}
        />
      )}

      <div ref={setToastHost} className="toast-host" />
    </dialog>
  );
}

export default TaskDetailModal;
