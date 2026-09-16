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
}) {
  return (
    <>
      <div className="search-box">
        <input
          type="text"
          placeholder="Görev ara..."
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
      />

      <section className="task-section">
        <div className="task-section-header">
          <h2>Today's Tasks</h2>

          <div className="filters">
            <button
              className={filter === "all" ? "active-filter" : ""}
              onClick={() => setFilter("all")}
            >
              All
            </button>

            <button
              className={filter === "active" ? "active-filter" : ""}
              onClick={() => setFilter("active")}
            >
              Active
            </button>

            <button
              className={filter === "completed" ? "active-filter" : ""}
              onClick={() => setFilter("completed")}
            >
              Completed
            </button>
          </div>
        </div>

        <TaskList
          tasks={filteredTasks}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
          onSelectTask={setSelectedTaskId}
          onReorderTasks={reorderTasks}
        />
      </section>
    </>
  );
}

export default TodayPage;