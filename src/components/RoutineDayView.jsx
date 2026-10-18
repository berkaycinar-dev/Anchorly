import { useLayoutEffect, useRef } from "react";

function RoutineDayView({
  routines,
  routineDays,
  routineYear,
  routineMonthIndex,
  selectedDay,
  onSelectDay,
  todayDayNumber,
  routineChecks,
  getRoutineKey,
  toggleRoutineCheck,
  deleteRoutine,
  t,
  language,
}) {
  const stripRef = useRef(null);
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const monthKey = `${routineYear}-${routineMonthIndex}`;

  useLayoutEffect(() => {
    const strip = stripRef.current;
    const selectedButton = strip?.querySelector('[aria-pressed="true"]');

    if (!selectedButton) {
      return;
    }

    strip.scrollLeft =
      selectedButton.offsetLeft -
      strip.clientWidth / 2 +
      selectedButton.offsetWidth / 2;
  }, [monthKey]);

  function isChecked(routineId, day) {
    return Boolean(routineChecks[getRoutineKey(routineId, day)]);
  }

  function isDayComplete(day) {
    return (
      routines.length > 0 &&
      routines.every((routine) => isChecked(routine.id, day))
    );
  }

  function getMonthProgress(routineId) {
    return routineDays.filter((day) => isChecked(routineId, day)).length;
  }

  function getDayButtonClassName(day) {
    const classNames = ["routine-day-button"];

    if (day === todayDayNumber) {
      classNames.push("routine-day-button-today");
    }

    return classNames.join(" ");
  }

  return (
    <div className="routine-day-view">
      <div
        ref={stripRef}
        className="routine-day-strip"
        role="group"
        aria-label={t.routineDayPickerLabel}
      >
        {routineDays.map((day) => {
          const date = new Date(routineYear, routineMonthIndex, day);

          return (
            <button
              key={day}
              type="button"
              className={getDayButtonClassName(day)}
              aria-pressed={day === selectedDay}
              aria-label={date.toLocaleDateString(locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              onClick={() => onSelectDay(day)}
            >
              <span className="routine-day-weekday" aria-hidden="true">
                {date.toLocaleDateString(locale, { weekday: "short" })}
              </span>
              <span className="routine-day-number" aria-hidden="true">
                {day}
              </span>
              <span
                className={
                  isDayComplete(day)
                    ? "routine-day-dot routine-day-dot-visible"
                    : "routine-day-dot"
                }
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      {routines.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">{t.emptyRoutineTitle}</p>
          <p className="empty-state-subtitle">{t.emptyRoutineSubtitle}</p>
        </div>
      ) : (
        <ul className="routine-day-list">
          {routines.map((routine) => {
            const checked = isChecked(routine.id, selectedDay);

            return (
              <li
                key={routine.id}
                className={
                  checked
                    ? "routine-day-item routine-day-item-done"
                    : "routine-day-item"
                }
              >
                <label className="routine-day-check">
                  <input
                    type="checkbox"
                    className="themed-checkbox"
                    checked={checked}
                    onChange={() => toggleRoutineCheck(routine.id, selectedDay)}
                  />
                  <span className="routine-day-title">{routine.title}</span>
                </label>

                <span className="routine-day-progress">
                  {t.routineMonthProgress(
                    getMonthProgress(routine.id),
                    routineDays.length,
                  )}
                </span>

                <button
                  type="button"
                  className="routine-day-delete"
                  aria-label={t.deleteRoutineLabel(routine.title)}
                  onClick={() => deleteRoutine(routine.id)}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default RoutineDayView;