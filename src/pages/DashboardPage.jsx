import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  closestCenter,
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import {
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Clock,
  Pencil,
} from "lucide-react";
import Icon from "../components/Icon";
import DashboardCardFrame from "../components/dashboard/DashboardCardFrame";
import DashboardSlot from "../components/dashboard/DashboardSlot";
import CardLibrary from "../components/dashboard/CardLibrary";
import DayTasksDialog from "../components/dashboard/DayTasksDialog";
import useDashboardEditor from "../components/dashboard/useDashboardEditor";
import { CARD_BODIES } from "../components/dashboard/cardBodies";
import {
  getCardDefinition,
  getLayoutSlots,
  UPCOMING_DAYS_AHEAD,
} from "../constants/dashboardCards";
import { getProjectPath } from "../routes";
import {
  getCategoryCounts,
  getMonthCells,
  getOverdueTasks,
  getProjectProgress,
  getTasksForDate,
  getUpcomingDays,
  getWeekdayLabels,
  getWeekRange,
} from "../utils/dashboardData";
import { getRoutineKeyForDate, parseLocalDate } from "../utils/dateHelpers";

const SILENT_ANNOUNCEMENTS = {
  onDragStart: () => undefined,
  onDragOver: () => undefined,
  onDragEnd: () => undefined,
  onDragCancel: () => undefined,
};

function createFormatter(locale, options) {
  const formatter = new Intl.DateTimeFormat(locale, options);

  return (date) => formatter.format(parseLocalDate(date));
}

function getCardMeta(id, data, t) {
  switch (id) {
    case "todayTasks":
      return `${data.todayStats.completed} / ${data.todayStats.total}`;
    case "routines":
      return `${data.routines.filter((routine) => routine.checked).length} / ${data.routines.length}`;
    case "weeklyRoutine":
      return t.averagePercentLabel(data.weeklyAverage);
    case "upcoming":
      return t.taskCountLabel(
        data.upcoming.reduce((sum, day) => sum + day.tasks.length, 0),
      );
    case "projects":
      return t.activeCountLabel(data.projects.length);
    case "categories":
      return t.taskCountLabel(
        data.categories.reduce((sum, entry) => sum + entry.count, 0),
      );
    default:
      return null;
  }
}

