import "./App.css";
import { useEffect, useState, useRef } from "react";
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
import { initialRoutines, initialProjects } from "./constants/initialData";
import {
  getWeekStartOffset,
  getWeekStartDate,
  getWeekDays,
  getRoutineKey,
  getRoutineKeyForDate,
} from "./utils/dateHelpers";
import useLocalStorageState from "./hooks/useLocalStorageState";
import useTasks from "./hooks/useTasks";

const VALID_THEMES = ["gray", "purple", "blue", "red", "green", "pink"];

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
  const [routines, setRoutines] = useLocalStorageState(
    "routines",
    initialRoutines,
  );
  const [routineChecks, setRoutineChecks] = useLocalStorageState(
    "routineChecks",
    {},
  );
  const [routineMonth, setRoutineMounth] = useState(new Date());
  const [newRoutineTitle, setNewRoutineTitle] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState("month");
  const [calendarWeekStart, setCalendarWeekStart] = useState(new Date());
  const [archiveStatusFilter, setArchiveStatusFilter] = useState("all");
  const [archiveStartDate, setArchiveStartDate] = useState("");
  const [archiveEndDate, setArchiveEndDate] = useState("");
  const [projects, setProjects] = useLocalStorageState(
    "projects",
    initialProjects,
  );
  const [newProjectName, setNewProjectsName] = useState("");

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

  function isVisibleInToday(task) {
    const isDateless = !task.date;
    const isTodayDated = task.date === today;
    const belongsToProject = Boolean(task.projectId);

    const belongsToToday = isTodayDated || (isDateless && !belongsToProject);

    if (!belongsToToday) {
      return false;
    }

    if (task.completed && task.completedAt !== today) {
      return false;
    }

    return true;
  }

  const todayScopedTasks = tasks.filter(isVisibleInToday);
  const allTaskCount = todayScopedTasks.length;
  const completedTasksCount = todayScopedTasks.filter(
    (task) => task.completed && task.completedAt === today,
  ).length;
  const activeTaskCount = todayScopedTasks.filter(
    (task) => !task.completed,
  ).length;
  const overdueTaskCount = tasks.filter(
    (task) => !task.completed && task.date && task.date < today,
  ).length;
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [newProjectTaskTitle, setNewProjectTaskTitle] = useState("");
  const [newProjectTaskDate, setNewProjectTaskDate] = useState(today);
  const [quickAddDate, setQuickAddDate] = useState(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) || null;
  const todayTasks = todayScopedTasks;
  const todayTasksCount = todayTasks.length;
  const completedTodayTasksCount = todayTasks.filter(
    (task) => task.completed && task.completedAt === today,
  ).length;
  const todayCompletionPercent =
    todayTasksCount === 0
      ? 0
      : Math.round((completedTodayTasksCount / todayTasksCount) * 100);

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);

  const yesterdayCompletedCount = tasks.filter(
    (task) => task.completed && task.completedAt === yesterday,
  ).length;

  const weekStart = getWeekStartDate(new Date(), weekStartDay)
    .toISOString()
    .slice(0, 10);

  const weekCompletedCount = tasks.filter(
    (task) =>
      task.completed &&
      task.completedAt &&
      task.completedAt >= weekStart &&
      task.completedAt <= today,
  ).length;

  const routineYear = routineMonth.getFullYear();
  const routineMonthIndex = routineMonth.getMonth();

  function getRoutineKeyForMonth(routineId, day) {
    return getRoutineKey(routineId, day, routineYear, routineMonthIndex);
  }

  const daysInRoutineMonth = new Date(
    routineYear,
    routineMonthIndex + 1,
    0,
  ).getDate();

  const routineDays = Array.from(
    { length: daysInRoutineMonth },
    (_, index) => index + 1,
  );

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

  function getRoutineStreak(routineId) {
    let streak = 0;
    const checkDate = new Date();

    const isTodayChecked =
      routineChecks[getRoutineKeyForDate(routineId, checkDate)];

    if (!isTodayChecked) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (routineChecks[getRoutineKeyForDate(routineId, checkDate)]) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }

  const [hoveredDayIndex, setHoveredDayIndex] = useState(null);
  function getWeeklyProductivity() {
    const days = [];
    const localeCode = language === "tr" ? "tr-TR" : "en-US";
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const totalRoutines = routines.length;
      const completedRoutines = routines.filter(
        (routine) => routineChecks[getRoutineKeyForDate(routine.id, date)],
      ).length;

      const percent =
        totalRoutines === 0
          ? 0
          : Math.round((completedRoutines / totalRoutines) * 100);

      days.push({
        label: date.toLocaleDateString(localeCode, { weekday: "short" }),
        fullDate: date.toLocaleDateString(localeCode, {
          day: "numeric",
          month: "long",
        }),
        completed: completedRoutines,
        total: totalRoutines,
        percent,
      });
    }

    return days;
    const weeklyProductivity = getWeeklyProductivity();
  }

  const weeklyProductivity = getWeeklyProductivity();

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

  function getDashboardMessage() {
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

    const seedString = `${today}-${getGreetingSegment()}`;
    let hash = 0;

    for (let i = 0; i < seedString.length; i++) {
      hash = (hash * 31 + seedString.charCodeAt(i)) % pool.length;
    }

    return pool[hash];
  }

  function toggleRoutineCheck(routineId, day) {
    const key = getRoutineKeyForMonth(routineId, day);

    setRoutineChecks({
      ...routineChecks,
      [key]: !routineChecks[key],
    });
  }

  function addRoutine(event) {
    event.preventDefault();

    if (newRoutineTitle.trim() === "") {
      return;
    }

    const newRoutine = {
      id: crypto.randomUUID(),
      title: newRoutineTitle,
    };

    setRoutines([...routines, newRoutine]);
    setNewRoutineTitle("");
  }

  function deleteRoutine(id) {
    const filteredRoutines = routines.filter((routine) => routine.id !== id);
    setRoutines(filteredRoutines);

    const updatedChecks = {};

    Object.keys(routineChecks).forEach((key) => {
      const keyParts = key.split("-");
      const routineIdFromKey = Number(keyParts[2]);

      if (routineIdFromKey !== id) {
        updatedChecks[key] = routineChecks[key];
      }
    });

    setRoutineChecks(updatedChecks);
  }

  const filteredTasks = tasks.filter((task) => {
    if (!isVisibleInToday(task)) {
      return false;
    }

    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchText.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && !task.completed) ||
      (filter === "completed" && task.completed);

    return matchesSearch && matchesFilter;
  });

  const filteredArchiveTasks = tasks.filter((task) => {
    const matchesStatus =
      archiveStatusFilter === "all" ||
      (archiveStatusFilter === "completed" && task.completed) ||
      (archiveStatusFilter === "active" && !task.completed);

    const matchesStartDate =
      archiveStartDate === "" || task.date >= archiveStartDate;

    const matchesEndDate = archiveEndDate === "" || task.date <= archiveEndDate;

    return matchesStatus && matchesStartDate && matchesEndDate;
  });

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
  function handleDeleteTaskFromModal(taskId) {
    deleteTask(taskId);
    setSelectedTaskId(null);
  }

  function addProject(event) {
    event.preventDefault();

    if (newProjectName.trim() === "") {
      return;
    }

    const newProject = {
      id: crypto.randomUUID(),
      name: newProjectName,
    };

    setProjects([...projects, newProject]);
    setNewProjectsName("");
  }

  function deleteProject(id) {
    setProjects(projects.filter((project) => project.id !== id));
    clearProjectFromTasks(id);
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
      <Sidebar activePage={activePage} setActivePage={setActivePage} t={t} />

      <main className="main-content">
        <Header />
        <h2 className="page-title">{t[pageTitleKeyMap[activePage]]}</h2>

        {activePage === "Dashboard" && (
          <DashboardPage
            greeting={getGreeting()}
            dashboardMessage={getDashboardMessage()}
            todayTasksCount={todayTasksCount}
            completedTodayTasksCount={completedTodayTasksCount}
            allTaskCount={allTaskCount}
            completedTasksCount={completedTasksCount}
            activeTaskCount={activeTaskCount}
            overdueTaskCount={overdueTaskCount}
            todayCompletionPercent={todayCompletionPercent}
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
            addRoutine={addRoutine}
            newRoutineTitle={newRoutineTitle}
            setNewRoutineTitle={setNewRoutineTitle}
            setRoutineMounth={setRoutineMounth}
            routineYear={routineYear}
            routineMonthIndex={routineMonthIndex}
            routineDays={routineDays}
            routines={routines}
            deleteRoutine={deleteRoutine}
            routineChecks={routineChecks}
            getRoutineKey={getRoutineKeyForMonth}
            toggleRoutineCheck={toggleRoutineCheck}
            today={today}
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
            addProject={addProject}
            newProjectName={newProjectName}
            setNewProjectsName={setNewProjectsName}
            projects={projects}
            deleteProject={deleteProject}
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
