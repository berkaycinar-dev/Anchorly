import { useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import Icon from "../Icon";
import { getCategoryLabel } from "../../utils/categoryHelpers";
import { getCompletionPercent } from "../../utils/calendarHelpers";
import { getCategoryTone } from "../../utils/dashboardData";
import { parseLocalDate } from "../../utils/dateHelpers";

function CalendarDayPanel({
  id,
  dateString,
  tasks,
  isOpen,
  isToday,
  locale,
  t,
  onToggle,
  onToggleTask,
  onOpenTask,
  onAddTask,
}) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const date = parseLocalDate(dateString);
  const weekday = date.toLocaleDateString(locale, { weekday: "long" });
  const dayLabel = date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
  });
  const panelLabel = `${weekday}, ${dayLabel}`;

  if (!isOpen) {
    return (
      <aside id={id} className="calendar-panel-rail" aria-label={panelLabel}>
        <button
          type="button"
          className="calendar-icon-button"
          aria-expanded={false}
          aria-controls={id}
          aria-label={t.calendarShowPanel}
          title={t.calendarShowPanel}
          onClick={onToggle}
        >
          <Icon icon={PanelRightOpen} />
        </button>
        <span className="calendar-rail-day">{date.getDate()}</span>
        <span className="calendar-rail-label">
          {tasks.length === 0
            ? t.calendarNoTasksSummary
            : t.calendarDayTaskCount(tasks.length)}
        </span>
      </aside>
    );
  }

  const eyebrow = (
    isToday ? t.calendarTodayEyebrow(weekday) : weekday
  ).toLocaleUpperCase(locale);
  const orderedTasks = [...tasks].sort(
    (a, b) => Number(a.completed) - Number(b.completed),
  );
  const completedCount = tasks.filter((task) => task.completed).length;
  const percent = getCompletionPercent(tasks) ?? 0;

  function handleSubmit(event) {
    event.preventDefault();

    const title = newTaskTitle.trim();

    if (title === "") {
      return;
    }

    onAddTask(title, dateString);
    setNewTaskTitle("");
  }

  return (
    <aside id={id} className="calendar-panel" aria-label={panelLabel}>
      <header className="calendar-panel-header">
        <div className="calendar-panel-header-row">
          <div className="calendar-panel-header-text">
            <p className="calendar-panel-eyebrow">{eyebrow}</p>
            <h3 className="calendar-panel-title">{dayLabel}</h3>
            <p className="calendar-panel-summary">
              {tasks.length === 0
                ? t.calendarNoTasksSummary
                : t.calendarDaySummary(tasks.length, completedCount)}
            </p>
          </div>
          <button
            type="button"
            className="calendar-icon-button"
            aria-expanded={true}
            aria-controls={id}
            aria-label={t.calendarHidePanel}
            title={t.calendarHidePanel}
            onClick={onToggle}
          >
            <Icon icon={PanelRightClose} />
          </button>
        </div>
        {tasks.length > 0 && (
          <div
            className="calendar-panel-progress"
            role="progressbar"
            aria-label={t.projectProgressAria(completedCount, tasks.length)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div
              className="calendar-panel-progress-fill"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </header>

      <section className="calendar-panel-section">
        <h4 className="calendar-panel-heading">{t.calendarTasksHeading}</h4>

        {orderedTasks.length === 0 ? (
          <p className="calendar-panel-empty">{t.calendarNoTasks}</p>
        ) : (
          <ul className="calendar-panel-list">
            {orderedTasks.map((task) => (
              <li key={task.id} className="calendar-panel-task">
                <input
                  type="checkbox"
                  className="themed-checkbox"
                  checked={task.completed}
                  aria-label={t.completeTaskLabel(task.title)}
                  onChange={() => onToggleTask(task.id)}
                />
                <button
                  type="button"
                  className="calendar-panel-task-title"
                  data-done={task.completed || undefined}
                  onClick={() => onOpenTask(task.id)}
                >
                  {task.title}
                </button>
                <span
                  className="dashboard-chip"
                  data-tone={getCategoryTone(task.category)}
                >
                  {getCategoryLabel(task.category, t)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form className="calendar-panel-form" onSubmit={handleSubmit}>
        <input
          type="text"
          enterKeyHint="done"
          autoComplete="off"
          aria-label={t.addTaskToDay}
          placeholder={t.calendarAddPlaceholder(dayLabel)}
          value={newTaskTitle}
          onChange={(event) => setNewTaskTitle(event.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          {t.addButton}
        </button>
      </form>
    </aside>
  );
}

export default CalendarDayPanel;
