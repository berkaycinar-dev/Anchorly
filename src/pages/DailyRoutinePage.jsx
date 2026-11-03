import { useState } from "react";
import RoutineDayView from "../components/RoutineDayView";
import RoutineWeekView from "../components/routine/RoutineWeekView";
import useMediaQuery, { WIDE_SCREEN_MEDIA_QUERY } from "../hooks/useMediaQuery";
import { parseLocalDate } from "../utils/dateHelpers";

export default function DailyRoutinePage({
  routineMonth,
  addRoutine,
  newRoutineTitle,
  setNewRoutineTitle,
  setRoutineMonth,
  routineYear,
  routineMonthIndex,
  routineDays,
  routines,
  deleteRoutine,
  routineChecks,
  getRoutineKey,
  toggleRoutineCheck,
  toggleRoutineForDate,
  getRoutineStreak,
  weekStartDay,
  t,
  language,
  today,
}) {
  const isWideScreen = useMediaQuery(WIDE_SCREEN_MEDIA_QUERY);
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const todayDate = parseLocalDate(today);
  const isCurrentMonth =
    routineYear === todayDate.getFullYear() &&
    routineMonthIndex === todayDate.getMonth();
  const todayDayNumber = todayDate.getDate();
  const monthKey = `${routineYear}-${routineMonthIndex}`;
  const defaultDay = isCurrentMonth ? todayDayNumber : 1;
  const [daySelection, setDaySelection] = useState({
    monthKey,
    day: defaultDay,
    direction: null,
  });
  const isDaySelectionCurrent = daySelection.monthKey === monthKey;
  const selectedDay = isDaySelectionCurrent
    ? Math.min(daySelection.day, routineDays.length)
    : defaultDay;
  const dayDirection = isDaySelectionCurrent ? daySelection.direction : null;

  function selectDay(day) {
    if (day === selectedDay) {
      return;
    }

    setDaySelection({
      monthKey,
      day,
      direction: day > selectedDay ? "forward" : "back",
    });
  }

  function goToPrevious() {
    setRoutineMonth(new Date(routineYear, routineMonthIndex - 1, 1));
  }

  function goToNext() {
    setRoutineMonth(new Date(routineYear, routineMonthIndex + 1, 1));
  }

  if (isWideScreen) {
    return (
      <section className="routine-page">
        <RoutineWeekView
          routines={routines}
          routineChecks={routineChecks}
          toggleRoutineForDate={toggleRoutineForDate}
          deleteRoutine={deleteRoutine}
          getRoutineStreak={getRoutineStreak}
          addRoutine={addRoutine}
          newRoutineTitle={newRoutineTitle}
          setNewRoutineTitle={setNewRoutineTitle}
          weekStartDay={weekStartDay}
          today={today}
          t={t}
          locale={locale}
        />
      </section>
    );
  }

  return (
    <section className="routine-page">
      <div className="calendar-nav">
        <button
          className="calendar-nav-arrow"
          aria-label={t.previousLabel}
          onClick={goToPrevious}
        >
          ‹
        </button>

        <span className="calendar-nav-label routine-nav-label">
          {routineMonth.toLocaleDateString(locale, {
            month: "long",
            year: "numeric",
          })}
        </span>

        <button
          className="calendar-nav-arrow"
          aria-label={t.nextLabel}
          onClick={goToNext}
        >
          ›
        </button>
      </div>

      <form className="routine-form" onSubmit={addRoutine}>
        <input
          type="text"
          enterKeyHint="done"
          autoComplete="off"
          aria-label={t.newRoutineLabel}
          placeholder={t.newRoutinePlaceholder}
          value={newRoutineTitle}
          onChange={(event) => setNewRoutineTitle(event.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          {t.addRoutineButton}
        </button>
      </form>

      <RoutineDayView
        routines={routines}
        routineDays={routineDays}
        routineYear={routineYear}
        routineMonthIndex={routineMonthIndex}
        selectedDay={selectedDay}
        onSelectDay={selectDay}
        transitionDirection={dayDirection}
        todayDayNumber={isCurrentMonth ? todayDayNumber : null}
        routineChecks={routineChecks}
        getRoutineKey={getRoutineKey}
        toggleRoutineCheck={toggleRoutineCheck}
        deleteRoutine={deleteRoutine}
        t={t}
        language={language}
      />
    </section>
  );
}
