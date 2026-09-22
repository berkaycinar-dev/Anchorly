import Statcard from "../components/Statcard";

function DashboardPage({
  greeting,
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
}) {
  return (
    <section className="dashboard-page">
      <div className="dashboard-welcome">
        <h2>{greeting}</h2>
        <p>
          Bugünkü {todayTasksCount} görevin var. {completedTodayTasksCount}{" "}
          tanesini tamamladın.
        </p>
      </div>

      <section className="stats">
        <Statcard title="Today's Task" value={allTaskCount} />
        <Statcard title="Completed" value={completedTasksCount} />
        <Statcard title="In Progress" value={activeTaskCount} />
        <Statcard title="Overdue" value={overdueTaskCount} />
      </section>

      <section className="dashboard-grid">
        <div className="chart-card">
          <h3>Bugünkü Görev Durumu</h3>

          <div
            className="pie-chart"
            style={{
              background: `conic-gradient(var(--color-accent) ${todayCompletionPercent}%, var(--color-border) 0)`,
            }}
          >
            <span>{todayCompletionPercent}%</span>
          </div>

          <p>
            {completedTodayTasksCount} / {todayTasksCount} tamamlandı
          </p>
          <div className="chart-legend">
            <span className="legend-dot legend-done"></span> Tamamlanan
            <span className="legend-dot legend-pending"></span> Bekleyen
          </div>
        </div>

        <div className="chart-card">
          <h3>Haftalık Productivity</h3>

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
                      {day.completed} / {day.total} rutin
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
