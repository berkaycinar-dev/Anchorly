import "./styles/index.css";
import { useEffect, useState, useRef, useMemo } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useMatch,
  useNavigate,
} from "react-router";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import useSidebar from "./hooks/useSidebar";
import StorageToasts from "./components/StorageToasts";
import TaskDetailModal from "./components/TaskDetailModal";
import ToastProvider from "./components/toast/ToastProvider";
import DashboardPage from "./pages/DashboardPage";
import TodayPage from "./pages/TodayPage";
import { strings } from "./strings";
import {
  routes,
  PROJECT_DETAIL_PATH,
  ARCHIVE_SERIES_PATH,
  getAuthRouteForPathname,
  getRouteForPathname,
} from "./routes";
import DailyRoutinePage from "./pages/DailyRoutinePage";
import CalendarPage from "./pages/CalendarPage";
import ArchivePage from "./pages/ArchivePage";
import ProjectsPage from "./pages/ProjectsPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import {
  addDaysToDateString,
  getLocalDateString,
  getWeekStartDate,
  getRoutineKeyForDate,
  parseLocalDate,
} from "./utils/dateHelpers";
import useToday from "./hooks/useToday";
import useTasks from "./hooks/useTasks";
import useRoutines from "./hooks/useRoutines";
import useProjects from "./hooks/useProjects";
import useSettings from "./hooks/useSettings";
import DataProvider from "./data/DataProvider";
import AuthProvider from "./auth/AuthProvider";
import useAuth from "./auth/useAuth";
import { isTaskVisibleToday } from "./utils/taskHelpers";

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

