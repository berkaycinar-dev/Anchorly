import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronLeft,
  Columns3,
  List,
  Plus,
  Trash2,
} from "lucide-react";
import Icon from "../Icon";
import AddTaskBar from "../AddTaskBar";
import TaskList from "../TaskList";
import ProjectBoard from "./ProjectBoard";
import {
  CATEGORY_OPTIONS,
  getCategoryLabel,
} from "../../utils/categoryHelpers";
import {
  filterTasksByCategory,
  getProjectColorKey,
  getProjectInitial,
  getProjectProgress,
} from "../../utils/projectHelpers";
import { formatLongDate, getDaysFromToday } from "../../utils/dateHelpers";

function ProjectDetail({
  project,
  tasks,
  today,
  updateProject,
  deleteProject,
  addProjectTask,
  newProjectTaskTitle,
  setNewProjectTaskTitle,
  toggleTask,
  moveTaskToColumn,
  deleteTask,
  setSelectedTaskId,
  reorderTasks,
  t,
}) {
  const navigate = useNavigate();
  const [view, setView] = useState("board");
  const [category, setCategory] = useState("all");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const addTaskButtonRef = useRef(null);
  const shouldRestoreFocusRef = useRef(false);

  useEffect(() => {
    if (!isTaskFormOpen && shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false;
      addTaskButtonRef.current?.focus();
    }
  }, [isTaskFormOpen]);

  function closeTaskForm() {
    shouldRestoreFocusRef.current = true;
    setIsTaskFormOpen(false);
  }

  const progress = getProjectProgress(tasks);
  const visibleTasks = filterTasksByCategory(tasks, category);
  const colorKey = getProjectColorKey(project.id);

  const dueText = project.dueDate
    ? `${t.projectDueOn(formatLongDate(project.dueDate, t.dateLocale))} · ${t.projectDaysLeft(getDaysFromToday(project.dueDate, today))}`
    : t.projectNoDueDate;

  function handleArchiveToggle() {
    updateProject(project.id, { archived: !project.archived });
  }

  function handleDelete() {
    deleteProject(project.id);
    navigate("/projects");
  }

  return (
    <section className="project-detail">
      <button
        type="button"
        className="btn btn-secondary btn-mobile-icon project-back-button"
        title={t.backToProjects}
        onClick={() => navigate("/projects")}
      >
        <Icon icon={ChevronLeft} size="lg" className="icon-mobile" />
        <span className="label-desktop">{t.backToProjects}</span>
      </button>

      <header className="project-detail-header">
        <div
          className="project-avatar"
          data-color={colorKey}
          aria-hidden="true"
        >
          {getProjectInitial(project.name)}
        </div>

        <div className="project-heading">
          <h2>{project.name}</h2>
          <p>{dueText}</p>
        </div>

        <div className="project-header-side">
          <div className="project-progress">
            <div
              className="project-progress-bar"
              role="progressbar"
              aria-label={t.projectProgressAria(progress.done, progress.total)}
              aria-valuemin={0}
              aria-valuemax={Math.max(progress.total, 1)}
              aria-valuenow={progress.done}
            >
              <div
                className="project-progress-fill"
                style={{ width: `${progress.ratio * 100}%` }}
              />
            </div>
            <span className="project-progress-text" aria-hidden="true">
              {progress.done} / {progress.total}
            </span>
          </div>

          <div className="project-actions">
            <button
              type="button"
              className="icon-button"
              aria-label={
                project.archived
                  ? t.unarchiveProjectAction(project.name)
                  : t.archiveProjectAction(project.name)
              }
              onClick={handleArchiveToggle}
            >
              <Icon
                icon={project.archived ? ArchiveRestore : Archive}
                size="lg"
              />
            </button>
            <button
              type="button"
              className="icon-button icon-button-danger"
              aria-label={t.deleteProjectAction(project.name)}
              onClick={handleDelete}
            >
              <Icon icon={Trash2} size="lg" />
            </button>
          </div>
        </div>
      </header>

      <div className="project-toolbar">
        <div
          className="segmented"
          role="group"
          aria-label={t.projectViewsLabel}
        >
          <button
            type="button"
            aria-pressed={view === "board"}
            onClick={() => setView("board")}
          >
            <Icon icon={Columns3} size="md" />
            <span className="label-desktop">{t.projectViewBoard}</span>
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <Icon icon={List} size="md" />
            <span className="label-desktop">{t.projectViewList}</span>
          </button>
        </div>

        <div className="select-field">
          <select
            aria-label={t.projectCategoryFilterLabel}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">{t.projectCategoryAll}</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {getCategoryLabel(option, t)}
              </option>
            ))}
          </select>
          <Icon icon={ChevronDown} size="md" className="select-field-icon" />
        </div>

        {!isTaskFormOpen && (
          <button
            type="button"
            ref={addTaskButtonRef}
            className="btn btn-primary btn-mobile-icon project-add-task"
            title={t.projectAddTaskOpen}
            onClick={() => setIsTaskFormOpen(true)}
          >
            <Icon icon={Plus} size="md" />
            <span className="label-desktop">{t.projectAddTaskOpen}</span>
          </button>
        )}
      </div>

      {isTaskFormOpen && (
        <AddTaskBar
          title={newProjectTaskTitle}
          setTitle={setNewProjectTaskTitle}
          onSubmit={addProjectTask}
          label={t.newProjectTaskLabel}
          placeholder={t.newProjectTaskPlaceholder}
          showTools={false}
          autoFocus
          onClose={closeTaskForm}
          t={t}
        />
      )}

      {view === "board" ? (
        <ProjectBoard
          tasks={visibleTasks}
          today={today}
          onSelectTask={setSelectedTaskId}
          onMoveTask={moveTaskToColumn}
          t={t}
        />
      ) : (
        <TaskList
          tasks={visibleTasks}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
          onSelectTask={setSelectedTaskId}
          onReorderTasks={reorderTasks}
          t={t}
        />
      )}
    </section>
  );
}

export default ProjectDetail;
