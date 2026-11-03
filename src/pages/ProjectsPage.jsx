import { useMemo } from "react";
import { FolderOpen } from "lucide-react";
import Icon from "../components/Icon";
import ProjectDetail from "../components/projects/ProjectDetail";
import ProjectListPanel from "../components/projects/ProjectListPanel";

export default function ProjectsPage({
  selectedProject,
  addProject,
  newProjectName,
  setNewProjectName,
  newProjectDueDate,
  setNewProjectDueDate,
  projects,
  updateProject,
  deleteProject,
  tasks,
  today,
  addProjectTask,
  newProjectTaskTitle,
  setNewProjectTaskTitle,
  newProjectTaskDate,
  setNewProjectTaskDate,
  selectedProjectId,
  toggleTask,
  moveTaskToColumn,
  deleteTask,
  setSelectedTaskId,
  reorderTasks,
  t,
}) {
  const selectedProjectTasks = useMemo(
    () => tasks.filter((task) => task.projectId === selectedProjectId),
    [tasks, selectedProjectId],
  );

  return (
    <section
      className="projects-layout"
      data-view={selectedProject ? "detail" : "list"}
    >
      <ProjectListPanel
        projects={projects}
        tasks={tasks}
        selectedProjectId={selectedProjectId}
        addProject={addProject}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        newProjectDueDate={newProjectDueDate}
        setNewProjectDueDate={setNewProjectDueDate}
        t={t}
      />

      <div className="project-detail-panel">
        {selectedProject ? (
          <ProjectDetail
            key={selectedProject.id}
            project={selectedProject}
            tasks={selectedProjectTasks}
            today={today}
            updateProject={updateProject}
            deleteProject={deleteProject}
            addProjectTask={addProjectTask}
            newProjectTaskTitle={newProjectTaskTitle}
            setNewProjectTaskTitle={setNewProjectTaskTitle}
            newProjectTaskDate={newProjectTaskDate}
            setNewProjectTaskDate={setNewProjectTaskDate}
            toggleTask={toggleTask}
            moveTaskToColumn={moveTaskToColumn}
            deleteTask={deleteTask}
            setSelectedTaskId={setSelectedTaskId}
            reorderTasks={reorderTasks}
            t={t}
          />
        ) : (
          <div className="empty-state project-detail-empty">
            <Icon icon={FolderOpen} size="lg" />
            <p className="empty-state-title">{t.selectProjectTitle}</p>
            <p className="empty-state-subtitle">{t.selectProjectSubtitle}</p>
          </div>
        )}
      </div>
    </section>
  );
}
