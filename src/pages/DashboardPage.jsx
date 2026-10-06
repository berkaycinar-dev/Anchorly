import StatCard from "../components/StatCard";

function DashboardPage({
  greeting,
  dashboardMessage,
  todayTasksCount,
  completedTodayTasksCount,
  allTaskCount,
  completedTasksCount,
  activeTaskCount,
  overdueTaskCount,
  todayCompletionPercent,
  weeklyProductivity,
  hoveredDayIndex,
  setHoveredDayIndex,
  t,
}) {
  return (
    <section className="dashboard-page">
      <div className="dashboard-welcome">
        <h2>{greeting}</h2>
        <p>{dashboardMessage}</p>
      </div>

      <section className="stats">
        <StatCard title={t.statToday} value={allTaskCount} />
        <StatCard title={t.statCompleted} value={completedTasksCount} />
        <StatCard title={t.statInProgress} value={activeTaskCount} />
        <StatCard title={t.statOverdue} value={overdueTaskCount} />
      </section>

      <section className="dashboard-grid">
        <div className="chart-card">
          <h3>{t.todayStatusChart}</h3>

          <div
            className="pie-chart"
            style={{
              background: `conic-gradient(var(--color-accent) ${todayCompletionPercent}%, var(--color-border) 0)`,
            }}
          >
            <span>{todayCompletionPercent}%</span>
          </div>

          <p>
            {completedTodayTasksCount} / {todayTasksCount} {t.completedOfTotal}
          </p>
          <div className="chart-legend">
            <span className="legend-dot legend-done"></span> {t.completedLegend}
            <span className="legend-dot legend-pending"></span> {t.pendingLegend}
          </div>
        </div>

        <div className="chart-card">
          <h3>{t.weeklyProductivity}</h3>

          <div className="weekly-chart">
            {weeklyProductivity.map((day, index) => (
              <div
                className="weekly-bar-wrapper"
                key={index}
                onMouseEnter={() => setHoveredDayIndex(index)}
                onMouseLeave={() => setHoveredDayIndex(null)}
              >
                {hoveredDayIndex === index && (
                  <div className="weekly-bar-tooltip">
                    <strong>{day.fullDate}</strong>
                    <span>
                      {day.completed} / {day.total} {t.routineTooltipSuffix}
                    </span>
                    <span>%{day.percent}</span>
                  </div>
                )}

                <div
                  className="weekly-bar"
                  style={{ height: `${day.percent}%` }}
                ></div>
                <span>{day.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}

export default DashboardPage;