function AppContent() {
  const today = useToday();
  const {
    tasks,
    addTask,
    toggleTask,
    moveTaskToColumn,
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
    toggleRoutineForDate,
    addRoutine,
    deleteRoutine,
    getRoutineStreak,
    getWeeklyProductivity,
  } = useRoutines(today);

  const { projects, addProject, updateProject, deleteProject } = useProjects();

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { enabled: authEnabled } = useAuth();
  const authRoute = authEnabled ? getAuthRouteForPathname(pathname) : null;
  const currentRoute = authRoute ?? getRouteForPathname(pathname) ?? routes[0];
  const projectMatch = useMatch(PROJECT_DETAIL_PATH);
  const selectedProjectId = projectMatch ? projectMatch.params.projectId : null;
  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) || null;
  const seriesMatch = useMatch(ARCHIVE_SERIES_PATH);
  const selectedSeriesId = seriesMatch ? seriesMatch.params.groupId : null;

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("Work");
  const [newTaskDate, setNewTaskDate] = useState("");
  const newTaskTitleInputRef = useRef(null);
  const [filter, setFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const {
    theme,
    setTheme,
    language,
    setLanguage,
    fontFamily,
    setFontFamily,
    weekStartDay,
    setWeekStartDay,
    dashboardLayout,
    setDashboardLayout,
  } = useSettings();

  const t = strings[language];
  const sidebar = useSidebar();
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const afterTaskDetailCloseRef = useRef(null);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;

  function openTaskDetail(taskId, onClose = null) {
    afterTaskDetailCloseRef.current = onClose;
    setSelectedTaskId(taskId);
  }

  function closeTaskDetail() {
    const afterClose = afterTaskDetailCloseRef.current;
    afterTaskDetailCloseRef.current = null;
    setSelectedTaskId(null);
    afterClose?.();
  }
  const [newRoutineTitle, setNewRoutineTitle] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDueDate, setNewProjectDueDate] = useState("");

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.target.closest("dialog")) {
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
        navigate("/today");

        setTimeout(() => {
          newTaskTitleInputRef.current?.focus();
        }, 0);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate]);

  useEffect(() => {
    document.title = `Anchorly — ${t[currentRoute.titleKey]}`;
  }, [t, currentRoute]);

  const [newProjectTaskTitle, setNewProjectTaskTitle] = useState("");
  const [newProjectTaskDate, setNewProjectTaskDate] = useState(today);
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

  const routineCheckDate = parseLocalDate(today);
  const remainingRoutineCount = routines.filter(
    (routine) =>
      !routineChecks[getRoutineKeyForDate(routine.id, routineCheckDate)],
  ).length;

  const sidebarBadges = {
    Today: todayStats.active,
    "Daily Routine": remainingRoutineCount,
    Projects: projects.filter((project) => !project.archived).length,
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

  const weeklyProductivity = useMemo(
    () => getWeeklyProductivity(language),
    [getWeeklyProductivity, language],
  );

  const greetingSegment = getGreetingSegment();

  const dashboardMessage = useMemo(() => {
    const yesterday = addDaysToDateString(today, -1);

    const weekStart = getLocalDateString(
      getWeekStartDate(parseLocalDate(today), weekStartDay),
    );

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

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return t.greetingMorning;
    if (hour < 18) return t.greetingAfternoon;
    return t.greetingEvening;
  }

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

    addProject(newProjectName, newProjectDueDate);
    setNewProjectName("");
    setNewProjectDueDate("");
  }

  function handleDeleteProject(id) {
    deleteProject(id);
    clearProjectFromTasks(id);
  }

  function handleDeleteTaskFromModal(taskId) {
    deleteTask(taskId);
    closeTaskDetail();
  }

  function handleAssignProject(taskId, projectId) {
    const targetProject = projects.find((project) => project.id === projectId);

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

  function addTaskToDate(title, date) {
    addTask({ title, category: "Work", date });
  }

  const pages = {
    Dashboard: (
      <DashboardPage
        t={t}
        language={language}
        today={today}
        weekStartDay={weekStartDay}
        greeting={getGreeting()}
        dashboardMessage={dashboardMessage}
        tasks={tasks}
        todayScopedTasks={todayScopedTasks}
        todayStats={todayStats}
        weeklyProductivity={weeklyProductivity}
        routines={routines}
        routineChecks={routineChecks}
        getRoutineStreak={getRoutineStreak}
        projects={projects}
        layout={dashboardLayout}
        onSaveLayout={setDashboardLayout}
        onToggleRoutine={(routineId) => toggleRoutineForDate(routineId, today)}
        onOpenTask={openTaskDetail}
      />
    ),
    Today: (
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
    ),
    "Daily Routine": (
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
        toggleRoutineForDate={toggleRoutineForDate}
        getRoutineStreak={getRoutineStreak}
        weekStartDay={weekStartDay}
        language={language}
        today={today}
        t={t}
      />
    ),
    Calendar: (
      <CalendarPage
        calendarMonth={calendarMonth}
        setCalendarMonth={setCalendarMonth}
        tasks={tasks}
        today={today}
        weekStartDay={weekStartDay}
        t={t}
        language={language}
        onToggleTask={toggleTask}
        onOpenTask={setSelectedTaskId}
        onAddTask={addTaskToDate}
      />
    ),
    Archive: (
      <ArchivePage
        tasks={tasks}
        today={today}
        selectedSeriesId={selectedSeriesId}
        toggleTask={toggleTask}
        deleteTask={deleteTask}
        setSelectedTaskId={setSelectedTaskId}
        reorderTasks={reorderTasks}
        t={t}
      />
    ),
    Projects: (
      <ProjectsPage
        selectedProject={selectedProject}
        addProject={handleAddProject}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        newProjectDueDate={newProjectDueDate}
        setNewProjectDueDate={setNewProjectDueDate}
        projects={projects}
        updateProject={updateProject}
        deleteProject={handleDeleteProject}
        tasks={tasks}
        today={today}
        addProjectTask={addProjectTask}
        newProjectTaskTitle={newProjectTaskTitle}
        setNewProjectTaskTitle={setNewProjectTaskTitle}
        newProjectTaskDate={newProjectTaskDate}
        setNewProjectTaskDate={setNewProjectTaskDate}
        selectedProjectId={selectedProjectId}
        toggleTask={toggleTask}
        moveTaskToColumn={moveTaskToColumn}
        deleteTask={deleteTask}
        setSelectedTaskId={setSelectedTaskId}
        reorderTasks={reorderTasks}
        t={t}
      />
    ),
    Settings: (
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
    ),
  };

  const fontStyle = {
    "--font-main": `'${fontFamily}', system-ui, sans-serif`,
  };

  if (authRoute) {
    return (
      <div className={`auth-shell theme-${theme}`} style={fontStyle}>
        <Routes>
          <Route path="/login" element={<LoginPage t={t} />} />
          <Route
            path="/register"
            element={<RegisterPage t={t} language={language} />}
          />
        </Routes>
      </div>
    );
  }

  return (
    <div className={`app theme-${theme}`} style={fontStyle}>
      <ToastProvider closeLabel={t.closeButton}>
        <StorageToasts t={t} />
        <Sidebar
          t={t}
          badges={sidebarBadges}
          isExpanded={sidebar.isExpanded}
          isOverlayOpen={sidebar.isOverlayOpen}
          onToggle={sidebar.toggle}
          onNavigate={sidebar.closeOverlay}
        />
        <main className="main-content">
          <Header />
          <h2 className="page-title">{t[currentRoute.titleKey]}</h2>

          <Routes>
            {routes.map((route) => (
              <Route
                key={route.key}
                path={route.path}
                element={pages[route.key]}
              />
            ))}
            <Route
              path={PROJECT_DETAIL_PATH}
              element={
                selectedProject ? (
                  pages.Projects
                ) : (
                  <Navigate to="/projects" replace />
                )
              }
            />
            <Route
              path={ARCHIVE_SERIES_PATH}
              element={
                tasks.some(
                  (task) => task.repeatGroupId === selectedSeriesId,
                ) ? (
                  pages.Archive
                ) : (
                  <Navigate to="/archive" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <BottomNav t={t} badges={sidebarBadges} />

        <TaskDetailModal
          key={selectedTaskId ?? "none"}
          task={selectedTask}
          onClose={closeTaskDetail}
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
      </ToastProvider>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
