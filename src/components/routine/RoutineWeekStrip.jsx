import { ChevronLeft, ChevronRight } from "lucide-react";
const RING_RADIUS = 17;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function DayRing({ percent, label }) {
  return (
    <span className="routine-week-ring" aria-hidden="true">
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle
          className="routine-week-ring-track"
          cx="22"
          cy="22"
          r={RING_RADIUS}
        />
        {percent > 0 && (
          <circle
            className="routine-week-ring-value"
            cx="22"
            cy="22"
            r={RING_RADIUS}
            strokeDasharray={`${(RING_LENGTH * percent) / 100} ${RING_LENGTH}`}
            transform="rotate(-90 22 22)"
          />
        )}
      </svg>
      <span className="routine-week-ring-label">{label}</span>
    </span>
  );
}

export default function RoutineWeekStrip({
  days,
  selectedDate,
  today,
  onSelectDate,
  onPreviousWeek,
  onNextWeek,
  direction,
  t,
  locale,
}) {
  return (
    <div className="routine-week">
      <button
        type="button"
        className="routine-week-arrow"
        aria-label={t.previousWeekLabel}
        onClick={onPreviousWeek}
      >
        <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
      </button>

      <div
        key={days[0].date}
        className={
          direction
            ? `routine-week-days routine-transition-${direction}`
            : "routine-week-days"
        }
        role="group"
        aria-label={t.routineDayPickerLabel}
      >
        {days.map((day) => {
          const classNames = ["routine-week-day"];

          if (day.date === today) {
            classNames.push("routine-week-day-today");
          }

          return (
            <button
              key={day.date}
              type="button"
              className={classNames.join(" ")}
              aria-pressed={day.date === selectedDate}
              aria-label={t.routineDayButtonLabel(
                day.value.toLocaleDateString(locale, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }),
                day.progress.completed,
                day.progress.total,
              )}
              onClick={() => onSelectDate(day.date)}
            >
              <span className="routine-week-weekday" aria-hidden="true">
                {day.value.toLocaleDateString(locale, { weekday: "short" })}
              </span>
              <DayRing
                percent={day.progress.percent}
                label={day.value.getDate()}
              />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="routine-week-arrow"
        aria-label={t.nextWeekLabel}
        onClick={onNextWeek}
      >
        <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
