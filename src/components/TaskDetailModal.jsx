import { useEffect, useId, useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { useToastHost } from "./toast/useToast";
import ConfirmDeleteDialog from "./taskDetail/ConfirmDeleteDialog";
import {
  DetailRow,
  TaskDetailFooter,
  TaskFieldsSection,
  TaskNoteSection,
  TaskStarButton,
  TaskStepsSection,
} from "./taskDetail/TaskDetailParts";
import { useAttachmentUpload } from "./taskDetail/useAttachmentUpload";
import { useBackdropClose } from "./taskDetail/useBackdropClose";

function TaskDetailModal({
  task,
  onClose,
  onToggleTask,
  onUpdateTitle,
  onAddAttachment,
  onDeleteAttachment,
  onDeleteTask,
  t,
  ...handlers
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const titleRef = useRef(null);
  const titleId = useId();
  const fileId = useId();
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

  function startEditingTitle() {
    setEditedTitle(task.title);
    setIsEditingTitle(true);
  }

  function saveTitle() {
    const trimmedTitle = editedTitle.trim();

    if (trimmedTitle !== "") {
      onUpdateTitle(task.id, trimmedTitle);
    }

    setIsEditingTitle(false);
  }

  function handleTitleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveTitle();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsEditingTitle(false);
    }
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

            <TaskStarButton task={task} t={t} {...handlers} />
          </div>

          <TaskStepsSection task={task} t={t} {...handlers} />

          <TaskFieldsSection task={task} t={t} {...handlers}>
            <DetailRow
              icon={Paperclip}
              label={t.attachmentsLabel}
              htmlFor={fileId}
              className="task-detail-row-files"
            >
              <input
                id={fileId}
                type="file"
                onChange={handleFileUpload}
                className="task-detail-file"
              />
            </DetailRow>

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
          </TaskFieldsSection>

          <TaskNoteSection task={task} t={t} {...handlers} />
        </div>

        <TaskDetailFooter
          task={task}
          onClose={() => dialogRef.current.close()}
          onDelete={() => setIsDeleteConfirmOpen(true)}
          t={t}
        />
      </div>

      {isDeleteConfirmOpen && (
        <ConfirmDeleteDialog
          message={t.confirmDeleteMessage(task.title)}
          cancelLabel={t.confirmDeleteCancel}
          confirmLabel={t.confirmDeleteConfirm}
          onCancel={() => setIsDeleteConfirmOpen(false)}
          onConfirm={() => {
            onDeleteTask(task.id);
            onClose();
          }}
        />
      )}

      <div ref={setToastHost} className="toast-host" />
    </dialog>
  );
}

export default TaskDetailModal;
