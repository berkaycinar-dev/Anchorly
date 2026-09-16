import TaskList from "../components/TaskList";

export default function ProjectsPage({
  selectedProject,
  setSelectedProjectId,
  addProject,
  newProjectName,
  setNewProjectsName,
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
}) {
  if (selectedProject) {
    return (
      <section className="project-detail">
        <div className="dashboard-welcome">
          <button onClick={() => setSelectedProjectId(null)}>
            ← Projelere Dön
          </button>
          <h2>{selectedProject.name}</h2>
        </div>

        <form className="project-task-form" onSubmit={addProjectTask}>
          <input
            type="text"
            placeholder="Proje görevi ekle..."
            value={newProjectTaskTitle}
            onChange={(event) => setNewProjectTaskTitle(event.target.value)}
          />

          <input
            type="date"
            value={newProjectTaskDate}
            onChange={(event) => setNewProjectTaskDate(event.target.value)}
          />

          <button type="submit" className="btn btn-primary">
            Görev Ekle
          </button>
        </form>

        <TaskList
          tasks={tasks.filter((task) => task.projectId === selectedProjectId)}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
          onSelectTask={setSelectedTaskId}
          onReorderTasks={reorderTasks}
        />
      </section>
    );
  }

  return (
    <section className="projects-page">
      <div className="dashboard-welcome">
        <h2>Projeler</h2>
        <p>Projelerine özel görev klasörleri oluşturabilirsin.</p>
      </div>

      <form className="project-form" onSubmit={addProject}>
        <input
          type="text"
          placeholder="Yeni proje adı..."
          value={newProjectName}
          onChange={(event) => setNewProjectsName(event.target.value)}
        />

        <button type="submit" className="btn btn-primary">
          Proje Ekle
        </button>
      </form>

      <div className="project-list">
        {projects.map((project) => (
          <div
            className="project-card"
            key={project.id}
            onClick={() => setSelectedProjectId(project.id)}
          >
            <div className="project-card-header">
              <h3>{project.name}</h3>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  deleteProject(project.id);
                }}
              >
                Sil
              </button>
            </div>

            <p>
              {tasks.filter((task) => task.projectId === project.id).length}{" "}
              görev
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
