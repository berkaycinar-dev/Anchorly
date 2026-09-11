import "./App.css";
import { useEffect, useState, useRef } from "react";
import Statcard from "./components/Statcard";
import TaskList from "./components/TaskList";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import AddTaskForm from "./components/AddTaskForm";
import TaskDetailModal from "./components/TaskDetailModal";
import { strings } from "./strings";

const initialTasks = [
  {
    id: 1,
    title: "Finish React Project",
    category: "Work",
    date: "2026-08-05",
    completed: false,
    projectId: null,
    description: "",
    steps: [],
    completedAt: null,
    order: 0,
    repeat: "none",
    repeatGroupId: null,
    attachments: [],
  },
  {
    id: 2,
    title: "Buy groceries",
    category: "Personal",
    date: "2026-08-05",
    completed: false,
    projectId: null,
    description: "",
    steps: [],
    completedAt: null,
    order: 1,
    repeat: "none",
    repeatGroupId: null,
    attachments: [],
  },
  {
    id: 3,
    title: "Read 30 pages of a book",
    category: "Self Development",
    date: "2026-08-05",
    completed: false,
    projectId: null,
    description: "",
    steps: [],
    completedAt: null,
    order: 2,
    repeat: "none",
    repeatGroupId: null,
    attachments: [],
  },
  {
    id: 4,
    title: "Go to the gym",
    category: "Health",
    date: "2026-08-05",
    completed: true,
    projectId: null,
    description: "",
    steps: [],
    completedAt: null,
    order: 3,
    repeat: "none",
    repeatGroupId: null,
    attachments: [],
  },
  {
    id: 5,
    title: "Call mom",
    category: "Personal",
    date: "2026-08-06",
    completed: false,
    projectId: null,
    description: "",
    steps: [],
    completedAt: null,
    order: 4,
    repeat: "none",
    repeatGroupId: null,
    attachments: [],
  },
];
const initialRoutines = [
  {
    id: 1,
    title: "water",
  },
  {
    id: 2,
    title: "Read",
  },
  {
    id: 3,
    title: "Exercise",
  },
];

const initialProjects = [
  {
    id: 1,
    name: "ToDoApp",
  },
  {
    id: 2,
    name: "Portfolio",
  },
];

function getInitialProjects() {
  const savedProjects = localStorage.getItem("projects");

  if (savedProjects) {
    return JSON.parse(savedProjects);
  }

  return initialProjects;
}

function getInitialRoutines() {
  const savedRoutines = localStorage.getItem("routines");

  if (savedRoutines) {
    return JSON.parse(savedRoutines);
  }

  return initialRoutines;
}

function getInitialRoutineChecks() {
  const savedChecks = localStorage.getItem("routineChecks");

  if (savedChecks) {
    return JSON.parse(savedChecks);
  }

  return {};
}

function getInitialTasks() {
  const savedTasks = localStorage.getItem("tasks");

  if (savedTasks) {
    const parsedTasks = JSON.parse(savedTasks);

    return parsedTasks.map((task, index) => ({
      description: "",
      steps: [],
      completedAt: null,
      order: index,
      repeat: "none",
      repeatGroupId: null,
      attachments: [],
      ...task,
    }));
  }

  return initialTasks;
}

