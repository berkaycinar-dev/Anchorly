import { useState } from "react";

export default function CalendarPage({
  calendarViewMode,
  setCalendarViewMode,
  calendarMonth,
  weekDays,
  setCalendarMonth,
  calendarYear,
  calendarMonthIndex,
  calendarWeekStart,
  setCalendarWeekStart,
  calendarStartDay,
  calendarDays,
  tasks,
  setQuickAddDate,
  setQuickAddTitle,
  quickAddDate,
  submitQuickAdd,
  quickAddTitle,
  setSelectedTaskId,
  today,
}) {
  const [expandedDayDate, setExpandedDayDate] = useState(null);
  function goToPrevious() {
    if (calendarViewMode === "month") {
      setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1));
    } else {
      const newDate = new Date(calendarWeekStart);
      newDate.setDate(newDate.getDate() - 7);
      setCalendarWeekStart(newDate);
    }
  }

  function goToNext() {
    if (calendarViewMode === "month") {
      setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1));
    } else {
      const newDate = new Date(calendarWeekStart);
      newDate.setDate(newDate.getDate() + 7);
      setCalendarWeekStart(newDate);
    }
  }

  function toggleViewMode() {
    setCalendarViewMode(calendarViewMode === "month" ? "week" : "month");
  }

  return (
    <section className="calendar-page">
      <div className="calendar-nav">
        <button
          className="calendar-nav-arrow"
          aria-label="Önceki"
          onClick={goToPrevious}
        >
          ‹
        </button>

        <button className="calendar-nav-label" onClick={toggleViewMode}>
          {calendarViewMode === "month"
            ? calendarMonth.toLocaleDateString("tr-TR", {
              month: "long",
              year: "numeric",
            })
            : `${weekDays[0].toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
            })} - ${weekDays[6].toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
            })}`}
        </button>

        <button
          className="calendar-nav-arrow"
          aria-label="Sonraki"
          onClick={goToNext}
        >
          ›
        </button>
      </div>

      {calendarViewMode === "month" && (
        <div className="calendar-grid">
          {["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"].map((dayName) => (
            <div className="calendar-day-name" key={dayName}>
              {dayName}
            </div>
          ))}

          {Array.from({ length: calendarStartDay }).map((_, index) => (
            <div className="calendar-cell empty" key={`empty-${index}`} />
          ))}

          {calendarDays.map((day) => {
            const dateString = `${calendarYear}-${String(
              calendarMonthIndex + 1,
            ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayTasks = tasks.filter((task) => task.date === dateString);

            return (
              <CalendarCell
                key={day}
                dayLabel={day}
                dateString={dateString}
                dayTasks={dayTasks}
                quickAddDate={quickAddDate}
                quickAddTitle={quickAddTitle}
                setQuickAddDate={setQuickAddDate}
                setQuickAddTitle={setQuickAddTitle}
                submitQuickAdd={submitQuickAdd}
                setSelectedTaskId={setSelectedTaskId}
                primaryButtonClassName="btn btn-primary"
                cancelButtonClassName="btn btn-secondary"
                isToday={dateString === today}
                onShowMore={setExpandedDayDate}
              />
            );
          })}
        </div>
      )}

      {calendarViewMode === "week" && (
        <div className="calendar-grid calendar-grid-week">
          {weekDays.map((day) => (
            <div className="calendar-day-name" key={`name-${day}`}>
              {day.toLocaleDateString("tr-TR", { weekday: "short" })}
            </div>
          ))}

          {weekDays.map((day) => {
            const dateString = `${day.getFullYear()}-${String(
              day.getMonth() + 1,
            ).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
            const dayTasks = tasks.filter((task) => task.date === dateString);

            return (
              <CalendarCell
                key={dateString}
                dayLabel={day.getDate()}
                dateString={dateString}
                dayTasks={dayTasks}
                quickAddDate={quickAddDate}
                quickAddTitle={quickAddTitle}
                setQuickAddDate={setQuickAddDate}
                setQuickAddTitle={setQuickAddTitle}
                submitQuickAdd={submitQuickAdd}
                setSelectedTaskId={setSelectedTaskId}
                isToday={dateString === today}
                onShowMore={setExpandedDayDate}
              />
            );
          })}
        </div>
      )}
      <DayTasksModal
        dateString={expandedDayDate}
        tasks={tasks.filter((task) => task.date === expandedDayDate)}
        onClose={() => setExpandedDayDate(null)}
        onSelectTask={setSelectedTaskId}
      />
    </section>
  );
}

function CalendarCell({
  dayLabel,
  dateString,
  dayTasks,
  quickAddDate,
  quickAddTitle,
  setQuickAddDate,
  setQuickAddTitle,
  submitQuickAdd,
  setSelectedTaskId,
  primaryButtonClassName,
  cancelButtonClassName,
  isToday,
  onShowMore,
}) {
  const overflowThreshold = 4;
  const isOverflowing = dayTasks.length > overflowThreshold;
  const visibleTasks = isOverflowing ? dayTasks.slice(0, 3) : dayTasks.slice(0, 4);
  const hiddenCount = isOverflowing ? dayTasks.length - 3 : 0;

  return (
    <div
      className={
        isToday ? "calendar-cell calendar-cell-today" : "calendar-cell"
      }
    >
      <div className="calendar-cell-header">
        <strong>{dayLabel}</strong>
        <button
          className="calendar-add-button"
          aria-label="Bu güne görev ekle"
          onClick={() => {
            setQuickAddDate(dateString);
            setQuickAddTitle("");
          }}
        >
          +
        </button>
      </div>

      <div className="calendar-tasks">
        {visibleTasks.map((task) => (
          <div
            className={
              task.completed
                ? "calendar-task calendar-task-done"
                : "calendar-task"
            }
            key={task.id}
            onClick={() => setSelectedTaskId(task.id)}
          >
            {task.title}
          </div>
        ))}

        {hiddenCount > 0 && (
          <div
            className="calendar-task calendar-task-overflow"
            onClick={() => onShowMore(dateString)}
          >
            +{hiddenCount}
          </div>
        )}
      </div>

      {quickAddDate === dateString && (
        <div
          className="quick-add-panel"
          onClick={(event) => event.stopPropagation()}
        >
          <form onSubmit={submitQuickAdd}>
            <input
              type="text"
              autoFocus
              placeholder="Görev başlığı..."
              value={quickAddTitle}
              onChange={(event) => setQuickAddTitle(event.target.value)}
            />
            <div className="quick-add-actions">
              <button type="submit" className={primaryButtonClassName}>
                Ekle
              </button>
              <button
                type="button"
                className={cancelButtonClassName}
                onClick={() => setQuickAddDate(null)}
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
function DayTasksModal({ dateString, tasks, onClose, onSelectTask }) {
  if (!dateString) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{dateString}</h2>
          <button className="btn btn-secondary" onClick={onClose}>
            Kapat
          </button>
        </div>

        <ul className="day-tasks-list">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={
                task.completed
                  ? "day-tasks-list-item day-tasks-list-item-done"
                  : "day-tasks-list-item"
              }
              onClick={() => {
                onSelectTask(task.id);
                onClose();
              }}
            >
              {task.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
