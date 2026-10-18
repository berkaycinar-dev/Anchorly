import { useState } from "react";
import { getLocalDateString, parseLocalDate } from "../utils/dateHelpers";

const MAX_DOTS = 3;

function CalendarAgenda({
  dates,
  leadingBlankCount,
  weekdayNames,
  tasks,
  today,
  onSelectTask,
  onAddTask,
  t,
  language,
}) {
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const dateStrings = dates.map((date) => getLocalDateString(date));
  const defaultDate = dateStrings.includes(today) ? today : dateStrings[0];
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  function getTasksForDate(dateString) {
    return tasks
      .filter((task) => task.date === dateString)
      .sort((a, b) => Number(a.completed) - Number(b.completed));
  }

  const selectedTasks = getTasksForDate(selectedDate);

  function handleSubmit(event) {
    event.preventDefault();

    const title = newTaskTitle.trim();

    if (title === "") {
      return;
    }

    onAddTask(title, selectedDate);
    setNewTaskTitle("");
  }

  function getDayButtonClassName(dateString) {
    const classNames = ["calendar-picker-day"];

    if (dateString === today) {
      classNames.push("calendar-picker-day-today");
    }

    return classNames.join(" ");
  }

  return (
    <div className="calendar-agenda">
      <div
        className="calendar-picker"
        role="group"
        aria-label={t.calendarDayPickerLabel}
      >
        {weekdayNames.map((name) => (
          <span
            key={name}
            className="calendar-picker-weekday"
            aria-hidden="true"
          >
            {name}
          </span>
        ))}

        {Array.from({ length: leadingBlankCount }).map((_, index) => (
          <span key={`blank-${index}`} aria-hidden="true" />
        ))}

        {dateStrings.map((dateString) => {
          const date = parseLocalDate(dateString);
          const dayTasks = getTasksForDate(dateString);
          const dotCount = Math.min(dayTasks.length, MAX_DOTS);
          const fullLabel = date.toLocaleDateString(locale, {
            weekday: "long",
            day: "numeric",
            month: "long",
          });

          return (
            <button
              key={dateString}
              type="button"
              className={getDayButtonClassName(dateString)}
              aria-pressed={dateString === selectedDate}
              aria-label={
                dayTasks.length > 0
                  ? `${fullLabel}, ${t.calendarDayTaskCount(dayTasks.length)}`
                  : fullLabel
              }
              onClick={() => setSelectedDate(dateString)}
            >
              <span className="calendar-picker-number" aria-hidden="true">
                {date.getDate()}
              </span>
              <span className="calendar-picker-dots" aria-hidden="true">
                {dayTasks.slice(0, dotCount).map((task) => (
                  <span
                    key={task.id}
                    className={
                      task.completed
                        ? "calendar-picker-dot calendar-picker-dot-done"
                        : "calendar-picker-dot"
                    }
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <section className="calendar-agenda-day">
        <h3 className="calendar-agenda-title">
          {parseLocalDate(selectedDate).toLocaleDateString(locale, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h3>

        {selectedTasks.length === 0 ? (
          <p className="calendar-agenda-empty">{t.calendarNoTasks}</p>
        ) : (
          <ul className="calendar-agenda-list">
            {selectedTasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  className={
                    task.completed
                      ? "calendar-agenda-task calendar-agenda-task-done"
                      : "calendar-agenda-task"
                  }
                  onClick={() => onSelectTask(task.id)}
                >
                  {task.title}
                </button>
              </li>
            ))}
          </ul>
        )}

        <form className="calendar-agenda-form" onSubmit={handleSubmit}>
          <input
            type="text"
            aria-label={t.addTaskToDay}
            placeholder={t.taskTitlePlaceholder}
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            {t.addButton}
          </button>
        </form>
      </section>
    </div>
  );
}

export default CalendarAgenda;