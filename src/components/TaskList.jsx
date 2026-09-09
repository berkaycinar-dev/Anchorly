import { useState } from "react";

function TaskList({
  tasks,
  toggleTask,
  deleteTask,
  onSelectTask,
  onReorderTasks,
}) {
  const [isCompletedOpen, setIsCompletedOpen] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  if (tasks.length === 0) {
    return <p className="empty-message">Görev bulunamadı.</p>;
  }

  const activeTasks = tasks
    .filter((task) => !task.completed)
    .sort((a, b) => a.order - b.order);

  const completedTasks = tasks.filter((task) => task.completed);

  function renderTaskCard(task, isDraggable) {
    return (
      <li
        key={task.id}
        className={
          task.completed
            ? "task-card completed-task"
            : draggedTaskId === String(task.id)
              ? "task-card task-card-dragging"
              : "task-card"
        }
        draggable={isDraggable}
        onClick={() => onSelectTask(task.id)}
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", String(task.id));
          setDraggedTaskId(String(task.id));
        }}
        onDragEnd={() => setDraggedTaskId(null)}
        onDragOver={(event) => {
          if (isDraggable) {
            event.preventDefault();
          }
        }}
        onDrop={(event) => {
          if (!isDraggable) {
            return;
          }
          event.preventDefault();
          const draggedId = event.dataTransfer.getData("text/plain");
          onReorderTasks(draggedId, task.id);
        }}
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

            {task.repeat !== "none" && (
              <span
                className="task-badge task-badge-repeat"
                title={
                  task.repeat === "daily"
                    ? "Her gün tekrarlanır"
                    : "Her hafta tekrarlanır"
                }
              >
                🔁
              </span>
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
      <ul className="task-list">
        {activeTasks.map((task) => renderTaskCard(task, true))}
      </ul>

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
            <ul className="task-list">
              {completedTasks.map((task) => renderTaskCard(task, false))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default TaskList;
