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
import MobileBrandBar from "./components/MobileBrandBar";
import useSidebar from "./hooks/useSidebar";
import ImportPrompt from "./components/account/ImportPrompt";
import TermsUpdateDialog from "./components/legal/TermsUpdateDialog";
import useTermsPending from "./components/legal/useTermsPending";
import DataErrorToasts from "./components/data/DataErrorToasts";
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
  getLegalRouteForPathname,
  getRouteForPathname,
} from "./routes";
import DailyRoutinePage from "./pages/DailyRoutinePage";
import CalendarPage from "./pages/CalendarPage";
import ArchivePage from "./pages/ArchivePage";
import ProjectsPage from "./pages/ProjectsPage";
import SettingsPage from "./pages/SettingsPage";
import LegalPage from "./pages/LegalPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ConfirmEmailPage from "./pages/ConfirmEmailPage";
import AccountPage from "./pages/AccountPage";
import GuestBanner from "./components/auth/GuestBanner";
import SyncStatusBar from "./components/data/SyncStatusBar";
import VerificationBanner from "./components/auth/VerificationBanner";
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
import { isTaskOverdue, isTaskVisibleToday } from "./utils/taskHelpers";

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

const GREETING_KEYS = {
  morning: "greetingMorning",
  afternoon: "greetingAfternoon",
  evening: "greetingEvening",
};

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
    toggleTaskImportant,
    updateTaskTime,
    updateTaskCategory,
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
  const termsPending = useTermsPending();
  const legalRoute = getLegalRouteForPathname(pathname);
  const authRoute = authEnabled ? getAuthRouteForPathname(pathname) : null;
  const currentRoute =
    legalRoute ?? authRoute ?? getRouteForPathname(pathname) ?? routes[0];
  const projectMatch = useMatch(PROJECT_DETAIL_PATH);
  const selectedProjectId = projectMatch ? projectMatch.params.projectId : null;
  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) || null;
  const seriesMatch = useMatch(ARCHIVE_SERIES_PATH);
  const selectedSeriesId = seriesMatch ? seriesMatch.params.groupId : null;

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [newTaskRepeat, setNewTaskRepeat] = useState("none");
  const newTaskTitleInputRef = useRef(null);

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

  const routeKey = currentRoute?.key ?? null;
  const [previousRouteKey, setPreviousRouteKey] = useState(routeKey);

  if (previousRouteKey !== routeKey) {
    setPreviousRouteKey(routeKey);

    if (previousRouteKey === "Today") {
      setSelectedTaskId(null);
    }
  }

  const isTaskDetailInPanel = routeKey === "Today";
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
  const todayScopedTasks = useMemo(
    () => tasks.filter((task) => isTaskVisibleToday(task, today)),
    [tasks, today],
  );

  const todayPageTasks = useMemo(
    () =>
      tasks.filter(
        (task) => isTaskVisibleToday(task, today) || isTaskOverdue(task, today),
      ),
    [tasks, today],
  );

  const todayPageStats = useMemo(
    () => ({
      remaining: todayPageTasks.filter((task) => !task.completed).length,
      completed: todayPageTasks.filter((task) => task.completed).length,
      overdue: todayPageTasks.filter((task) => isTaskOverdue(task, today))
        .length,
    }),
    [todayPageTasks, today],
  );

  const todayStats = useMemo(() => {
    const total = todayScopedTasks.length;
    const completed = todayScopedTasks.filter(
      (task) => task.completed && task.completedAt === today,
    ).length;
    const active = todayScopedTasks.filter((task) => !task.completed).length;
    const overdue = tasks.filter((task) => isTaskOverdue(task, today)).length;
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
    Today: todayPageStats.remaining,
    "Daily Routine": remainingRoutineCount,
    Projects: projects.filter((project) => !project.archived).length,
  };

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

  function handleAddTask(event) {
    event.preventDefault();

    if (newTaskTitle.trim() === "") {
      return;
    }

    const hasRepeat = newTaskRepeat !== "none";

    addTask({
      title: newTaskTitle.trim(),
      category: "Other",
      date: hasRepeat && newTaskDate === "" ? today : newTaskDate,
      dueTime: newTaskTime,
      repeat: newTaskRepeat,
    });

    setNewTaskTitle("");
    setNewTaskDate("");
    setNewTaskTime("");
    setNewTaskRepeat("none");
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

  const taskDetailActions = {
    onDeleteTask: handleDeleteTaskFromModal,
    onUpdateTitle: updateTaskTitle,
    onUpdateDate: updateTaskDate,
    onUpdateTime: updateTaskTime,
    onUpdateCategory: updateTaskCategory,
    onUpdateDescription: updateTaskDescription,
    onAddStep: addTaskStep,
    onToggleStep: toggleTaskStep,
    onDeleteStep: deleteTaskStep,
    onUpdateRepeat: updateTaskRepeat,
    onAddAttachment: addTaskAttachment,
    onDeleteAttachment: deleteTaskAttachment,
    onAssignProject: handleAssignProject,
  };

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
      date: "",
      projectId: selectedProjectId,
    });

    setNewProjectTaskTitle("");
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
        greeting={t[GREETING_KEYS[greetingSegment]]}
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
        today={today}
        newTaskTitle={newTaskTitle}
        setNewTaskTitle={setNewTaskTitle}
        newTaskDate={newTaskDate}
        setNewTaskDate={setNewTaskDate}
        newTaskTime={newTaskTime}
        setNewTaskTime={setNewTaskTime}
        newTaskRepeat={newTaskRepeat}
        setNewTaskRepeat={setNewTaskRepeat}
        addTask={handleAddTask}
        titleInputRef={newTaskTitleInputRef}
        tasks={todayPageTasks}
        stats={todayPageStats}
        toggleTask={toggleTask}
        toggleImportant={toggleTaskImportant}
        deleteTask={deleteTask}
        selectedTask={isTaskDetailInPanel ? selectedTask : null}
        setSelectedTaskId={setSelectedTaskId}
        closeTaskDetail={closeTaskDetail}
        detailActions={taskDetailActions}
        projects={projects}
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

  if (legalRoute) {
    return (
      <div className={`auth-shell theme-${theme}`} style={fontStyle}>
        <LegalPage
          t={t}
          language={language}
          documentKey={legalRoute.key === "Privacy" ? "privacy" : "terms"}
        />
      </div>
    );
  }

  if (authRoute) {
    return (
      <div className={`auth-shell theme-${theme}`} style={fontStyle}>
        <Routes>
          <Route path="/login" element={<LoginPage t={t} />} />
          <Route
            path="/register"
            element={<RegisterPage t={t} language={language} />}
          />
          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage t={t} />}
          />
          <Route path="/reset-password" element={<ResetPasswordPage t={t} />} />
          <Route path="/verify-email" element={<VerifyEmailPage t={t} />} />
          <Route path="/confirm-email" element={<ConfirmEmailPage t={t} />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className={`app theme-${theme}`} style={fontStyle}>
      <ToastProvider closeLabel={t.closeButton}>
        <StorageToasts t={t} />
        <DataErrorToasts t={t} />
        <TermsUpdateDialog t={t} />
        {termsPending ? null : <ImportPrompt t={t} />}
        <Sidebar
          t={t}
          badges={sidebarBadges}
          isExpanded={sidebar.isExpanded}
          isOverlayOpen={sidebar.isOverlayOpen}
          onToggle={sidebar.toggle}
          onNavigate={sidebar.closeOverlay}
        />
        <main className="main-content">
          <VerificationBanner t={t} />
          <GuestBanner t={t} />
          <SyncStatusBar t={t} />
          <Header />
          <div
            key={routeKey ?? "other"}
            className={routeKey === "Dashboard" ? undefined : "page-enter"}
          >
            {routeKey === "Dashboard" && <MobileBrandBar t={t} />}
            {routeKey !== "Today" && (
              <h2 className="page-title">{t[currentRoute.titleKey]}</h2>
            )}

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
              <Route
                path="/account"
                element={
                  authEnabled ? (
                    <AccountPage t={t} language={language} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        <BottomNav t={t} badges={sidebarBadges} />

        <TaskDetailModal
          key={selectedTaskId ?? "none"}
          task={isTaskDetailInPanel ? null : selectedTask}
          onClose={closeTaskDetail}
          onToggleTask={toggleTask}
          onToggleImportant={toggleTaskImportant}
          {...taskDetailActions}
          projects={projects}
          t={t}
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
