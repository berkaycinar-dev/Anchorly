import TaskList from "../components/TaskList";

export default function ArchivePage({
  archiveStatusFilter,
  setArchiveStatusFilter,
  archiveStartDate,
  setArchiveStartDate,
  archiveEndDate,
  setArchiveEndDate,
  filteredArchiveTasks,
  toggleTask,
  deleteTask,
  setSelectedTaskId,
  reorderTasks,
  t,
}) {
  return (
    <section className="archive-page">
      <div className="dashboard-welcome">
        <h2>{t.archivePageTitle}</h2>
        <p>{t.archivePageDescription}</p>
      </div>

      <div className="archive-filters">
        <select
          aria-label={t.archiveStatusLabel}
          value={archiveStatusFilter}
          onChange={(event) => setArchiveStatusFilter(event.target.value)}
        >
          <option value="all">{t.statusAll}</option>
          <option value="active">{t.statusActive}</option>
          <option value="completed">{t.statusCompleted}</option>
        </select>

        <input
          type="date"
          aria-label={t.archiveStartDateLabel}
          value={archiveStartDate}
          onChange={(event) => setArchiveStartDate(event.target.value)}
        />

        <input
          type="date"
          aria-label={t.archiveEndDateLabel}
          value={archiveEndDate}
          onChange={(event) => setArchiveEndDate(event.target.value)}
        />

        <button
          type="button"
          onClick={() => {
            setArchiveStatusFilter("all");
            setArchiveStartDate("");
            setArchiveEndDate("");
          }}
        >
          {t.clearFilters}
        </button>
      </div>

      <TaskList
        tasks={filteredArchiveTasks}
        toggleTask={toggleTask}
        deleteTask={deleteTask}
        onSelectTask={setSelectedTaskId}
        onReorderTasks={reorderTasks}
        t={t}
      />
    </section>
  );
} 