import { Check, ChevronRight, Clock, Flame } from "lucide-react";
import Icon from "../Icon";
import {
  SMALL_PROJECTS,
  SMALL_UPCOMING_DAYS,
  WIDE_PROJECTS,
  WIDE_UPCOMING_DAYS,
} from "../../constants/dashboardCards";
import { getCategoryLabel } from "../../utils/categoryHelpers";
import { getCategoryTone, limitList } from "../../utils/dashboardData";

const OVERDUE_SHOWN = 2;
const RING_RADIUS = 52;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function EmptyCard({ message }) {
  return <p className="dashboard-empty-card">{message}</p>;
}

function CategoryChip({ category, t }) {
  return (
    <span className="dashboard-chip" data-tone={getCategoryTone(category)}>
      {getCategoryLabel(category, t)}
    </span>
  );
}

function TaskMark({ done }) {
  return (
    <span
      className={`dashboard-mark${done ? " dashboard-mark-done" : ""}`}
      aria-hidden="true"
    >
      <Icon icon={Check} size="sm" />
    </span>
  );
}

export function TodayRingBody({ data, t }) {
  const { completed, total, percent } = data.todayStats;
  const filled = (RING_LENGTH * percent) / 100;

  return (
    <div className="dashboard-ring">
      <svg viewBox="0 0 124 124" role="img" aria-label={t.ringLabel(percent)}>
        <circle className="dashboard-ring-track" cx="62" cy="62" r="52" />
        <circle
          className="dashboard-ring-value"
          cx="62"
          cy="62"
          r="52"
          strokeDasharray={`${filled} ${RING_LENGTH}`}
          style={{ "--ring-filled": filled }}
          transform="rotate(-90 62 62)"
        />
        <text x="62" y="70" textAnchor="middle">
          {`%${percent}`}
        </text>
      </svg>
      <div className="dashboard-ring-text">
        <strong>{`${completed} / ${total}`}</strong>
        <span>{t.tasksDoneLabel}</span>
        <span className="dashboard-legend">
          <span className="dashboard-legend-dot dashboard-legend-done" />
          {t.completedLegend}
        </span>
        <span className="dashboard-legend">
          <span className="dashboard-legend-dot" />
          {t.pendingLegend}
        </span>
      </div>
    </div>
  );
}

