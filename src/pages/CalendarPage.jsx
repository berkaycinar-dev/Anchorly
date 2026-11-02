import { useId, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CalendarAgenda from "../components/CalendarAgenda";
import CalendarDayPanel from "../components/calendar/CalendarDayPanel";
import CalendarMonthGrid from "../components/calendar/CalendarMonthGrid";
import Icon from "../components/Icon";
import {
  getDefaultSelectedDate,
  getMonthGridCells,
  getWeekdayHeaders,
  groupTasksByDate,
} from "../utils/calendarHelpers";
import { getWeekdayLabels } from "../utils/dashboardData";
import { parseLocalDate } from "../utils/dateHelpers";

const NO_TASKS = [];

export default function CalendarPage({
  calendarMonth,
  setCalendarMonth,
  tasks,
  today,
  weekStartDay,
  t,
  language,
  onToggleTask,
  onOpenTask,
  onAddTask,
}) {
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const panelId = useId();
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const year = calendarMonth.getFullYear();
  const monthIndex = calendarMonth.getMonth();
  const [selectedDate, setSelectedDate] = useState(() =>
    getDefaultSelectedDate(year, monthIndex, today),
  );

  const cells = getMonthGridCells(year, monthIndex, weekStartDay);
  const monthDates = cells
    .filter((cell) => cell.inMonth)
    .map((cell) => cell.date);
  const leadingBlankCount = cells.findIndex((cell) => cell.inMonth);
  const tasksByDate = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const monthTitle = calendarMonth.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  function showMonth(date) {
    setCalendarMonth(date);
    setSelectedDate(
      getDefaultSelectedDate(date.getFullYear(), date.getMonth(), today),
    );
  }

  return (
    <section className="calendar-page">
      <header className="calendar-toolbar">
        <h3 className="calendar-month-title" aria-live="polite">
          {monthTitle}
        </h3>
        <div className="calendar-toolbar-actions">
          <button
            type="button"
            className="calendar-icon-button"
            aria-label={t.previousLabel}
            onClick={() => showMonth(new Date(year, monthIndex - 1, 1))}
          >
            <Icon icon={ChevronLeft} />
          </button>
          <button
            type="button"
            className="calendar-icon-button"
            aria-label={t.nextLabel}
            onClick={() => showMonth(new Date(year, monthIndex + 1, 1))}
          >
            <Icon icon={ChevronRight} />
          </button>
          <button
            type="button"
            className="calendar-today-button"
            onClick={() => showMonth(parseLocalDate(today))}
          >
            {t.calendarTodayButton}
          </button>
        </div>
      </header>

      <div className="calendar-desktop">
        <CalendarMonthGrid
          cells={cells}
          headers={getWeekdayHeaders(weekStartDay, locale)}
          tasksByDate={tasksByDate}
          selectedDate={selectedDate}
          today={today}
          weekStartDay={weekStartDay}
          onSelectDate={setSelectedDate}
          locale={locale}
          t={t}
        />
        <CalendarDayPanel
          key={selectedDate}
          id={panelId}
          dateString={selectedDate}
          tasks={tasksByDate.get(selectedDate) ?? NO_TASKS}
          isOpen={isPanelOpen}
          isToday={selectedDate === today}
          locale={locale}
          t={t}
          onToggle={() => setIsPanelOpen((open) => !open)}
          onToggleTask={onToggleTask}
          onOpenTask={onOpenTask}
          onAddTask={onAddTask}
        />
      </div>

      <CalendarAgenda
        dates={monthDates}
        leadingBlankCount={leadingBlankCount}
        weekdayNames={getWeekdayLabels(weekStartDay, locale)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        tasks={tasks}
        today={today}
        onSelectTask={onOpenTask}
        onAddTask={onAddTask}
        t={t}
        language={language}
      />
    </section>
  );
}
