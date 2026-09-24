function AddTaskForm({
  newTaskTitle,
  setNewTaskTitle,
  newTaskCategory,
  setNewTaskCategory,
  newTaskDate,
  setNewTaskDate,
  addTask,
  titleInputRef,
  t,
}) {
  return (
    <form className="add-task-form" onSubmit={addTask}>
      <input
        type="text"
        placeholder={t.newTaskPlaceholder}
        value={newTaskTitle}
        onChange={(event) => setNewTaskTitle(event.target.value)}
        ref={titleInputRef}
      />

      <select
        value={newTaskCategory}
        onChange={(event) => setNewTaskCategory(event.target.value)}
      >
        <option value="Work">{t.categoryWork}</option>
        <option value="Personal">{t.categoryPersonal}</option>
        <option value="Self Development">{t.categorySelfDevelopment}</option>
        <option value="Other">{t.categoryOther}</option>
      </select>

      <input
        type="date"
        value={newTaskDate}
        onChange={(event) => setNewTaskDate(event.target.value)}
      />

      <button type="submit" className="btn btn-primary">
        {t.addButton}
      </button>
    </form>
  );
}

export default AddTaskForm;