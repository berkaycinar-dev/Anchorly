import { useState } from "react";
import TaskList from "../TaskList";
import { isOneTimeTask } from "../../utils/archiveSeries";

const FILTERS = [
  { value: "all", labelKey: "oneTimeFilterAll" },
  { value: "todo", labelKey: "oneTimeFilterTodo" },
  { value: "done", labelKey: "oneTimeFilterDone" },
];

function OneTimeTasks({
  tasks,
  toggleTask,
  deleteTask,
  onSelectTask,
  onReorderTasks,
  t,
}) {
  const [filter, setFilter] = useState("all");

  const visibleTasks = tasks.filter((task) => {
    if (!isOneTimeTask(task)) {
      return false;
    }

    if (filter === "todo") {
      return !task.completed;
    }

    if (filter === "done") {
      return task.completed;
    }

    return true;
  });

  return (
    <div className="archive-one-time">
      <div
        className="segmented archive-one-time-filter"
        role="group"
        aria-label={t.oneTimeFilterLabel}
      >
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
          >
            {t[option.labelKey]}
          </button>
        ))}
      </div>

      {visibleTasks.length === 0 && filter !== "all" ? (
        <div className="empty-state">
          <span className="empty-state-icon">📋</span>
          <p className="empty-state-title">{t.oneTimeEmptyTitle}</p>
          <p className="empty-state-subtitle">{t.oneTimeEmptySubtitle}</p>
        </div>
      ) : (
        <TaskList
          tasks={visibleTasks}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
          onSelectTask={onSelectTask}
          onReorderTasks={onReorderTasks}
          t={t}
        />
      )}
    </div>
  );
}

export default OneTimeTasks;
