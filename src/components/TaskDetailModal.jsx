import { useState } from "react";

function TaskDetailModal({
  task,
  onClose,
  onUpdateDescription,
  onAddStep,
  onToggleStep,
  onDeleteStep,
  onUpdateRepeat,
}) {
  const [newStepText, setNewStepText] = useState("");

  if (!task) {
    return null;
  }

  function handleAddStep(event) {
    event.preventDefault();
    onAddStep(task.id, newStepText);
    setNewStepText("");
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{task.title}</h2>
          <button onClick={onClose}>Kapat</button>
        </div>

        <label>Açıklama</label>
        <textarea
          value={task.description || ""}
          onChange={(event) => onUpdateDescription(task.id, event.target.value)}
          placeholder="Bu görev hakkında not ekle..."
        />

        <label>Tekrar</label>
        <select
          className="task-repeat-select"
          value={task.repeat || "none"}
          onChange={(event) => onUpdateRepeat(task.id, event.target.value)}
        >
          <option value="none">Tekrarlanmaz</option>
          <option value="daily">Her gün</option>
          <option value="weekly">Her hafta</option>
        </select>

        <label>Adımlar</label>
        <ul className="task-steps-list">
          {(task.steps || []).map((step) => (
            <li key={step.id}>
              <input
                type="checkbox"
                checked={step.done}
                onChange={() => onToggleStep(task.id, step.id)}
              />
              <span className={step.done ? "step-done" : ""}>{step.text}</span>
              <button onClick={() => onDeleteStep(task.id, step.id)}>
                Sil
              </button>
            </li>
          ))}
        </ul>

        <form className="task-step-form" onSubmit={handleAddStep}>
          <input
            type="text"
            placeholder="Yeni adım ekle..."
            value={newStepText}
            onChange={(event) => setNewStepText(event.target.value)}
          />
          <button type="submit">Ekle</button>
        </form>
      </div>
    </div>
  );
}

export default TaskDetailModal;
