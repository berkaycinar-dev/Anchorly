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
}) {
  return (
    <section className="archive-page">
      <div className="dashboard-welcome">
        <h2>Arşiv</h2>
        <p>Bugüne kadar eklenmiş ve silinmemiş tüm görevler burada listelenir.</p>
      </div>

      <div className="archive-filters">
        <select
          value={archiveStatusFilter}
          onChange={(event) => setArchiveStatusFilter(event.target.value)}
        >
          <option value="all">Tüm Durumlar</option>
          <option value="active">Devam Eden</option>
          <option value="completed">Tamamlanan</option>
        </select>

        <input
          type="date"
          value={archiveStartDate}
          onChange={(event) => setArchiveStartDate(event.target.value)}
        />

        <input
          type="date"
          value={archiveEndDate}
          onChange={(event) => setArchiveEndDate(event.target.value)}
        />

        <button
          onClick={() => {
            setArchiveStatusFilter("all");
            setArchiveStartDate("");
            setArchiveEndDate("");
          }}
        >
          Temizle
        </button>
      </div>

      <TaskList
        tasks={filteredArchiveTasks}
        toggleTask={toggleTask}
        deleteTask={deleteTask}
        onSelectTask={setSelectedTaskId}
        onReorderTasks={reorderTasks}
      />
    </section>
  );
}