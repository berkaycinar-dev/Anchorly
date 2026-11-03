import { useMemo, useState } from "react";
import OneTimeTasks from "../components/archive/OneTimeTasks";
import SeriesDetail from "../components/archive/SeriesDetail";
import SeriesList from "../components/archive/SeriesList";
import { buildSeriesList } from "../utils/archiveSeries";

const TABS = [
  { value: "series", labelKey: "archiveTabSeries" },
  { value: "oneTime", labelKey: "archiveTabOneTime" },
];

export default function ArchivePage({
  tasks,
  today,
  selectedSeriesId,
  toggleTask,
  deleteTask,
  setSelectedTaskId,
  reorderTasks,
  t,
}) {
  const [tab, setTab] = useState("series");
  const seriesList = useMemo(
    () => buildSeriesList(tasks, today),
    [tasks, today],
  );
  const selectedSeries = selectedSeriesId
    ? seriesList.find((series) => series.id === selectedSeriesId)
    : null;

  if (selectedSeries) {
    return (
      <SeriesDetail
        key={selectedSeries.id}
        series={selectedSeries}
        today={today}
        toggleTask={toggleTask}
        onSelectTask={setSelectedTaskId}
        t={t}
      />
    );
  }

  return (
    <section className="archive-page">
      <div className="dashboard-welcome">
        <h2>{t.archivePageTitle}</h2>
        <p>{t.archivePageDescription}</p>
      </div>

      <div
        className="archive-tabs"
        role="tablist"
        aria-label={t.archiveTabsLabel}
      >
        {TABS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            id={`archive-tab-${option.value}`}
            aria-selected={tab === option.value}
            aria-controls="archive-tab-panel"
            onClick={() => setTab(option.value)}
          >
            {t[option.labelKey]}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id="archive-tab-panel"
        aria-labelledby={`archive-tab-${tab}`}
      >
        {tab === "series" ? (
          <SeriesList seriesList={seriesList} t={t} />
        ) : (
          <OneTimeTasks
            tasks={tasks}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            onSelectTask={setSelectedTaskId}
            onReorderTasks={reorderTasks}
            t={t}
          />
        )}
      </div>
    </section>
  );
}
