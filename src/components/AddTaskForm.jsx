function AddTaskForm({
  newTaskTitle,
  setNewTaskTitle,
  newTaskCategory,
  setNewTaskCategory,
  newTaskDate,
  setNewTaskDate,
  addTask,
  titleInputRef,
}) {
  return (
    <form className="add-task-form" onSubmit={addTask}>
      <input
        type="text"
        placeholder="Yeni görev ekle..."
        value={newTaskTitle}
        onChange={(event) => setNewTaskTitle(event.target.value)}
        ref={titleInputRef}
      />

      <select
        value={newTaskCategory}
        onChange={(event) => setNewTaskCategory(event.target.value)}
      >
        <option value="Work">Work</option>
        <option value="Personal">Personal</option>
        <option value="Self Development">Self Development</option>
        <option value="Other">Other</option>
      </select>

      <input
        type="date"
        value={newTaskDate}
        onChange={(event) => setNewTaskDate(event.target.value)}
      />

      <button type="submit">Ekle</button>
    </form>
  );
}

export default AddTaskForm;
