import { useState } from "react";

function TaskList({ tasks, toggleTask, deleteTask, onSelectTask }) {
  const [isCompletedOpen, setIsCompletedOpen] = useState(true);

  if (tasks.length === 0) {
    return <p className="empty-message">Görev bulunamadı.</p>;
  }

  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  function renderTaskCard(task) {
    return (
      <li
        key={task.id}
        className={task.completed ? "task-card completed-task" : "task-card"}
        onClick={() => onSelectTask(task.id)}
      >
        <input
          type="checkbox"
          className="task-checkbox"
          checked={task.completed}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            event.stopPropagation();
            toggleTask(task.id);
          }}
        />

        <div className="task-card-content">
          <span className="task-title">{task.title}</span>

          <div className="task-meta">
            <span className="task-badge task-badge-category">
              {task.category}
            </span>

            {task.date && (
              <span className="task-badge task-badge-date">{task.date}</span>
            )}
          </div>
        </div>

        <button
          className="task-delete-button"
          aria-label="Görevi sil"
          onClick={(event) => {
            event.stopPropagation();
            deleteTask(task.id);
          }}
        >
          ×
        </button>
      </li>
    );
  }

  return (
    <div className="task-list-container">
      <ul className="task-list">{activeTasks.map(renderTaskCard)}</ul>

      {completedTasks.length > 0 && (
        <div className="completed-section">
          <button
            className="completed-toggle"
            onClick={() => setIsCompletedOpen(!isCompletedOpen)}
          >
            <span
              className={isCompletedOpen ? "chevron chevron-open" : "chevron"}
            >
              ▸
            </span>
            Tamamlandı ({completedTasks.length})
          </button>

          {isCompletedOpen && (
            <ul className="task-list">{completedTasks.map(renderTaskCard)}</ul>
          )}
        </div>
      )}
    </div>
  );
}

export default TaskList;
