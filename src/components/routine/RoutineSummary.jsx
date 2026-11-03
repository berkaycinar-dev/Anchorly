export default function RoutineSummary({
  isToday,
  dayProgress,
  longestStreak,
  monthAverage,
  monthName,
  t,
}) {
  return (
    <div className="routine-summary">
      <section className="routine-summary-card">
        <h3 className="routine-summary-title">
          {isToday ? t.todayProgressTitle : t.selectedDayProgressTitle}
        </h3>
        <p className="routine-summary-value">
          {`${dayProgress.completed} / ${dayProgress.total}`}
          <span className="routine-summary-unit">{t.routineUnit}</span>
        </p>
        <span className="routine-summary-track" aria-hidden="true">
          <span
            className="routine-summary-bar"
            style={{ width: `${dayProgress.percent}%` }}
          />
        </span>
      </section>

      <section className="routine-summary-card">
        <h3 className="routine-summary-title">{t.longestStreakTitle}</h3>
        <p className="routine-summary-value">
          {longestStreak ? t.streakDays(longestStreak.streak) : t.noStreak}
          {longestStreak && (
            <span className="routine-summary-unit">
              {longestStreak.routine.title}
            </span>
          )}
        </p>
      </section>

      <section className="routine-summary-card">
        <h3 className="routine-summary-title">
          {t.monthAverageTitle(monthName)}
        </h3>
        <p className="routine-summary-value">
          {t.formatPercent(monthAverage)}
          <span className="routine-summary-unit">{t.completionUnit}</span>
        </p>
      </section>
    </div>
  );
}
