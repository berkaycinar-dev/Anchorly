import { useState } from "react";
import RoutineDayView from "../components/RoutineDayView";
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
  t,
  language,
  today,
}) {
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
  });
  const selectedDay =
    daySelection.monthKey === monthKey
      ? Math.min(daySelection.day, routineDays.length)
      : defaultDay;

  function selectDay(day) {
    setDaySelection({ monthKey, day });
  }

  function goToPrevious() {
    setRoutineMonth(new Date(routineYear, routineMonthIndex - 1, 1));
  }

  function goToNext() {
    setRoutineMonth(new Date(routineYear, routineMonthIndex + 1, 1));
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
          {routineMonth.toLocaleDateString(
            language === "tr" ? "tr-TR" : "en-US",
            {
              month: "long",
              year: "numeric",
            },
          )}
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
        todayDayNumber={isCurrentMonth ? todayDayNumber : null}
        routineChecks={routineChecks}
        getRoutineKey={getRoutineKey}
        toggleRoutineCheck={toggleRoutineCheck}
        deleteRoutine={deleteRoutine}
        t={t}
        language={language}
      />

      <div className="routine-table-wrapper">
        <table className="routine-table">
          <thead>
            <tr>
              <th>{t.routineColumnHeader}</th>
              {routineDays.map((day) => (
                <th
                  key={day}
                  className={
                    isCurrentMonth && day === todayDayNumber
                      ? "routine-today-col"
                      : ""
                  }
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {routines.map((routine) => (
              <tr key={routine.id}>
                <td>
                  <div className="routine-name-cell">
                    <span>{routine.title}</span>
                    <button
                      type="button"
                      className="routine-delete-button"
                      aria-label={t.deleteRoutineLabel(routine.title)}
                      onClick={() => deleteRoutine(routine.id)}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>
                </td>

                {routineDays.map((day) => (
                  <td
                    key={day}
                    className={
                      isCurrentMonth && day === todayDayNumber
                        ? "routine-today-col"
                        : ""
                    }
                  >
                    <input
                      type="checkbox"
                      className="themed-checkbox"
                      aria-label={t.routineDayCheckLabel(routine.title, day)}
                      checked={Boolean(
                        routineChecks[getRoutineKey(routine.id, day)],
                      )}
                      onChange={() => toggleRoutineCheck(routine.id, day)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}