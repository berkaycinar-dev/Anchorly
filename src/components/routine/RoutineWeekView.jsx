import { useState } from "react";
import { Plus } from "lucide-react";
import Icon from "../Icon";
import RoutineCard from "./RoutineCard";
import RoutineSummary from "./RoutineSummary";
import RoutineWeekStrip from "./RoutineWeekStrip";
import {
  addDaysToDateString,
  getLocalDateString,
  getWeekDays,
  parseLocalDate,
} from "../../utils/dateHelpers";
import {
  getDayProgress,
  getLongestActiveStreak,
  getMonthAverage,
  getRoutineHistory,
  getRoutineMonthProgress,
  isRoutineCheckedOn,
} from "../../utils/routineStats";

const HISTORY_LENGTH = 14;

export default function RoutineWeekView({
  routines,
  routineChecks,
  toggleRoutineForDate,
  deleteRoutine,
  getRoutineStreak,
  addRoutine,
  newRoutineTitle,
  setNewRoutineTitle,
  weekStartDay,
  today,
  t,
  locale,
}) {
  const [selection, setSelection] = useState({
    today,
    date: today,
    direction: null,
  });
  const isSelectionCurrent = selection.today === today;
  const selectedDate = isSelectionCurrent ? selection.date : today;
  const direction = isSelectionCurrent ? selection.direction : null;
  const transitionClassName = direction
    ? ` routine-transition-${direction}`
    : "";
  const isTodaySelected = selectedDate === today;
  const selectedDateValue = parseLocalDate(selectedDate);

  const weekDays = getWeekDays(selectedDateValue, weekStartDay).map((value) => {
    const date = getLocalDateString(value);

    return {
      date,
      value,
      progress: getDayProgress(routines, routineChecks, date),
    };
  });

  function selectDate(date) {
    if (date === selectedDate) {
      return;
    }

    setSelection({
      today,
      date,
      direction: date > selectedDate ? "forward" : "back",
    });
  }

  const selectedDateText = `${selectedDateValue.toLocaleDateString(locale, {
    weekday: "long",
  })}, ${selectedDateValue.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;

  const routineListTitle = isTodaySelected
    ? t.todayRoutinesTitle
    : t.dayRoutinesTitle(
        selectedDateValue.toLocaleDateString(locale, {
          day: "numeric",
          month: "long",
        }),
      );

  return (
    <div className="routine-week-view">
      <div className="routine-toolbar">
        <p className="routine-toolbar-date">{selectedDateText}</p>

        {!isTodaySelected && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => selectDate(today)}
          >
            {t.backToTodayButton}
          </button>
        )}
      </div>

      <RoutineWeekStrip
        days={weekDays}
        selectedDate={selectedDate}
        today={today}
        onSelectDate={selectDate}
        onPreviousWeek={() => selectDate(addDaysToDateString(selectedDate, -7))}
        onNextWeek={() => selectDate(addDaysToDateString(selectedDate, 7))}
        direction={direction}
        t={t}
        locale={locale}
      />

      <div
        key={selectedDate}
        className={`routine-day-panel${transitionClassName}`}
      >
        <RoutineSummary
          isToday={isTodaySelected}
          dayProgress={getDayProgress(routines, routineChecks, selectedDate)}
          longestStreak={getLongestActiveStreak(routines, routineChecks, today)}
          monthAverage={getMonthAverage(routines, routineChecks, today)}
          monthName={parseLocalDate(today).toLocaleDateString(locale, {
            month: "long",
          })}
          t={t}
        />

        <div className="routine-list-header">
          <h3 className="routine-list-title">{routineListTitle}</h3>
          <span className="routine-list-hint">
            {t.lastDaysLabel(HISTORY_LENGTH)}
          </span>
        </div>

        {routines.length === 0 && (
          <div className="empty-state">
            <p className="empty-state-title">{t.emptyRoutineTitle}</p>
            <p className="empty-state-subtitle">{t.emptyRoutineWideSubtitle}</p>
          </div>
        )}

        <div className="routine-card-grid">
          {routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              checked={isRoutineCheckedOn(
                routineChecks,
                routine.id,
                selectedDate,
              )}
              onToggle={() => toggleRoutineForDate(routine.id, selectedDate)}
              onDelete={() => deleteRoutine(routine.id)}
              streak={getRoutineStreak(routine.id)}
              history={getRoutineHistory(
                routineChecks,
                routine.id,
                selectedDate,
                HISTORY_LENGTH,
              ).map((day) => ({
                ...day,
                isSelected: day.date === selectedDate,
              }))}
              monthProgress={getRoutineMonthProgress(
                routineChecks,
                routine.id,
                selectedDate,
              )}
              t={t}
            />
          ))}

          <form className="routine-add-tile" onSubmit={addRoutine}>
            <Plus
              className="routine-add-tile-icon"
              size={18}
              strokeWidth={2}
              aria-hidden="true"
            />
            <input
              type="text"
              enterKeyHint="done"
              autoComplete="off"
              aria-label={t.newRoutineLabel}
              placeholder={t.newRoutinePlaceholder}
              value={newRoutineTitle}
              onChange={(event) => setNewRoutineTitle(event.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary btn-icon"
              aria-label={t.addButton}
              title={t.addButton}
            >
              <Icon icon={Plus} size="lg" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