function App() {
  const [tasks, setTasks] = useState(getInitialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("Work");
  const [newTaskDate, setNewTaskDate] = useState("");
  const newTaskTitleInputRef = useRef(null);
  const [filter, setFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "tr";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = strings[language];
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const [activePage, setActivePage] = useState("DashBoard");
  const [routines, setRoutines] = useState(getInitialRoutines);
  const [routineChecks, setRoutineChecks] = useState(getInitialRoutineChecks);
  const [routineMonth, setRoutineMounth] = useState(new Date());
  const [newRoutineTitle, setNewRoutineTitle] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState("month");
  const [calendarWeekStart, setCalendarWeekStart] = useState(new Date());
  const [archiveStatusFilter, setArchiveStatusFilter] = useState("all");
  const [archiveStartDate, setArchiveStartDate] = useState("");
  const [archiveEndDate, setArchiveEndDate] = useState("");
  const [projects, setProjects] = useState(getInitialProjects);
  const [newProjectName, setNewProjectsName] = useState("");

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("routineChecks", JSON.stringify(routineChecks));
  }, [routineChecks]);

  useEffect(() => {
    localStorage.setItem("routines", JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const latestByGroup = {};

    tasks.forEach((task) => {
      if (task.repeat !== "none" && task.repeatGroupId && task.date) {
        const current = latestByGroup[task.repeatGroupId];

        if (!current || task.date > current.date) {
          latestByGroup[task.repeatGroupId] = task;
        }
      }
    });

    const newTasks = [];

    Object.values(latestByGroup).forEach((latestTask) => {
      let nextDate = latestTask.date;
      let safetyCounter = 0;

      while (nextDate < today && safetyCounter < 60) {
        nextDate = getNextRepeatDate(nextDate, latestTask.repeat);
        safetyCounter++;
      }

      const alreadyExists = tasks.some(
        (task) =>
          task.repeatGroupId === latestTask.repeatGroupId &&
          task.date === nextDate,
      );

      if (nextDate !== latestTask.date && !alreadyExists) {
        newTasks.push({
          ...latestTask,
          id: crypto.randomUUID(),
          date: nextDate,
          completed: false,
          completedAt: null,
          order: Date.now(),
          steps: latestTask.steps.map((step) => ({ ...step, done: false })),
        });
      }
    });

    if (newTasks.length > 0) {
      setTasks((currentTasks) => [...currentTasks, ...newTasks]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const today = new Date().toISOString().slice(0, 10);
  function isVisibleInToday(task) {
    const isDateless = !task.date;
    const isTodayDated = task.date === today;
    const belongsToToday = isDateless || isTodayDated;

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

  const routineYear = routineMonth.getFullYear();
  const routineMonthIndex = routineMonth.getMonth();

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

  const calendarStartDay = firstDayOfCalendarMonth.getDay();

  const calendarDays = Array.from(
    { length: daysInCalendarMonth },
    (_, index) => index + 1,
  );
  function getWeekDays(anchorDate) {
    const startOfWeek = new Date(anchorDate);
    startOfWeek.setDate(anchorDate.getDate() - anchorDate.getDay());

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + index);
      return day;
    });
  }

  const weekDays = getWeekDays(calendarWeekStart);

  function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Günaydın";
    }

    if (hour < 18) {
      return "İyi günler";
    }

    return "İyi akşamlar";
  }

  function getRoutineKey(routineId, day) {
    const monthKey = `${routineYear}-${routineMonthIndex + 1}`;
    return `${monthKey}-${routineId}-${day}`;
  }

  function getRoutineKeyForDate(routineId, date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month}-${routineId}-${day}`;
  }
  const [hoveredDayIndex, setHoveredDayIndex] = useState(null);
  function getWeeklyProductivity() {
    const days = [];

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
        label: date.toLocaleDateString("tr-TR", { weekday: "short" }),
        fullDate: date.toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
        }),
        completed: completedRoutines,
        total: totalRoutines,
        percent,
      });
    }

    return days;
  }

  function getNextRepeatDate(dateString, repeat) {
    const date = new Date(dateString);

    if (repeat === "daily") {
      date.setDate(date.getDate() + 1);
    } else if (repeat === "weekly") {
      date.setDate(date.getDate() + 7);
    }

    return date.toISOString().slice(0, 10);
  }

  const weeklyProductivity = getWeeklyProductivity();

  function toggleRoutineCheck(routineId, day) {
    const key = getRoutineKey(routineId, day);

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

  function toggleTask(id) {
    const updatedTasks = tasks.map((task) => {
      if (task.id === id) {
        const isNowCompleted = !task.completed;

        return {
          ...task,
          completed: isNowCompleted,
          completedAt: isNowCompleted ? today : null,
        };
      }

      return task;
    });

    setTasks(updatedTasks);
  }

  function addTask(event) {
    event.preventDefault();

    if (newTaskTitle.trim() === "") {
      return;
    }

    const newTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      category: newTaskCategory,
      date: newTaskDate,
      completed: false,
      projectId: null,
      description: "",
      steps: [],
      completedAt: null,
      order: Date.now(),
      repeat: "none",
      repeatGroupId: null,
      attachments: [],
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle("");
    setNewTaskCategory("Work");
    setNewTaskDate("");
  }

  function updateTaskDescription(taskId, newDescription) {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, description: newDescription } : task,
      ),
    );
  }

  function addTaskStep(taskId, stepText) {
    if (stepText.trim() === "") {
      return;
    }

    const newStep = { id: crypto.randomUUID(), text: stepText, done: false };

    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? { ...task, steps: [...task.steps, newStep] }
          : task,
      ),
    );
  }

  function toggleTaskStep(taskId, stepId) {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              steps: task.steps.map((step) =>
                step.id === stepId ? { ...step, done: !step.done } : step,
              ),
            }
          : task,
      ),
    );
  }

  function deleteTaskStep(taskId, stepId) {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? { ...task, steps: task.steps.filter((step) => step.id !== stepId) }
          : task,
      ),
    );
  }

  function updateTaskRepeat(taskId, newRepeat) {
    setTasks(
      tasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        if (newRepeat === "none") {
          return { ...task, repeat: "none", repeatGroupId: null };
        }

        return {
          ...task,
          repeat: newRepeat,
          repeatGroupId: task.repeatGroupId || crypto.randomUUID(),
        };
      }),
    );
  }

  function addTaskAttachment(taskId, attachment) {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? { ...task, attachments: [...task.attachments, attachment] }
          : task,
      ),
    );
  }

  function deleteTaskAttachment(taskId, attachmentId) {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              attachments: task.attachments.filter(
                (attachment) => attachment.id !== attachmentId,
              ),
            }
          : task,
      ),
    );
  }

  function deleteTask(id) {
    const filteredTasks = tasks.filter((task) => task.id !== id);
    setTasks(filteredTasks);
  }

  function reorderTasks(draggedId, targetId) {
    if (draggedId === String(targetId)) {
      return;
    }

    const activeTasksSorted = tasks
      .filter((task) => !task.completed)
      .sort((a, b) => a.order - b.order);

    const draggedIndex = activeTasksSorted.findIndex(
      (task) => String(task.id) === draggedId,
    );
    const targetIndex = activeTasksSorted.findIndex(
      (task) => task.id === targetId,
    );

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    const reordered = [...activeTasksSorted];
    const [draggedTask] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedTask);

    const orderMap = {};
    reordered.forEach((task, index) => {
      orderMap[task.id] = index;
    });

    setTasks(
      tasks.map((task) =>
        orderMap[task.id] !== undefined
          ? { ...task, order: orderMap[task.id] }
          : task,
      ),
    );
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
    const filteredProjects = projects.filter((project) => project.id !== id);
    setProjects(filteredProjects);
  }

  function addProjectTask(event) {
    event.preventDefault();

    if (newProjectTaskTitle.trim() === "") {
      return;
    }

    const newTask = {
      id: crypto.randomUUID(),
      title: newProjectTaskTitle,
      category: "Project",
      date: newProjectTaskDate,
      completed: false,
      projectId: selectedProjectId,
      description: "",
      steps: [],
      completedAt: null,
      attachments: [],
    };

    setTasks([...tasks, newTask]);
    setNewProjectTaskTitle("");
    setNewProjectTaskDate(today);
  }

  return (
    <div className={`app theme-${theme}`}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} t={t} />

      <main className="main-content">
        <Header />
        <h2 className="page-title">{activePage}</h2>

        {activePage === "Dashboard" && (
          <section className="dashboard-page">
            <div className="dashboard-welcome">
              <h2>{getGreeting()}</h2>
              <p>
                Bugünkü {todayTasksCount} görevin var.{" "}
                {completedTodayTasksCount} tanesini tamamladın.
              </p>
            </div>

            <section className="stats">
              <Statcard title="Today's Task" value={allTaskCount} />
              <Statcard title="Completed" value={completedTasksCount} />
              <Statcard title="In Progress" value={activeTaskCount} />
              <Statcard title="Overdue" value={overdueTaskCount} />
            </section>

            <section className="dashboard-grid">
              <div className="chart-card">
                <h3>Bugünkü Görev Durumu</h3>

                <div
                  className="pie-chart"
                  style={{
                    background: `conic-gradient(#7c3aed ${todayCompletionPercent}%, #e5e7eb 0)`,
                  }}
                >
                  <span>{todayCompletionPercent}%</span>
                </div>

                <p>
                  {completedTodayTasksCount} / {todayTasksCount} tamamlandı
                </p>
                <div className="chart-legend">
                  <span className="legend-dot legend-done"></span> Tamamlanan
                  <span className="legend-dot legend-pending"></span> Bekleyen
                </div>
              </div>
              <div className="chart-card">
                <h3>Haftalık Productivity</h3>

                <div className="weekly-chart">
                  {weeklyProductivity.map((day, index) => (
                    <div
                      className="weekly-bar-wrapper"
                      key={index}
                      onMouseEnter={() => setHoveredDayIndex(index)}
                      onMouseLeave={() => setHoveredDayIndex(null)}
                    >
                      {hoveredDayIndex === index && (
                        <div className="weekly-bar-tooltip">
                          <strong>{day.fullDate}</strong>
                          <span>
                            {day.completed} / {day.total} rutin
                          </span>
                          <span>%{day.percent}</span>
                        </div>
                      )}

                      <div
                        className="weekly-bar"
                        style={{ height: `${day.percent}%` }}
                      ></div>
                      <span>{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </section>
        )}

        {activePage === "Daily Routine" && (
          <section className="routine-page">
            <div className="routine-header">
              <div>
                <h2>Günlük Rutin</h2>
                <p>
                  {routineMonth.toLocaleDateString("tr-TR", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <form className="routine-form" onSubmit={addRoutine}>
                <input
                  type="text"
                  placeholder="Yeni rutin ekle..."
                  value={newRoutineTitle}
                  onChange={(event) => setNewRoutineTitle(event.target.value)}
                />
                <button type="submit">Rutin Ekle</button>
              </form>

              <div className="routine-month-actions">
                <button
                  onClick={() =>
                    setRoutineMounth(
                      new Date(routineYear, routineMonthIndex - 1, 1),
                    )
                  }
                >
                  Önceki Ay
                </button>

                <button
                  onClick={() =>
                    setRoutineMounth(
                      new Date(routineYear, routineMonthIndex + 1, 1),
                    )
                  }
                >
                  Sonraki Ay
                </button>
              </div>
            </div>

            <div className="routine-table-wrapper">
              <table className="routine-table">
                <thead>
                  <tr>
                    <th>Rutin</th>
                    {routineDays.map((day) => (
                      <th key={day}>{day}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {routines.map((routine) => (
                    <tr key={routine.id}>
                      <td>
                        <div className="routine-name-cell">
                          <span>{routine.title}</span>
                          <button
                            className="routine-delete-button"
                            aria-label="Rutini sil"
                            onClick={() => deleteRoutine(routine.id)}
                          >
                            x
                          </button>
                        </div>
                      </td>

                      {routineDays.map((day) => (
                        <td key={day}>
                          <input
                            type="checkbox"
                            checked={Boolean(
                              routineChecks[getRoutineKey(routine.id, day)],
                            )}
                            onChange={() => toggleRoutineCheck(routine.id, day)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activePage === "Today" && (
          <>
            <div className="search-box">
              <input
                type="text"
                placeholder="Görev ara..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <AddTaskForm
              newTaskTitle={newTaskTitle}
              setNewTaskTitle={setNewTaskTitle}
              newTaskCategory={newTaskCategory}
              setNewTaskCategory={setNewTaskCategory}
              newTaskDate={newTaskDate}
              setNewTaskDate={setNewTaskDate}
              addTask={addTask}
              titleInputRef={newTaskTitleInputRef}
            />

            <section className="task-section">
              <div className="task-section-header">
                <h2>Today's Tasks</h2>

                <div className="filters">
                  <button
                    className={filter === "all" ? "active-filter" : ""}
                    onClick={() => setFilter("all")}
                  >
                    All
                  </button>

                  <button
                    className={filter === "active" ? "active-filter" : ""}
                    onClick={() => setFilter("active")}
                  >
                    Active
                  </button>

                  <button
                    className={filter === "completed" ? "active-filter" : ""}
                    onClick={() => setFilter("completed")}
                  >
                    Completed
                  </button>
                </div>
              </div>

              <TaskList
                tasks={filteredTasks}
                toggleTask={toggleTask}
                deleteTask={deleteTask}
                onSelectTask={setSelectedTaskId}
                onReorderTasks={reorderTasks}
              />
            </section>
          </>
        )}

        {activePage === "Calendar" && (
          <section className="calendar-page">
            <div className="routine-header">
              <div>
                <h2>Takvim</h2>
                <p>
                  {calendarViewMode === "month"
                    ? calendarMonth.toLocaleDateString("tr-TR", {
                        month: "long",
                        year: "numeric",
                      })
                    : `${weekDays[0].toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} - ${weekDays[6].toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}`}
                </p>
              </div>

              <div className="routine-month-actions">
                <button
                  className={
                    calendarViewMode === "month" ? "active-view-toggle" : ""
                  }
                  onClick={() => setCalendarViewMode("month")}
                >
                  Aylık
                </button>

                <button
                  className={
                    calendarViewMode === "week" ? "active-view-toggle" : ""
                  }
                  onClick={() => setCalendarViewMode("week")}
                >
                  Haftalık
                </button>

                {calendarViewMode === "month" && (
                  <>
                    <button
                      onClick={() =>
                        setCalendarMonth(
                          new Date(calendarYear, calendarMonthIndex - 1, 1),
                        )
                      }
                    >
                      Önceki Ay
                    </button>

                    <button
                      onClick={() =>
                        setCalendarMonth(
                          new Date(calendarYear, calendarMonthIndex + 1, 1),
                        )
                      }
                    >
                      Sonraki Ay
                    </button>
                  </>
                )}

                {calendarViewMode === "week" && (
                  <>
                    <button
                      onClick={() => {
                        const newDate = new Date(calendarWeekStart);
                        newDate.setDate(newDate.getDate() - 7);
                        setCalendarWeekStart(newDate);
                      }}
                    >
                      Önceki Hafta
                    </button>

                    <button
                      onClick={() => {
                        const newDate = new Date(calendarWeekStart);
                        newDate.setDate(newDate.getDate() + 7);
                        setCalendarWeekStart(newDate);
                      }}
                    >
                      Sonraki Hafta
                    </button>
                  </>
                )}
              </div>
            </div>

            {calendarViewMode === "month" && (
              <div className="calendar-grid">
                {["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"].map(
                  (dayName) => (
                    <div className="calendar-day-name" key={dayName}>
                      {dayName}
                    </div>
                  ),
                )}

                {Array.from({ length: calendarStartDay }).map((_, index) => (
                  <div
                    className="calendar-cell empty"
                    key={`empty-${index}`}
                  ></div>
                ))}

                {calendarDays.map((day) => (
                  <div
                    className="calendar-cell"
                    key={day}
                    onClick={() => {
                      const selectedDate = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      setNewTaskDate(selectedDate);
                      setActivePage("Today");
                    }}
                  >
                    <strong>{day}</strong>

                    <div className="calendar-tasks">
                      {tasks
                        .filter((task) => {
                          const date = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                          return task.date === date;
                        })
                        .map((task) => (
                          <div className="calendar-task" key={task.id}>
                            {task.title}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {calendarViewMode === "week" && (
              <div className="calendar-grid calendar-grid-week">
                {weekDays.map((day) => (
                  <div className="calendar-day-name" key={`name-${day}`}>
                    {day.toLocaleDateString("tr-TR", { weekday: "short" })}
                  </div>
                ))}

                {weekDays.map((day) => {
                  const dateString = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;

                  return (
                    <div
                      className="calendar-cell"
                      key={dateString}
                      onClick={() => {
                        setNewTaskDate(dateString);
                        setActivePage("Today");
                      }}
                    >
                      <strong>{day.getDate()}</strong>

                      <div className="calendar-tasks">
                        {tasks
                          .filter((task) => task.date === dateString)
                          .map((task) => (
                            <div className="calendar-task" key={task.id}>
                              {task.title}
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activePage === "Archive" && (
          <section className="archive-page">
            <div className="dashboard-welcome">
              <h2>Arşiv</h2>
              <p>
                Bugüne kadar eklenmiş ve silinmemiş tüm görevler burada
                listelenir.
              </p>
            </div>

            <div className="archive-filters">
              <select
                value={archiveStatusFilter}
                onChange={(event) => setArchiveStatusFilter(event.target.value)}
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Devam Eden</option>
                <option value="completed">Tamamlanan</option>
              </select>

              <input
                type="date"
                value={archiveStartDate}
                onChange={(event) => setArchiveStartDate(event.target.value)}
              />

              <input
                type="date"
                value={archiveEndDate}
                onChange={(event) => setArchiveEndDate(event.target.value)}
              />

              <button
                onClick={() => {
                  setArchiveStatusFilter("all");
                  setArchiveStartDate("");
                  setArchiveEndDate("");
                }}
              >
                Temizle
              </button>
            </div>

            <TaskList
              tasks={filteredArchiveTasks}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              onSelectTask={setSelectedTaskId}
              onReorderTasks={reorderTasks}
            />
          </section>
        )}

        {activePage === "Projects" && !selectedProject && (
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

              <button type="submit">Proje Ekle</button>
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
                    {
                      tasks.filter((task) => task.projectId === project.id)
                        .length
                    }{" "}
                    görev
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {activePage === "Projects" && selectedProject && (
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

              <button type="submit">Görev Ekle</button>
            </form>

            <TaskList
              tasks={tasks.filter(
                (task) => task.projectId === selectedProjectId,
              )}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              onSelectTask={setSelectedTaskId}
              onReorderTasks={reorderTasks}
            />
          </section>
        )}

        {activePage === "Settings" && (
          <section className="settings-page">
            <div className="dashboard-welcome">
              <h2>{t.settingsTitle}</h2>
              <p>{t.settingsDescription}</p>
            </div>

            <div className="settings-section">
              <h3>{t.themeLabel}</h3>

              <div className="theme-options">
                {["light", "dark", "ocean"].map((themeOption) => (
                  <button
                    key={themeOption}
                    className={
                      theme === themeOption
                        ? "theme-option active-theme"
                        : "theme-option"
                    }
                    onClick={() => setTheme(themeOption)}
                  >
                    {themeOption}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-section">
              <h3>{t.languageLabel}</h3>

              <div className="theme-options">
                {["tr", "en"].map((languageOption) => (
                  <button
                    key={languageOption}
                    className={
                      language === languageOption
                        ? "theme-option active-theme"
                        : "theme-option"
                    }
                    onClick={() => setLanguage(languageOption)}
                  >
                    {languageOption.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onUpdateDescription={updateTaskDescription}
        onAddStep={addTaskStep}
        onToggleStep={toggleTaskStep}
        onDeleteStep={deleteTaskStep}
        onUpdateRepeat={updateTaskRepeat}
        onAddAttachment={addTaskAttachment}
        onDeleteAttachment={deleteTaskAttachment}
      />
    </div>
  );
}

export default App;
