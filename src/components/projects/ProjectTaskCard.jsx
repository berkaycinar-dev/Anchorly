import { Paperclip } from "lucide-react";
import Icon from "../Icon";
import { formatShortDate, getStepProgress } from "../../utils/projectHelpers";

function getDateTone(task, today) {
  if (task.completed) {
    return "muted";
  }

  if (task.date === today) {
    return "today";
  }

  return task.date < today ? "overdue" : "neutral";
}

function ProjectTaskCardContent({ task, today, t }) {
  const steps = getStepProgress(task);
  const hasSteps = steps.total > 0;
  const attachmentCount = task.attachments.length;

  return (
    <>
      <span className="board-card-title">{task.title}</span>

      {hasSteps && (
        <span className="board-card-steps">
          <span
            className="board-card-bar"
            role="progressbar"
            aria-label={t.projectCardStepsAria(steps.done, steps.total)}
            aria-valuemin={0}
            aria-valuemax={steps.total}
            aria-valuenow={steps.done}
          >
            <span
              className="board-card-bar-fill"
              style={{ width: `${(steps.done / steps.total) * 100}%` }}
            />
          </span>
          <span className="board-card-steps-text" aria-hidden="true">
            {t.projectCardSteps(steps.done, steps.total)}
          </span>
        </span>
      )}

      {(task.date || attachmentCount > 0) && (
        <span className="board-card-meta">
          {task.date && (
            <span className="board-chip" data-tone={getDateTone(task, today)}>
              {task.date === today && !task.completed
                ? t.today
                : formatShortDate(task.date, t.dateLocale)}
            </span>
          )}

          {attachmentCount > 0 && (
            <span
              className="board-card-attachments"
              aria-label={t.projectCardAttachmentsAria(attachmentCount)}
            >
              <Icon icon={Paperclip} size="sm" />
              <span aria-hidden="true">{attachmentCount}</span>
            </span>
          )}
        </span>
      )}
    </>
  );
}

export function ProjectTaskCardOverlay({ task, today, t }) {
  return (
    <div
      className="board-card board-card-overlay"
      data-done={task.completed ? "true" : undefined}
    >
      <ProjectTaskCardContent task={task} today={today} t={t} />
    </div>
  );
}

function ProjectTaskCard({
  task,
  today,
  onSelectTask,
  dragRef,
  dragAttributes,
  dragListeners,
  isDragging,
  t,
}) {
  return (
    <button
      type="button"
      ref={dragRef}
      className="board-card"
      data-done={task.completed ? "true" : undefined}
      data-dragging={isDragging ? "true" : undefined}
      onClick={() => onSelectTask(task.id)}
      {...dragAttributes}
      {...dragListeners}
    >
      <ProjectTaskCardContent task={task} today={today} t={t} />
    </button>
  );
}

export default ProjectTaskCard;
