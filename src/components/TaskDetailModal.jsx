import { useState, useEffect } from "react";

function TaskDetailModal({
  task,
  onClose,
  onToggleTask,
  onUpdateTitle,
  onUpdateDate,
  onUpdateDescription,
  onAddStep,
  onToggleStep,
  onDeleteStep,
  onUpdateRepeat,
  onAddAttachment,
  onDeleteAttachment,
  projects,
  onAssignProject,
  onDeleteTask,
  t,
}) {
  
  const [newStepText, setNewStepText] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (task) {
      setEditedTitle(task.title);
      setIsEditingTitle(false);
      setIsDeleteConfirmOpen(false);
    }
  }, [task?.id]);

  if (!task) {
    return null;
  }

  function handleAddStep(event) {
    event.preventDefault();
    onAddStep(task.id, newStepText);
    setNewStepText("");
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const maxSizeInBytes = 1024 * 1024; // 1 MB

    if (file.size > maxSizeInBytes) {
      alert(
        "Bu dosya çok büyük (1MB üzeri). Tarayıcı depolama alanı sınırlı olduğu için daha küçük bir dosya seçmelisin.",
      );
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      onAddAttachment(task.id, {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        data: reader.result,
      });
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function startEditingTitle() {
    setEditedTitle(task.title);
    setIsEditingTitle(true);
  }

  function saveTitle() {
    const trimmedTitle = editedTitle.trim();

    if (trimmedTitle === "") {
      setEditedTitle(task.title);
      setIsEditingTitle(false);
      return;
    }

    onUpdateTitle(task.id, trimmedTitle);
    setIsEditingTitle(false);
  }

  function handleTitleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveTitle();
    }

    if (event.key === "Escape") {
      setEditedTitle(task.title);
      setIsEditingTitle(false);
    }
  }

    function handleDeleteTask() {
    setIsDeleteConfirmOpen(true);
  }

  function confirmDeleteTask() {
    onDeleteTask(task.id);
    onClose();
  }

  function cancelDeleteTask() {
    setIsDeleteConfirmOpen(false);
  }


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-complete-toggle">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggleTask(task.id)}
            />

            {isEditingTitle ? (
              <input
                type="text"
                className="modal-title-input"
                value={editedTitle}
                autoFocus
                onChange={(event) => setEditedTitle(event.target.value)}
                onBlur={saveTitle}
                onKeyDown={handleTitleKeyDown}
              />
            ) : (
              <h2
                className={task.completed ? "modal-title-done" : ""}
                onDoubleClick={startEditingTitle}
                title="Değiştirmek için çift tıkla"
              >
                {task.title}
              </h2>
            )}
          </div>

                   <div className="modal-header-actions">
            <button
              className="btn btn-danger"
              onClick={handleDeleteTask}
              aria-label="Görevi sil"
            >
              Sil
            </button>

            <button className="btn btn-secondary" onClick={onClose}>
              Kapat
            </button>
          </div>
        
        </div>

        <label>Açıklama</label>
        <textarea
          value={task.description || ""}
          onChange={(event) => onUpdateDescription(task.id, event.target.value)}
          placeholder="Bu görev hakkında not ekle..."
        />

        <label>Tarih</label>
        <div className="detail-date-row">
          <input
            type="date"
            value={task.date || ""}
            onChange={(event) => onUpdateDate(task.id, event.target.value)}
          />

          {task.date && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onUpdateDate(task.id, "")}
            >
              Tarihi kaldır
            </button>
          )}
        </div>

        <label>Tekrar</label>
        <select
          className="task-repeat-select"
          value={task.repeat || "none"}
          disabled={!task.date}
          onChange={(event) => onUpdateRepeat(task.id, event.target.value)}
        >
          <option value="none">Tekrarlanmaz</option>
          <option value="daily">Her gün</option>
          <option value="weekly">Her hafta</option>
        </select>

        {!task.date && (
          <p className="task-repeat-hint">
            Tekrar ayarlamak için önce göreve bir tarih eklemelisin.
          </p>
        )}

        <label>Dosyalar</label>
        <div className="attachments-list">
          {task.attachments.map((attachment) => (
            <div className="attachment-item" key={attachment.id}>
              <a
                href={attachment.data}
                download={attachment.name}
                target="_blank"
                rel="noopener noreferrer"
                className="attachment-link"
              >
                {attachment.type.startsWith("image/") ? (
                  <img
                    src={attachment.data}
                    alt={attachment.name}
                    className="attachment-preview"
                  />
                ) : (
                  <span className="attachment-name">📄 {attachment.name}</span>
                )}
              </a>

              <button
                onClick={() => onDeleteAttachment(task.id, attachment.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <input
          type="file"
          onChange={handleFileUpload}
          className="attachment-input"
        />

        <div className="detail-field">
          <label htmlFor="task-project">{t.project}</label>
          <select
            id="task-project"
            value={task.projectId ?? ""}
            onChange={(e) => onAssignProject(task.id, e.target.value || null)}
          >
            <option value="">{t.noProject}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

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

      {isDeleteConfirmOpen && (
        <div className="confirm-overlay" onClick={cancelDeleteTask}>
          <div
            className="confirm-box"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="confirm-message">
              "{task.title}" görevini silmek istediğine emin misin? Bu işlem
              geri alınamaz.
            </p>

            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={cancelDeleteTask}>
                Vazgeç
              </button>
              <button className="btn btn-danger" onClick={confirmDeleteTask}>
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskDetailModal;
