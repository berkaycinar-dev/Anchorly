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
}) {
  return (
    <section className="calendar-page">
      <div className="routine-header">
        <div>
          <h2>Takvim</h2>
          <p>
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
          </p>
        </div>

        <div className="routine-month-actions">
          <button
            className={calendarViewMode === "month" ? "active-view-toggle" : ""}
            onClick={() => setCalendarViewMode("month")}
          >
            Aylık
          </button>

          <button
            className={calendarViewMode === "week" ? "active-view-toggle" : ""}
            onClick={() => setCalendarViewMode("week")}
          >
            Haftalık
          </button>

          {calendarViewMode === "month" && (
            <>
              <button
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarYear, calendarMonthIndex - 1, 1),
                  )
                }
              >
                Önceki Ay
              </button>

              <button
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarYear, calendarMonthIndex + 1, 1),
                  )
                }
              >
                Sonraki Ay
              </button>
            </>
          )}

          {calendarViewMode === "week" && (
            <>
              <button
                onClick={() => {
                  const newDate = new Date(calendarWeekStart);
                  newDate.setDate(newDate.getDate() - 7);
                  setCalendarWeekStart(newDate);
                }}
              >
                Önceki Hafta
              </button>

              <button
                onClick={() => {
                  const newDate = new Date(calendarWeekStart);
                  newDate.setDate(newDate.getDate() + 7);
                  setCalendarWeekStart(newDate);
                }}
              >
                Sonraki Hafta
              </button>
            </>
          )}
        </div>
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
              />
            );
          })}
        </div>
      )}
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
}) {
  return (
    <div className="calendar-cell">
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
        {dayTasks.map((task) => (
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
