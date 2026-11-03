import {
  CELL_DOT_LIMIT,
  getCompletionPercent,
} from "../../utils/calendarHelpers";
import { getCategoryTone, limitList } from "../../utils/dashboardData";

const NO_TASKS = [];

function CalendarDayCell({
  cell,
  dayTasks,
  isSelected,
  isToday,
  isFuture,
  onSelectDate,
  locale,
  t,
}) {
  const percent = isFuture ? null : getCompletionPercent(dayTasks);
  const fullLabel = cell.date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const label =
    dayTasks.length > 0
      ? `${fullLabel}, ${t.calendarDayTaskCount(dayTasks.length)}`
      : fullLabel;
  const { shown, hidden } = limitList(dayTasks);

  return (
    <button
      type="button"
      className="calendar-cell"
      data-weekend={cell.isWeekend || undefined}
      data-today={isToday || undefined}
      aria-pressed={isSelected}
      aria-label={label}
      onClick={() => onSelectDate(cell.dateString)}
    >
      <span className="calendar-cell-head" aria-hidden="true">
        <span className="calendar-cell-number">{cell.date.getDate()}</span>
        {percent !== null && (
          <span className="calendar-cell-percent">
            {t.calendarPercent(percent)}
          </span>
        )}
      </span>

      {cell.isWeekend ? (
        dayTasks.length > 0 && (
          <span className="calendar-cell-dots" aria-hidden="true">
            {dayTasks.slice(0, CELL_DOT_LIMIT).map((task) => (
              <span
                key={task.id}
                className="calendar-dot"
                data-tone={getCategoryTone(task.category)}
                data-done={task.completed || undefined}
              />
            ))}
            {dayTasks.length > CELL_DOT_LIMIT && (
              <span className="calendar-cell-more">
                +{dayTasks.length - CELL_DOT_LIMIT}
              </span>
            )}
          </span>
        )
      ) : (
        <span className="calendar-cell-tasks" aria-hidden="true">
          {shown.map((task) => (
            <span
              key={task.id}
              className="calendar-cell-task"
              data-done={task.completed || undefined}
            >
              <span
                className="calendar-dot"
                data-tone={getCategoryTone(task.category)}
              />
              <span className="calendar-cell-task-title">{task.title}</span>
            </span>
          ))}
          {hidden > 0 && (
            <span className="calendar-cell-more">
              {t.calendarMoreTasks(hidden)}
            </span>
          )}
        </span>
      )}
    </button>
  );
}

function CalendarMonthGrid({
  cells,
  headers,
  tasksByDate,
  selectedDate,
  today,
  weekStartDay,
  onSelectDate,
  locale,
  t,
}) {
  return (
    <div className="calendar-grid" data-week-start={weekStartDay}>
      {headers.map((header) => (
        <div
          key={header.key}
          className="calendar-weekday"
          data-weekend={header.isWeekend || undefined}
          aria-hidden="true"
        >
          {header.label}
        </div>
      ))}

      {cells.map((cell) =>
        cell.inMonth ? (
          <CalendarDayCell
            key={cell.dateString}
            cell={cell}
            dayTasks={tasksByDate.get(cell.dateString) ?? NO_TASKS}
            isSelected={cell.dateString === selectedDate}
            isToday={cell.dateString === today}
            isFuture={cell.dateString > today}
            onSelectDate={onSelectDate}
            locale={locale}
            t={t}
          />
        ) : (
          <div
            key={cell.dateString}
            className="calendar-cell calendar-cell-outside"
            data-weekend={cell.isWeekend || undefined}
            aria-hidden="true"
          >
            <span className="calendar-cell-head">
              <span className="calendar-cell-number">
                {cell.date.getDate()}
              </span>
            </span>
          </div>
        ),
      )}
    </div>
  );
}

export default CalendarMonthGrid;
