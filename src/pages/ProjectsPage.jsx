import TaskList from "../components/TaskList";
import { useMemo } from "react";
import { useNavigate } from "react-router";
import { getProjectPath } from "../routes";
import DateField from "../components/DateField";

export default function ProjectsPage({
  selectedProject,
  addProject,
  newProjectName,
  setNewProjectName,
  projects,
  deleteProject,
  tasks,
  addProjectTask,
  newProjectTaskTitle,
  setNewProjectTaskTitle,
  newProjectTaskDate,
  setNewProjectTaskDate,
  selectedProjectId,
  toggleTask,
  deleteTask,
  setSelectedTaskId,
  reorderTasks,
  t,
}) {
  const navigate = useNavigate();
  const selectedProjectTasks = useMemo(
    () => tasks.filter((task) => task.projectId === selectedProjectId),
    [tasks, selectedProjectId],
  );

  if (selectedProject) {
    return (
      <section className="project-detail">
        <div className="dashboard-welcome">
          <button
            type="button"
            className="btn btn-secondary project-back-button"
            onClick={() => navigate("/projects")}
          >
            {t.backToProjects}
          </button>
          <h2>{selectedProject.name}</h2>
        </div>

        <form className="project-task-form" onSubmit={addProjectTask}>
          <input
            type="text"
            enterKeyHint="done"
            autoComplete="off"
            aria-label={t.newProjectTaskLabel}
            placeholder={t.newProjectTaskPlaceholder}
            value={newProjectTaskTitle}
            onChange={(event) => setNewProjectTaskTitle(event.target.value)}
          />

          <DateField
            label={t.dateLabel}
            value={newProjectTaskDate}
            onChange={setNewProjectTaskDate}
            t={t}
          />

          <button type="submit" className="btn btn-primary">
            {t.addProjectTaskButton}
          </button>
        </form>

        <TaskList
          tasks={selectedProjectTasks}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
          onSelectTask={setSelectedTaskId}
          onReorderTasks={reorderTasks}
          t={t}
        />
      </section>
    );
  }

  return (
    <section className="projects-page">
      <div className="dashboard-welcome">
        <h2>{t.projectsPageTitle}</h2>
        <p>{t.projectsPageDescription}</p>
      </div>

      <form className="project-form" onSubmit={addProject}>
        <input
          type="text"
          enterKeyHint="done"
          autoComplete="off"
          aria-label={t.newProjectLabel}
          placeholder={t.newProjectPlaceholder}
          value={newProjectName}
          onChange={(event) => setNewProjectName(event.target.value)}
        />

        <button type="submit" className="btn btn-primary">
          {t.addProjectButton}
        </button>
      </form>

      <div className="project-list">
        {projects.map((project) => (
          <div
            className="project-card"
            key={project.id}
            onClick={() => navigate(getProjectPath(project.id))}
          >
            <div className="project-card-header">
              <h3>{project.name}</h3>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  deleteProject(project.id);
                }}
              >
                {t.deleteButton}
              </button>
            </div>

            <p>
              {tasks.filter((task) => task.projectId === project.id).length}{" "}
              {t.taskCountSuffix}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}