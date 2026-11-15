import AddTaskBar from "../components/AddTaskBar";
import TaskDetailPanel from "../components/TaskDetailPanel";
import TaskList from "../components/TaskList";
import { parseLocalDate } from "../utils/dateHelpers";

function TodayPage({
  today,
  newTaskTitle,
  setNewTaskTitle,
  newTaskDate,
  setNewTaskDate,
  newTaskTime,
  setNewTaskTime,
  newTaskRepeat,
  setNewTaskRepeat,
  addTask,
  titleInputRef,
  tasks,
  stats,
  toggleTask,
  toggleImportant,
  deleteTask,
  selectedTask,
  setSelectedTaskId,
  closeTaskDetail,
  detailActions,
  projects,
  reorderTasks,
  t,
}) {
  const dateText = parseLocalDate(today).toLocaleDateString(t.dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div
      className={
        selectedTask ? "today-layout today-layout-with-panel" : "today-layout"
      }
    >
      <div className="today-main">
        <header className="today-header">
          <p className="today-date">{dateText}</p>
          <h2 className="page-title">{t.today}</h2>
        </header>

        <ul className="today-stats">
          <li className="today-stat">
            <span className="today-stat-value">{stats.remaining}</span>
            {t.todayRemaining}
          </li>
          <li className="today-stat">
            <span className="today-stat-value">{stats.completed}</span>
            {t.filterCompleted}
          </li>
          <li
            className={
              stats.overdue > 0 ? "today-stat today-stat-overdue" : "today-stat"
            }
          >
            <span className="today-stat-value">{stats.overdue}</span>
            {t.statOverdue}
          </li>
        </ul>

        <AddTaskBar
          title={newTaskTitle}
          setTitle={setNewTaskTitle}
          date={newTaskDate}
          setDate={setNewTaskDate}
          time={newTaskTime}
          setTime={setNewTaskTime}
          repeat={newTaskRepeat}
          setRepeat={setNewTaskRepeat}
          onSubmit={addTask}
          inputRef={titleInputRef}
          t={t}
        />

        <section className="task-section" aria-label={t.todaysTasksTitle}>
          <TaskList
            variant="today"
            tasks={tasks}
            projects={projects}
            today={today}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            onSelectTask={setSelectedTaskId}
            onReorderTasks={reorderTasks}
            onToggleImportant={toggleImportant}
            selectedTaskId={selectedTask?.id ?? null}
            t={t}
          />
        </section>
      </div>

      <TaskDetailPanel
        task={selectedTask}
        onClose={closeTaskDetail}
        onToggleTask={toggleTask}
        onToggleImportant={toggleImportant}
        onDeleteTask={detailActions.onDeleteTask}
        onUpdateTitle={detailActions.onUpdateTitle}
        onUpdateDate={detailActions.onUpdateDate}
        onUpdateTime={detailActions.onUpdateTime}
        onUpdateDescription={detailActions.onUpdateDescription}
        onAddStep={detailActions.onAddStep}
        onToggleStep={detailActions.onToggleStep}
        onDeleteStep={detailActions.onDeleteStep}
        onUpdateRepeat={detailActions.onUpdateRepeat}
        projects={projects}
        onAssignProject={detailActions.onAssignProject}
        t={t}
      />
    </div>
  );
}

export default TodayPage;
