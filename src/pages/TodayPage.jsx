import AddTaskForm from "../components/AddTaskForm";
import TaskList from "../components/TaskList";

function TodayPage({
  searchText,
  setSearchText,
  newTaskTitle,
  setNewTaskTitle,
  newTaskCategory,
  setNewTaskCategory,
  newTaskDate,
  setNewTaskDate,
  addTask,
  titleInputRef,
  filter,
  setFilter,
  filteredTasks,
  toggleTask,
  deleteTask,
  setSelectedTaskId,
  reorderTasks,
  t,
}) {
  return (
    <>
      <div className="search-box">
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </div>

      <AddTaskForm
        newTaskTitle={newTaskTitle}
        setNewTaskTitle={setNewTaskTitle}
        newTaskCategory={newTaskCategory}
        setNewTaskCategory={setNewTaskCategory}
        newTaskDate={newTaskDate}
        setNewTaskDate={setNewTaskDate}
        addTask={addTask}
        titleInputRef={titleInputRef}
        t={t}
      />

      <section className="task-section">
        <div className="task-section-header">
          <h2>{t.todaysTasksTitle}</h2>

          <div className="filters">
            <button
              className={filter === "all" ? "active-filter" : ""}
              onClick={() => setFilter("all")}
            >
              {t.filterAll}
            </button>

            <button
              className={filter === "active" ? "active-filter" : ""}
              onClick={() => setFilter("active")}
            >
              {t.filterActive}
            </button>

            <button
              className={filter === "completed" ? "active-filter" : ""}
              onClick={() => setFilter("completed")}
            >
              {t.filterCompleted}
            </button>
          </div>
        </div>

        <TaskList
          tasks={filteredTasks}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
          onSelectTask={setSelectedTaskId}
          onReorderTasks={reorderTasks}
          t={t}
        />
      </section>
    </>
  );
}

export default TodayPage;