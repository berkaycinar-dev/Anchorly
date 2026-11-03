import { useEffect, useId, useRef } from "react";
import { Check, ChevronRight, X } from "lucide-react";
import Icon from "../Icon";
import { getCategoryLabel } from "../../utils/categoryHelpers";
import { getCategoryTone } from "../../utils/dashboardData";

function DayTasksDialog({
  title,
  tasks,
  t,
  onClose,
  onOpenTask,
  onOpenCalendar,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog.hasAttribute("open")) {
      dialog.showModal();
    }
  }, []);

  function handleClick(event) {
    if (event.target === event.currentTarget) {
      dialogRef.current.close();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="day-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={handleClick}
    >
      <div className="day-dialog-box">
        <header className="day-dialog-header">
          <div>
            <p className="day-dialog-kicker">
              {t.taskCountLabel(tasks.length)}
            </p>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            type="button"
            className="dashboard-icon-button"
            aria-label={t.closeButton}
            title={t.closeButton}
            onClick={() => dialogRef.current.close()}
          >
            <Icon icon={X} size="sm" />
          </button>
        </header>

        {tasks.length === 0 ? (
          <p className="dashboard-empty-card">{t.dayDialogEmpty}</p>
        ) : (
          <ul className="dashboard-list day-dialog-list">
            {tasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  className="dashboard-item dashboard-row"
                  aria-label={t.openTaskLabel(task.title)}
                  onClick={() => onOpenTask(task.id)}
                >
                  <span
                    className={`dashboard-mark${task.completed ? " dashboard-mark-done" : ""}`}
                    aria-hidden="true"
                  >
                    <Icon icon={Check} size="sm" />
                  </span>
                  <span
                    className={`dashboard-row-title${task.completed ? " dashboard-row-done" : ""}`}
                  >
                    {task.title}
                  </span>
                  <span
                    className="dashboard-chip"
                    data-tone={getCategoryTone(task.category)}
                  >
                    {getCategoryLabel(task.category, t)}
                  </span>
                  <Icon icon={ChevronRight} size="sm" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="day-dialog-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onOpenCalendar}
          >
            {t.openInCalendar}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default DayTasksDialog;
