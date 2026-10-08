import "./App.css";
import { useEffect, useState, useRef, useMemo } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import TaskDetailModal from "./components/TaskDetailModal";
import DashboardPage from "./pages/DashboardPage";
import TodayPage from "./pages/TodayPage";
import { strings, pageTitleKeyMap } from "./strings";
import DailyRoutinePage from "./pages/DailyRoutinePage";
import CalendarPage from "./pages/CalendarPage";
import ArchivePage from "./pages/ArchivePage";
import ProjectsPage from "./pages/ProjectsPage";
import SettingsPage from "./pages/SettingsPage";
import {
  getWeekStartOffset,
  getWeekStartDate,
  getWeekDays,
  getRoutineKeyForDate,
} from "./utils/dateHelpers";
import useLocalStorageState from "./hooks/useLocalStorageState";
import useTasks from "./hooks/useTasks";
import useRoutines from "./hooks/useRoutines";
import useProjects from "./hooks/useProjects";
import { isTaskVisibleToday } from "./utils/taskHelpers";

const VALID_THEMES = ["gray", "purple", "blue", "red", "green", "pink"];

function getGreetingSegment() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "morning";
  }

  if (hour < 18) {
    return "afternoon";
  }

  return "evening";
}

function App() {
  const today = new Date().toISOString().slice(0, 10);
  const {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    updateTaskTitle,
    updateTaskDescription,
    updateTaskDate,
    updateTaskRepeat,
    addTaskStep,
    toggleTaskStep,
    deleteTaskStep,
    addTaskAttachment,
    deleteTaskAttachment,
    reorderTasks,
    assignTaskToProject,
    clearProjectFromTasks,
  } = useTasks(today);

  const {
    routines,
    routineChecks,
    routineMonth,
    setRoutineMonth,
    routineYear,
    routineMonthIndex,
    routineDays,
    getRoutineKeyForMonth,
    toggleRoutineCheck,
    addRoutine,
    deleteRoutine,
    getRoutineStreak,
    getWeeklyProductivity,
  } = useRoutines();

  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    addProject,
    deleteProject,
  } = useProjects();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("Work");
  const [newTaskDate, setNewTaskDate] = useState("");
  const newTaskTitleInputRef = useRef(null);
  const [filter, setFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const [theme, setTheme] = useLocalStorageState(
    "theme",
    "gray",
    (savedTheme) => (VALID_THEMES.includes(savedTheme) ? savedTheme : "gray"),
  );
  const [language, setLanguage] = useLocalStorageState("language", "tr");
  const [fontFamily, setFontFamily] = useLocalStorageState(
    "fontFamily",
    "Inter",
  );
  const [weekStartDay, setWeekStartDay] = useLocalStorageState(
    "weekStartDay",
    "monday",
  );

  const t = strings[language];
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const [activePage, setActivePage] = useState("Dashboard");
  const [newRoutineTitle, setNewRoutineTitle] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState("month");
  const [calendarWeekStart, setCalendarWeekStart] = useState(new Date());
  const [archiveStatusFilter, setArchiveStatusFilter] = useState("all");
  const [archiveStartDate, setArchiveStartDate] = useState("");
  const [archiveEndDate, setArchiveEndDate] = useState("");
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedTaskId(null);
        return;
      }

      const isTypingField =
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.tagName === "SELECT";

      if (isTypingField) {
        return;
      }

      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        setActivePage("Today");

        setTimeout(() => {
          newTaskTitleInputRef.current?.focus();
        }, 0);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const [newProjectTaskTitle, setNewProjectTaskTitle] = useState("");
  const [newProjectTaskDate, setNewProjectTaskDate] = useState(today);
  const [quickAddDate, setQuickAddDate] = useState(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const todayScopedTasks = useMemo(
    () => tasks.filter((task) => isTaskVisibleToday(task, today)),
    [tasks, today],
  );

  const todayStats = useMemo(() => {
    const total = todayScopedTasks.length;
    const completed = todayScopedTasks.filter(
      (task) => task.completed && task.completedAt === today,
    ).length;
    const active = todayScopedTasks.filter((task) => !task.completed).length;
    const overdue = tasks.filter(
      (task) => !task.completed && task.date && task.date < today,
    ).length;
    const completionPercent =
      total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, completed, active, overdue, completionPercent };
  }, [tasks, todayScopedTasks, today]);

  const routineCheckDate = new Date();
  const remainingRoutineCount = routines.filter(
    (routine) =>
      !routineChecks[getRoutineKeyForDate(routine.id, routineCheckDate)],
  ).length;

  const sidebarBadges = {
    Today: todayStats.active,
    "Daily Routine": remainingRoutineCount,
    Projects: projects.length,
  };

  const filteredTasks = useMemo(() => {
    const searchLower = searchText.toLowerCase();

    return todayScopedTasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchLower);

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && !task.completed) ||
        (filter === "completed" && task.completed);

      return matchesSearch && matchesFilter;
    });
  }, [todayScopedTasks, searchText, filter]);

  const filteredArchiveTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const matchesStatus =
          archiveStatusFilter === "all" ||
          (archiveStatusFilter === "completed" && task.completed) ||
          (archiveStatusFilter === "active" && !task.completed);

        const matchesStartDate =
          archiveStartDate === "" || task.date >= archiveStartDate;

        const matchesEndDate =
          archiveEndDate === "" || task.date <= archiveEndDate;

        return matchesStatus && matchesStartDate && matchesEndDate;
      }),
    [tasks, archiveStatusFilter, archiveStartDate, archiveEndDate],
  );

  const weeklyProductivity = useMemo(
    () => getWeeklyProductivity(language),
    [getWeeklyProductivity, language],
  );

  const greetingSegment = getGreetingSegment();

  const dashboardMessage = useMemo(() => {
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);

    const weekStart = getWeekStartDate(new Date(), weekStartDay)
      .toISOString()
      .slice(0, 10);

    const yesterdayCompletedCount = tasks.filter(
      (task) => task.completed && task.completedAt === yesterday,
    ).length;

    const weekCompletedCount = tasks.filter(
      (task) =>
        task.completed &&
        task.completedAt &&
        task.completedAt >= weekStart &&
        task.completedAt <= today,
    ).length;

    const pool = [...t.dashboardQuotes];

    if (yesterdayCompletedCount > 0) {
      pool.push(t.yesterdayCompletedMessage(yesterdayCompletedCount));
    }

    if (weekCompletedCount > 0) {
      pool.push(t.weekCompletedMessage(weekCompletedCount));
    }

    routines.forEach((routine) => {
      const streak = getRoutineStreak(routine.id);

      if (streak > 1) {
        pool.push(t.routineStreakMessage(routine.title, streak));
      }
    });

    const seedString = `${today}-${greetingSegment}`;
    let hash = 0;

    for (let i = 0; i < seedString.length; i++) {
      hash = (hash * 31 + seedString.charCodeAt(i)) % pool.length;
    }

    return pool[hash];
  }, [
    tasks,
    routines,
    getRoutineStreak,
    t,
    today,
    weekStartDay,
    greetingSegment,
  ]);
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();

  const firstDayOfCalendarMonth = new Date(calendarYear, calendarMonthIndex, 1);
  const daysInCalendarMonth = new Date(
    calendarYear,
    calendarMonthIndex + 1,
    0,
  ).getDate();

  const calendarStartDay = getWeekStartOffset(
    firstDayOfCalendarMonth,
    weekStartDay,
  );

  const calendarDays = Array.from(
    { length: daysInCalendarMonth },
    (_, index) => index + 1,
  );

  const weekDays = getWeekDays(calendarWeekStart, weekStartDay);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return t.greetingMorning;
    if (hour < 18) return t.greetingAfternoon;
    return t.greetingEvening;
  }

  const [hoveredDayIndex, setHoveredDayIndex] = useState(null);

  function handleAddTask(event) {
    event.preventDefault();

    if (newTaskTitle.trim() === "") {
      return;
    }

    addTask({
      title: newTaskTitle,
      category: newTaskCategory,
      date: newTaskDate,
    });

    setNewTaskTitle("");
    setNewTaskCategory("Work");
    setNewTaskDate("");
  }

  function handleAddRoutine(event) {
    event.preventDefault();

    if (newRoutineTitle.trim() === "") {
      return;
    }

    addRoutine(newRoutineTitle);
    setNewRoutineTitle("");
  }

  function handleAddProject(event) {
    event.preventDefault();

    if (newProjectName.trim() === "") {
      return;
    }

    addProject(newProjectName);
    setNewProjectName("");
  }

  function handleDeleteProject(id) {
    deleteProject(id);
    clearProjectFromTasks(id);
  }

  function handleDeleteTaskFromModal(taskId) {
    deleteTask(taskId);
    setSelectedTaskId(null);
  }

  function handleAssignProject(taskId, projectId) {
    const targetProject = projects.find(
      (project) => String(project.id) === String(projectId),
    );

    assignTaskToProject(taskId, targetProject ? targetProject.id : null);
  }

  function addProjectTask(event) {
    event.preventDefault();

    if (newProjectTaskTitle.trim() === "") {
      return;
    }

    addTask({
      title: newProjectTaskTitle,
      category: "Project",
      date: newProjectTaskDate,
      projectId: selectedProjectId,
    });

    setNewProjectTaskTitle("");
    setNewProjectTaskDate(today);
  }

  function submitQuickAdd(event) {
    event.preventDefault();

    if (quickAddTitle.trim() === "") {
      return;
    }

    addTask({
      title: quickAddTitle,
      category: "Work",
      date: quickAddDate,
    });

    setQuickAddTitle("");
    setQuickAddDate(null);
  }

  return (
    <div
      className={`app theme-${theme}`}
      style={{ "--font-main": `'${fontFamily}', system-ui, sans-serif` }}
    >
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        t={t}
        badges={sidebarBadges}
      />

      <main className="main-content">
        <Header />
        <h2 className="page-title">{t[pageTitleKeyMap[activePage]]}</h2>

        {activePage === "Dashboard" && (
          <DashboardPage
            greeting={getGreeting()}
            dashboardMessage={dashboardMessage}
            todayTasksCount={todayStats.total}
            completedTodayTasksCount={todayStats.completed}
            allTaskCount={todayStats.total}
            completedTasksCount={todayStats.completed}
            activeTaskCount={todayStats.active}
            overdueTaskCount={todayStats.overdue}
            todayCompletionPercent={todayStats.completionPercent}
            weeklyProductivity={weeklyProductivity}
            hoveredDayIndex={hoveredDayIndex}
            setHoveredDayIndex={setHoveredDayIndex}
            t={t}
          />
        )}

        {activePage === "Today" && (
          <TodayPage
            searchText={searchText}
            setSearchText={setSearchText}
            newTaskTitle={newTaskTitle}
            setNewTaskTitle={setNewTaskTitle}
            newTaskCategory={newTaskCategory}
            setNewTaskCategory={setNewTaskCategory}
            newTaskDate={newTaskDate}
            setNewTaskDate={setNewTaskDate}
            addTask={handleAddTask}
            titleInputRef={newTaskTitleInputRef}
            filter={filter}
            setFilter={setFilter}
            filteredTasks={filteredTasks}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            setSelectedTaskId={setSelectedTaskId}
            reorderTasks={reorderTasks}
            t={t}
          />
        )}

        {activePage === "Daily Routine" && (
          <DailyRoutinePage
            routineMonth={routineMonth}
            addRoutine={handleAddRoutine}
            newRoutineTitle={newRoutineTitle}
            setNewRoutineTitle={setNewRoutineTitle}
            setRoutineMonth={setRoutineMonth}
            routineYear={routineYear}
            routineMonthIndex={routineMonthIndex}
            routineDays={routineDays}
            routines={routines}
            deleteRoutine={deleteRoutine}
            routineChecks={routineChecks}
            getRoutineKey={getRoutineKeyForMonth}
            toggleRoutineCheck={toggleRoutineCheck}
            language={language}
            t={t}
          />
        )}

        {activePage === "Calendar" && (
          <CalendarPage
            calendarViewMode={calendarViewMode}
            setCalendarViewMode={setCalendarViewMode}
            calendarMonth={calendarMonth}
            weekDays={weekDays}
            setCalendarMonth={setCalendarMonth}
            calendarYear={calendarYear}
            calendarMonthIndex={calendarMonthIndex}
            calendarWeekStart={calendarWeekStart}
            setCalendarWeekStart={setCalendarWeekStart}
            calendarStartDay={calendarStartDay}
            calendarDays={calendarDays}
            tasks={tasks}
            setQuickAddDate={setQuickAddDate}
            setQuickAddTitle={setQuickAddTitle}
            quickAddDate={quickAddDate}
            submitQuickAdd={submitQuickAdd}
            quickAddTitle={quickAddTitle}
            setSelectedTaskId={setSelectedTaskId}
            today={today}
            weekStartDay={weekStartDay}
            t={t}
            language={language}
          />
        )}

        {activePage === "Archive" && (
          <ArchivePage
            archiveStatusFilter={archiveStatusFilter}
            setArchiveStatusFilter={setArchiveStatusFilter}
            archiveStartDate={archiveStartDate}
            setArchiveStartDate={setArchiveStartDate}
            archiveEndDate={archiveEndDate}
            setArchiveEndDate={setArchiveEndDate}
            filteredArchiveTasks={filteredArchiveTasks}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            setSelectedTaskId={setSelectedTaskId}
            reorderTasks={reorderTasks}
            t={t}
          />
        )}

        {activePage === "Projects" && (
          <ProjectsPage
            selectedProject={selectedProject}
            setSelectedProjectId={setSelectedProjectId}
            addProject={handleAddProject}
            newProjectName={newProjectName}
            setNewProjectName={setNewProjectName}
            projects={projects}
            deleteProject={handleDeleteProject}
            tasks={tasks}
            addProjectTask={addProjectTask}
            newProjectTaskTitle={newProjectTaskTitle}
            setNewProjectTaskTitle={setNewProjectTaskTitle}
            newProjectTaskDate={newProjectTaskDate}
            setNewProjectTaskDate={setNewProjectTaskDate}
            selectedProjectId={selectedProjectId}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            setSelectedTaskId={setSelectedTaskId}
            reorderTasks={reorderTasks}
            t={t}
          />
        )}

        {activePage === "Settings" && (
          <SettingsPage
            t={t}
            theme={theme}
            setTheme={setTheme}
            language={language}
            setLanguage={setLanguage}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            weekStartDay={weekStartDay}
            setWeekStartDay={setWeekStartDay}
          />
        )}
      </main>

      <TaskDetailModal
        key={selectedTaskId ?? "none"}
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onToggleTask={toggleTask}
        onUpdateDescription={updateTaskDescription}
        onUpdateTitle={updateTaskTitle}
        onUpdateDate={updateTaskDate}
        onDeleteTask={handleDeleteTaskFromModal}
        onAddStep={addTaskStep}
        onToggleStep={toggleTaskStep}
        onDeleteStep={deleteTaskStep}
        onUpdateRepeat={updateTaskRepeat}
        onAddAttachment={addTaskAttachment}
        onDeleteAttachment={deleteTaskAttachment}
        t={t}
        projects={projects}
        onAssignProject={handleAssignProject}
      />
    </div>
  );
}

export default App; 