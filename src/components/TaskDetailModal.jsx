import { useEffect, useId, useRef, useState } from "react";
import { createId } from "../lib/id";
import { useToast, useToastHost } from "./toast/useToast";

function useBackdropClose(dialogRef) {
  const pressStartedOnBackdrop = useRef(false);

  return {
    onMouseDown(event) {
      pressStartedOnBackdrop.current = event.target === event.currentTarget;
    },
    onClick(event) {
      const shouldClose =
        pressStartedOnBackdrop.current && event.target === event.currentTarget;

      pressStartedOnBackdrop.current = false;

      if (shouldClose) {
        dialogRef.current.close();
      }
    },
  };
}

function ConfirmDeleteDialog({
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}) {
  const dialogRef = useRef(null);
  const messageId = useId();
  const backdropClose = useBackdropClose(dialogRef);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog.hasAttribute("open")) {
      dialog.showModal();
    }
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      role="alertdialog"
      aria-labelledby={messageId}
      onClose={onCancel}
      onMouseDown={backdropClose.onMouseDown}
      onClick={backdropClose.onClick}
    >
      <div className="confirm-box">
        <p id={messageId} className="confirm-message">
          {message}
        </p>

        <div className="confirm-actions">
          <button
            className="btn btn-secondary"
            onClick={() => dialogRef.current.close()}
          >
            {cancelLabel}
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function TaskDetailModal({
  task,
  onClose,
  onToggleTask,
  onUpdateTitle,
  onUpdateDate,
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
  const dateId = `${fieldId}-date`;
  const repeatId = `${fieldId}-repeat`;
  const fileId = `${fieldId}-file`;
  const projectId = `${fieldId}-project`;
  const stepInputId = `${fieldId}-step`;
  const setToastHost = useToastHost();
  const toast = useToast();
  const backdropClose = useBackdropClose(dialogRef);
  const hasTask = Boolean(task);

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

  function handleFileUpload(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const maxSizeInBytes = 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      toast.error(t.fileTooLargeWarning);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      onAddAttachment(task.id, {
        id: createId(),
        name: file.name,
        type: file.type,
        data: reader.result,
      });
    };

    reader.readAsDataURL(file);
    event.target.value = "";
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
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-complete-toggle">
            <input
              type="checkbox"
              className="themed-checkbox"
              aria-label={t.completeTaskLabel(task.title)}
              checked={task.completed}
              onChange={() => onToggleTask(task.id)}
            />

            {isEditingTitle ? (
              <input
                id={titleId}
                type="text"
                className="modal-title-input"
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
                className={task.completed ? "modal-title-done" : ""}
                onDoubleClick={startEditingTitle}
                title={t.editTitleHint}
              >
                {task.title}
              </h2>
            )}
          </div>

          <div className="modal-header-actions">
            <button
              className="btn btn-danger"
              onClick={handleDeleteTask}
              aria-label={t.deleteButtonAria}
            >
              {t.deleteButton}
            </button>

            <button className="btn btn-secondary" onClick={requestClose}>
              {t.closeButton}
            </button>
          </div>
        </div>

        <label htmlFor={descriptionId}>{t.descriptionLabel}</label>
        <textarea
          id={descriptionId}
          value={task.description || ""}
          onChange={(event) => onUpdateDescription(task.id, event.target.value)}
          placeholder={t.descriptionPlaceholder}
        />
        <label htmlFor={dateId}>{t.dateLabel}</label>
        <div className="detail-date-row">
          <input
            id={dateId}
            type="date"
            value={task.date || ""}
            onChange={(event) => onUpdateDate(task.id, event.target.value)}
          />

          {task.date && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onUpdateDate(task.id, "")}
            >
              {t.removeDateButton}
            </button>
          )}
        </div>

        <label htmlFor={repeatId}>{t.repeatLabel}</label>
        <select
          id={repeatId}
          className="task-repeat-select"
          value={task.repeat || "none"}
          disabled={!task.date}
          onChange={(event) => onUpdateRepeat(task.id, event.target.value)}
        >
          <option value="none">{t.repeatNone}</option>
          <option value="daily">{t.repeatDaily}</option>
          <option value="weekly">{t.repeatWeekly}</option>
        </select>

        {!task.date && <p className="task-repeat-hint">{t.repeatHint}</p>}

        <label htmlFor={fileId}>{t.attachmentsLabel}</label>
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
                  <span className="attachment-name">📄 {attachment.name}</span>
                )}
              </a>

              <button
                type="button"
                aria-label={t.deleteAttachmentLabel(attachment.name)}
                onClick={() => onDeleteAttachment(task.id, attachment.id)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          ))}
        </div>

        <input
          id={fileId}
          type="file"
          onChange={handleFileUpload}
          className="attachment-input"
        />

        <div className="detail-field">
          <label htmlFor={projectId}>{t.project}</label>
          <select
            id={projectId}
            value={task.projectId ?? ""}
            onChange={(e) => onAssignProject(task.id, e.target.value || null)}
          >
            <option value="">{t.noProject}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <label htmlFor={stepInputId}>{t.stepsLabel}</label>
        <ul className="task-steps-list">
          {(task.steps || []).map((step) => (
            <li key={step.id}>
              <input
                type="checkbox"
                className="themed-checkbox"
                aria-label={t.completeStepLabel(step.text)}
                checked={step.done}
                onChange={() => onToggleStep(task.id, step.id)}
              />
              <span className={step.done ? "step-done" : ""}>{step.text}</span>
              <button
                type="button"
                aria-label={t.deleteStepLabel(step.text)}
                onClick={() => onDeleteStep(task.id, step.id)}
              >
                {t.deleteButton}
              </button>
            </li>
          ))}
        </ul>

        <form className="task-step-form" onSubmit={handleAddStep}>
          <input
            id={stepInputId}
            type="text"
            aria-label={t.newStepLabel}
            placeholder={t.newStepPlaceholder}
            value={newStepText}
            onChange={(event) => setNewStepText(event.target.value)}
          />
          <button type="submit">{t.addButton}</button>
        </form>
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