export function WeeklyRoutineBody({ data, t, actions }) {
  return (
    <div className="dashboard-week">
      {data.weekly.map((day, index) => {
        const edge = index < 2 ? "start" : index > 4 ? "end" : "center";

        return (
          <button
            key={day.fullDate}
            type="button"
            className="dashboard-item dashboard-week-day"
            aria-label={t.weeklyBarLabel(
              `${day.label} ${day.fullDate}`,
              day.completed,
              day.total,
              day.percent,
            )}
            onClick={() => actions.navigate("/archive")}
          >
            <span className="dashboard-week-track">
              <span
                className={`dashboard-week-bar${index === 6 ? " dashboard-week-today" : ""}`}
                style={{
                  height: `${Math.max(3, day.percent)}%`,
                  animationDelay: `${index * 45 + 80}ms`,
                }}
              />
            </span>
            <span
              className={`dashboard-week-label${index === 6 ? " dashboard-week-label-today" : ""}`}
            >
              {day.label}
            </span>
            <span
              className="dashboard-tooltip"
              data-edge={edge}
              aria-hidden="true"
            >
              <strong>{day.fullDate}</strong>
              <span>{t.weeklyTipPercent(day.percent)}</span>
              <span>{t.weeklyTipRoutines(day.completed, day.total)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function TodayTasksBody({ data, t, actions }) {
  if (data.todayTasks.length === 0) {
    return <EmptyCard message={t.noTodayTasks} />;
  }

  const { shown, hidden } = limitList(data.todayTasks);

  return (
    <ul className="dashboard-list dashboard-list-fill">
      {shown.map((task) => (
        <li key={task.id}>
          <button
            type="button"
            className="dashboard-item dashboard-row"
            aria-label={t.openTaskLabel(task.title)}
            onClick={() => actions.openTask(task.id)}
          >
            <TaskMark done={task.completed} />
            <span
              className={`dashboard-row-title${task.completed ? " dashboard-row-done" : ""}`}
            >
              {task.title}
            </span>
            <CategoryChip category={task.category} t={t} />
          </button>
        </li>
      ))}
      {hidden > 0 && (
        <li>
          <button
            type="button"
            className="dashboard-item dashboard-row dashboard-more-row"
            onClick={() => actions.openDay(data.today)}
          >
            <span className="dashboard-more-badge" aria-hidden="true">
              {`+${hidden}`}
            </span>
            <span className="dashboard-row-title">
              {t.moreTodayTasksLabel(hidden)}
            </span>
            <Icon icon={ChevronRight} size="sm" />
          </button>
        </li>
      )}
    </ul>
  );
}

export function OverdueBody({ data, t, actions }) {
  if (data.overdue.length === 0) {
    return <EmptyCard message={t.noOverdueTasks} />;
  }

  const shown = data.overdue.slice(0, OVERDUE_SHOWN);
  const hidden = data.overdue.length - shown.length;

  return (
    <div className="dashboard-overdue">
      <div className="dashboard-overdue-count">
        <span className="dashboard-icon-box" aria-hidden="true">
          <Icon icon={Clock} size="md" />
        </span>
        <strong>{data.overdue.length}</strong>
        <span>{t.overdueCountLabel}</span>
      </div>
      <ul className="dashboard-list">
        {shown.map((task) => (
          <li key={task.id}>
            <button
              type="button"
              className="dashboard-item dashboard-row"
              aria-label={t.openTaskLabel(task.title)}
              onClick={() => actions.openTask(task.id)}
            >
              <span className="dashboard-row-title">{task.title}</span>
              <span className="dashboard-row-date">
                {data.formatShortDate(task.date)}
              </span>
              <CategoryChip category={task.category} t={t} />
            </button>
          </li>
        ))}
        {hidden > 0 && (
          <li className="dashboard-more-text">{t.moreTasksLabel(hidden)}</li>
        )}
      </ul>
      <p className="dashboard-hint">{t.overdueHint}</p>
    </div>
  );
}

export function UpcomingBody({ data, t, actions, isWide }) {
  if (data.upcoming.length === 0) {
    return <EmptyCard message={t.noUpcomingTasks} />;
  }

  const limit = isWide ? WIDE_UPCOMING_DAYS : SMALL_UPCOMING_DAYS;
  const days = data.upcoming.slice(0, limit);
  const hiddenDays = data.upcoming.length - days.length;

  return (
    <div className="dashboard-upcoming">
      <div className="dashboard-upcoming-days" data-columns={limit}>
        {days.map((day) => {
          const { shown, hidden } = limitList(day.tasks);
          const longDate = data.formatLongDate(day.date);

          return (
            <div key={day.date} className="dashboard-upcoming-day">
              <button
                type="button"
                className="dashboard-sub dashboard-upcoming-head"
                aria-label={t.openDayLabel(longDate)}
                onClick={() => actions.openDay(day.date)}
              >
                <span>{data.formatDayHeading(day.date)}</span>
                <span className="dashboard-upcoming-count">
                  {t.taskCountLabel(day.tasks.length)}
                </span>
              </button>
              <ul className="dashboard-bullets">
                {shown.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      className="dashboard-sub dashboard-bullet"
                      aria-label={t.openTaskLabel(task.title)}
                      onClick={() => actions.openTask(task.id)}
                    >
                      <span
                        className="dashboard-dot"
                        data-tone={getCategoryTone(task.category)}
                        aria-hidden="true"
                      />
                      <span className="dashboard-bullet-title">
                        {task.title}
                      </span>
                    </button>
                  </li>
                ))}
                {hidden > 0 && (
                  <li>
                    <button
                      type="button"
                      className="dashboard-sub dashboard-bullet dashboard-bullet-more"
                      aria-label={t.openDayLabel(longDate)}
                      onClick={() => actions.openDay(day.date)}
                    >
                      <span
                        className="dashboard-dot dashboard-dot-hollow"
                        aria-hidden="true"
                      />
                      <span>{t.moreTasksLabel(hidden)}</span>
                    </button>
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
      {hiddenDays > 0 && !isWide && (
        <p className="dashboard-more-text">{t.moreDaysLabel(hiddenDays)}</p>
      )}
    </div>
  );
}

export function RoutinesBody({ data, t, actions }) {
  if (data.routines.length === 0) {
    return <EmptyCard message={t.noRoutines} />;
  }

  const { shown, hidden } = limitList(data.routines);

  return (
    <ul className="dashboard-list dashboard-list-fill">
      {shown.map((routine) => (
        <li key={routine.id}>
          <button
            type="button"
            role="checkbox"
            aria-checked={routine.checked}
            className="dashboard-item dashboard-row"
            onClick={() => actions.toggleRoutine(routine.id)}
          >
            <span className="dashboard-check" aria-hidden="true">
              <Icon icon={Check} size="sm" />
            </span>
            <span
              className={`dashboard-row-title${routine.checked ? " dashboard-row-muted" : ""}`}
            >
              {routine.title}
            </span>
            <span className="dashboard-row-date">
              {routine.checked ? t.routineDoneState : t.routinePendingState}
            </span>
          </button>
        </li>
      ))}
      {hidden > 0 && (
        <li className="dashboard-more-text">{t.moreRoutinesLabel(hidden)}</li>
      )}
    </ul>
  );
}

export function StreaksBody({ data, t, actions }) {
  if (data.routines.length === 0) {
    return <EmptyCard message={t.noRoutines} />;
  }

  const sorted = [...data.routines].sort((a, b) => b.streak - a.streak);
  const { shown, hidden } = limitList(sorted);

  return (
    <ul className="dashboard-list dashboard-list-fill">
      {shown.map((routine) => (
        <li key={routine.id}>
          <button
            type="button"
            className="dashboard-item dashboard-row"
            onClick={() => actions.navigate("/archive")}
          >
            <span className="dashboard-row-title">{routine.title}</span>
            <span
              className={`dashboard-streak${routine.streak > 0 ? " dashboard-streak-active" : ""}`}
            >
              <Icon icon={Flame} size="sm" />
              {routine.streak > 0 ? t.streakDays(routine.streak) : t.noStreak}
            </span>
          </button>
        </li>
      ))}
      {hidden > 0 && (
        <li className="dashboard-more-text">{t.moreRoutinesLabel(hidden)}</li>
      )}
    </ul>
  );
}

export function ProjectsBody({ data, t, actions, isWide }) {
  if (data.projects.length === 0) {
    return <EmptyCard message={t.noProjects} />;
  }

  const limit = isWide ? WIDE_PROJECTS : SMALL_PROJECTS;
  const shown = data.projects.slice(0, limit);
  const hidden = data.projects.length - shown.length;

  return (
    <div className="dashboard-projects-wrap">
      <ul className="dashboard-projects" data-wide={isWide}>
        {shown.map((project) => (
          <li key={project.id}>
            <button
              type="button"
              className="dashboard-item dashboard-project"
              aria-label={t.openProjectLabel(project.name)}
              onClick={() => actions.openProject(project.id)}
            >
              <span className="dashboard-project-head">
                <span className="dashboard-project-name">{project.name}</span>
                <span className="dashboard-row-date">
                  {`${project.done} / ${project.total}`}
                </span>
              </span>
              <span className="dashboard-progress">
                <span
                  className="dashboard-progress-value"
                  style={{ width: `${project.percent}%` }}
                />
              </span>
              <span className="dashboard-row-date">
                {project.nextDate
                  ? t.projectNextDate(data.formatShortDate(project.nextDate))
                  : t.projectNoDate}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <p className="dashboard-more-text">{t.moreProjectsLabel(hidden)}</p>
      )}
    </div>
  );
}

export function CalendarBody({ data, t, actions }) {
  return (
    <div className="dashboard-calendar">
      <div className="dashboard-calendar-head">
        <span>{data.monthTitle}</span>
        <span className="dashboard-row-date">
          {t.calendarTaskDaysLabel(data.taskDates.size)}
        </span>
      </div>
      <div className="dashboard-calendar-weekdays" aria-hidden="true">
        {data.weekdayLabels.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
      <div className="dashboard-calendar-grid">
        {data.monthCells.map((date, index) => {
          if (!date) {
            return <span key={`empty-${index}`} aria-hidden="true" />;
          }

          const isToday = date === data.today;
          const hasTasks = data.taskDates.has(date);

          return (
            <button
              key={date}
              type="button"
              className={`dashboard-day${isToday ? " dashboard-day-today" : ""}${
                hasTasks ? " dashboard-day-busy" : ""
              }${date < data.today ? " dashboard-day-past" : ""}`}
              aria-label={t.openDayLabel(data.formatLongDate(date))}
              aria-current={isToday ? "date" : undefined}
              onClick={() => actions.openDay(date)}
            >
              {Number(date.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CategoriesBody({ data, t, actions }) {
  const max = Math.max(1, ...data.categories.map((entry) => entry.count));

  return (
    <ul className="dashboard-list dashboard-list-fill dashboard-categories">
      {data.categories.map((entry) => {
        const label = getCategoryLabel(entry.category, t);

        return (
          <li key={entry.category}>
            <button
              type="button"
              className="dashboard-item dashboard-category"
              aria-label={`${t.openCategoryLabel(label)}: ${entry.count}`}
              onClick={() => actions.navigate("/archive")}
            >
              <span className="dashboard-category-label">
                <span
                  className="dashboard-dot"
                  data-tone={getCategoryTone(entry.category)}
                  aria-hidden="true"
                />
                {label}
              </span>
              <span className="dashboard-progress">
                <span
                  className="dashboard-progress-value"
                  data-tone={getCategoryTone(entry.category)}
                  style={{ width: `${(entry.count / max) * 100}%` }}
                />
              </span>
              <span className="dashboard-row-date">{entry.count}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