function DashboardPage({
  t,
  language,
  today,
  weekStartDay,
  greeting,
  dashboardMessage,
  tasks,
  todayScopedTasks,
  todayStats,
  weeklyProductivity,
  routines,
  routineChecks,
  getRoutineStreak,
  projects,
  layout,
  onSaveLayout,
  onToggleRoutine,
  onOpenTask,
}) {
  const navigate = useNavigate();
  const [dayDialogDate, setDayDialogDate] = useState(null);
  const editor = useDashboardEditor({ layout, onSave: onSaveLayout, t });
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );
  const locale = language === "tr" ? "tr-TR" : "en-US";

  const data = useMemo(() => {
    const todayDate = parseLocalDate(today);
    const totals = weeklyProductivity.reduce(
      (sum, day) => sum + day.percent,
      0,
    );

    return {
      today,
      todayStats: {
        completed: todayStats.completed,
        total: todayStats.total,
        percent: todayStats.completionPercent,
      },
      todayTasks: [...todayScopedTasks].sort(
        (a, b) => Number(a.completed) - Number(b.completed),
      ),
      overdue: getOverdueTasks(tasks, today),
      upcoming: getUpcomingDays(tasks, today, UPCOMING_DAYS_AHEAD),
      weekly: weeklyProductivity,
      weeklyAverage:
        weeklyProductivity.length === 0
          ? 0
          : Math.round(totals / weeklyProductivity.length),
      routines: routines.map((routine) => ({
        id: routine.id,
        title: routine.title,
        checked: Boolean(
          routineChecks[getRoutineKeyForDate(routine.id, todayDate)],
        ),
        streak: getRoutineStreak(routine.id),
      })),
      projects: getProjectProgress(projects, tasks),
      monthCells: getMonthCells(today, weekStartDay),
      taskDates: new Set(
        tasks
          .filter(
            (task) => task.date && task.date.slice(0, 7) === today.slice(0, 7),
          )
          .map((task) => task.date),
      ),
      weekdayLabels: getWeekdayLabels(weekStartDay, locale),
      monthTitle: new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }).format(todayDate),
      categories: getCategoryCounts(tasks, getWeekRange(today, weekStartDay)),
      formatShortDate: createFormatter(locale, {
        day: "numeric",
        month: "short",
      }),
      formatLongDate: createFormatter(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
      formatDayHeading: createFormatter(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    };
  }, [
    today,
    todayStats,
    todayScopedTasks,
    tasks,
    weeklyProductivity,
    routines,
    routineChecks,
    getRoutineStreak,
    projects,
    weekStartDay,
    locale,
  ]);

  const actions = {
    navigate,
    openTask: (id) => onOpenTask(id),
    openDay: (date) => setDayDialogDate(date),
    openProject: (id) => navigate(getProjectPath(id)),
    toggleRoutine: (id) => onToggleRoutine(id),
  };

  const stats = [
    {
      key: "today",
      icon: CalendarDays,
      label: t.statToday,
      value: todayStats.total,
    },
    {
      key: "done",
      icon: CircleCheck,
      label: t.statCompleted,
      value: todayStats.completed,
    },
    {
      key: "left",
      icon: Clock,
      label: t.statInProgress,
      value: todayStats.active,
    },
    {
      key: "late",
      icon: CircleAlert,
      label: t.statOverdue,
      value: todayStats.overdue,
    },
  ];

  const { cards, isEditing } = editor;
  const slots = isEditing ? getLayoutSlots(cards) : [];

  function renderSlot(slotIndex) {
    return (
      <DashboardSlot
        key={`slot-${slotIndex}`}
        slotIndex={slotIndex}
        isPicked={editor.pickedSlot === slotIndex}
        t={t}
        onToggle={editor.toggleSlot}
      />
    );
  }

  function openTaskFromDay(id) {
    const returnDate = dayDialogDate;
    setDayDialogDate(null);
    onOpenTask(id, () => setDayDialogDate(returnDate));
  }

  return (
    <section
      className={`dashboard-page${isEditing ? " dashboard-page-editing" : ""}`}
    >
      <div className="dashboard-main">
        <div className="dashboard-welcome">
          <div className="dashboard-welcome-text">
            <h2>{greeting}</h2>
            <p>{dashboardMessage}</p>
          </div>
          <div className="dashboard-welcome-actions">
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={editor.cancel}
                >
                  {t.dashboardCancel}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={editor.finish}
                >
                  {t.dashboardDone}
                </button>
              </>
            ) : (
              <>
                <span className="dashboard-date">
                  {new Intl.DateTimeFormat(locale, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(parseLocalDate(today))}
                </span>
                <button
                  type="button"
                  className="dashboard-icon-button dashboard-edit-button"
                  aria-label={t.dashboardEdit}
                  title={t.dashboardEdit}
                  onClick={editor.start}
                >
                  <Icon icon={Pencil} size="md" />
                </button>
              </>
            )}
          </div>
        </div>

        <section className="dashboard-stats">
          {stats.map((stat, index) => (
            <div
              key={stat.key}
              className="dashboard-stat"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <span className="dashboard-icon-box" aria-hidden="true">
                <Icon icon={stat.icon} size="md" />
              </span>
              <div>
                <p>{stat.label}</p>
                <strong>{stat.value}</strong>
              </div>
            </div>
          ))}
        </section>

        <p
          className={isEditing ? "dashboard-status" : "visually-hidden"}
          role="status"
        >
          {editor.announcement}
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          accessibility={{ announcements: SILENT_ANNOUNCEMENTS }}
          onDragEnd={({ active, over }) => {
            if (over && active.id !== over.id) {
              editor.moveById(active.id, over.id);
            }
          }}
        >
          <SortableContext
            items={cards.map((entry) => entry.id)}
            strategy={rectSortingStrategy}
          >
            <div className="dashboard-cards">
              {cards.map((entry, index) => {
                const Body = CARD_BODIES[entry.id];
                const settle =
                  editor.lastMoved?.id === entry.id
                    ? editor.lastMoved.count % 2
                      ? "a"
                      : "b"
                    : null;

                return (
                  <Fragment key={entry.id}>
                    {slots.includes(index) && renderSlot(index)}
                    <DashboardCardFrame
                      entry={entry}
                      index={index}
                      count={cards.length}
                      definition={getCardDefinition(entry.id)}
                      isEditing={isEditing}
                      settle={settle}
                      meta={getCardMeta(entry.id, data, t)}
                      t={t}
                      onMove={editor.move}
                      onRemove={editor.remove}
                      onResize={editor.resize}
                    >
                      <Body
                        data={data}
                        t={t}
                        actions={actions}
                        isWide={entry.size === "wide"}
                      />
                    </DashboardCardFrame>
                  </Fragment>
                );
              })}
              {slots.includes(cards.length) && renderSlot(cards.length)}
            </div>
          </SortableContext>
        </DndContext>

        {cards.length === 0 && (
          <div className="empty-state dashboard-empty">
            <p className="empty-state-title">{t.dashboardEmptyTitle}</p>
            <p className="empty-state-subtitle">{t.dashboardEmptyHint}</p>
          </div>
        )}
      </div>

      {isEditing && (
        <CardLibrary
          cards={cards}
          pickedSlot={editor.pickedSlot}
          t={t}
          onAdd={editor.add}
          onRemove={editor.remove}
        />
      )}

      {dayDialogDate && (
        <DayTasksDialog
          title={data.formatLongDate(dayDialogDate)}
          tasks={
            dayDialogDate === today
              ? data.todayTasks
              : getTasksForDate(tasks, dayDialogDate)
          }
          t={t}
          onClose={() => setDayDialogDate(null)}
          onOpenTask={openTaskFromDay}
          onOpenCalendar={() => {
            setDayDialogDate(null);
            navigate("/calendar");
          }}
        />
      )}
    </section>
  );
}

export default DashboardPage;
