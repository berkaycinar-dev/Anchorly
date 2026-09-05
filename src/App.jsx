import "./App.css";
import { useEffect, useState } from "react";
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

    return parsedTasks.map((task) => ({
      description: "",
      steps: [],
      ...task,
    }));
  }

  return initialTasks;
}

function App() {
  const [tasks, setTasks] = useState(getInitialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("Work");
  const [newTaskDate, setNewTaskDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
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

  const allTaskCount = tasks.length;
  const completedTasksCount = tasks.filter((task) => task.completed).length;
  const activeTaskCount = tasks.filter((task) => !task.completed).length;
  const today = new Date().toISOString().slice(0, 10);
  const overdueTaskCount = tasks.filter(
    (task) => !task.completed && task.date < today,
  ).length;
  const todayTasks = tasks.filter((task) => task.date === today);
  const todayTasksCount = todayTasks.length;
  const completedTodayTasksCount = todayTasks.filter(
    (tasks) => tasks.completed,
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
        percent,
      });
    }

    return days;
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
      id: Date.now(),
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
        return {
          ...task,
          completed: !task.completed,
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
      id: Date.now(),
      title: newTaskTitle,
      category: newTaskCategory,
      date: newTaskDate,
      completed: false,
      projectId: null,
      description: "",
      steps: [],
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle("");
    setNewTaskCategory("Work");
    setNewTaskDate(new Date().toISOString().slice(0, 10));
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

    const newStep = { id: Date.now(), text: stepText, done: false };

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

  function deleteTask(id) {
    const filteredTasks = tasks.filter((task) => task.id !== id);
    setTasks(filteredTasks);
  }

  function addProject(event) {
    event.preventDefault();

    if (newProjectName.trim() === "") {
      return;
    }

    const newProject = {
      id: Date.now(),
      name: newProjectName,
    };

    setProjects([...projects, newProject]);
    setNewProjectsName("");
  }

  function deleteProject(id) {
    const filteredProjects = projects.filter((project) => project.id !== id);
    setProjects(filteredProjects);
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
              <Statcard title="All Tasks" value={allTaskCount} />
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
                    <div className="weekly-bar-wrapper" key={index}>
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
                          <button onClick={() => deleteRoutine(routine.id)}>
                            Sil
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
                  {calendarMonth.toLocaleDateString("tr-TR", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="routine-month-actions">
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
              </div>
            </div>

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
            />
          </section>
        )}

        {activePage === "Projects" && (
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
                <div className="project-card" key={project.id}>
                  <div className="project-card-header">
                    <h3>{project.name}</h3>
                    <button onClick={() => deleteProject(project.id)}>
                      Sil
                    </button>
                  </div>

                  <p>Bu proje için görevler sonraki adımda eklenecek.</p>
                </div>
              ))}
            </div>
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
      />
    </div>
  );
}

export default App;
