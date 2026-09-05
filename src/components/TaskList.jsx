function TaskList({ tasks, toggleTask, deleteTask, onSelectTask }) {
  if (tasks.length === 0) {
    return <p className="empty-message">Görev bulunamadı.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li
          key={task.id}
          className={task.completed ? "completed-task" : ""}
          onClick={() => onSelectTask(task.id)}
        >
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(event) => {
              event.stopPropagation();
              toggleTask(task.id);
            }}
          />
          <span>{task.title}</span>
          <span>{task.category}</span>
          <span>{task.date}</span>
          <button
            onClick={(event) => {
              event.stopPropagation();
              deleteTask(task.id);
            }}
          >
            Sil
          </button>
        </li>
      ))}
    </ul>
  );
}

export default TaskList;