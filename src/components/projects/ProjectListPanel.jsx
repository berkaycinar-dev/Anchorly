import { useState } from "react";
import { Link } from "react-router";
import { Check, Plus } from "lucide-react";
import Icon from "../Icon";
import DateField from "../DateField";
import { getProjectPath } from "../../routes";
import {
  getOpenTaskCount,
  getProjectColorKey,
  splitProjects,
} from "../../utils/projectHelpers";

function ProjectListItem({ project, tasks, isSelected, t }) {
  const openCount = getOpenTaskCount(tasks, project.id);

  return (
    <li>
      <Link
        to={getProjectPath(project.id)}
        className="project-item"
        aria-current={isSelected ? "page" : undefined}
      >
        <span
          className="project-dot"
          data-color={getProjectColorKey(project.id)}
          aria-hidden="true"
        />
        <span className="project-item-name">{project.name}</span>
        {project.archived ? (
          <Icon
            icon={Check}
            size="md"
            label={t.projectArchivedMark}
            className="project-item-check"
          />
        ) : (
          <span
            className="project-item-count"
            aria-label={t.projectOpenTasksAria(openCount)}
          >
            {openCount}
          </span>
        )}
      </Link>
    </li>
  );
}

function ProjectListPanel({
  projects,
  tasks,
  selectedProjectId,
  addProject,
  newProjectName,
  setNewProjectName,
  newProjectDueDate,
  setNewProjectDueDate,
  t,
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { active, archived } = splitProjects(projects);

  function handleSubmit(event) {
    addProject(event);

    if (newProjectName.trim() !== "") {
      setIsFormOpen(false);
    }
  }

  function renderSection(title, items) {
    if (items.length === 0) {
      return null;
    }

    return (
      <div className="project-section">
        <h3 className="project-section-title">{title}</h3>
        <ul className="project-items">
          {items.map((project) => (
            <ProjectListItem
              key={project.id}
              project={project}
              tasks={tasks}
              isSelected={project.id === selectedProjectId}
              t={t}
            />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <aside className="project-list-panel" aria-label={t.projectListLabel}>
      <div className="project-list-header">
        <h2>{t.projectsPageTitle}</h2>
        <button
          type="button"
          className="icon-button icon-button-filled"
          aria-label={t.openNewProjectForm}
          aria-expanded={isFormOpen}
          onClick={() => setIsFormOpen((open) => !open)}
        >
          <Icon icon={Plus} size="lg" />
        </button>
      </div>

      {isFormOpen && (
        <form className="project-form" onSubmit={handleSubmit}>
          <input
            type="text"
            enterKeyHint="done"
            autoComplete="off"
            autoFocus
            aria-label={t.newProjectLabel}
            placeholder={t.newProjectPlaceholder}
            value={newProjectName}
            onChange={(event) => setNewProjectName(event.target.value)}
          />

          <DateField
            label={t.projectDueDateLabel}
            value={newProjectDueDate}
            onChange={setNewProjectDueDate}
            t={t}
          />

          <button type="submit" className="btn btn-primary">
            {t.addProjectButton}
          </button>
        </form>
      )}

      {projects.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-title">{t.noProjectsTitle}</p>
          <p className="empty-state-subtitle">{t.noProjectsSubtitle}</p>
        </div>
      )}

      {renderSection(t.projectActiveSection, active)}
      {renderSection(t.projectArchivedSection, archived)}
    </aside>
  );
}

export default ProjectListPanel;
