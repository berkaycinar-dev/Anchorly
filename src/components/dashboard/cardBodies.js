import {
  CalendarBody,
  CategoriesBody,
  OverdueBody,
  ProjectsBody,
  RoutinesBody,
  StreaksBody,
  TodayRingBody,
  TodayTasksBody,
  UpcomingBody,
  WeeklyRoutineBody,
} from "./DashboardCardBodies";

export const CARD_BODIES = {
  todayRing: TodayRingBody,
  weeklyRoutine: WeeklyRoutineBody,
  todayTasks: TodayTasksBody,
  overdue: OverdueBody,
  upcoming: UpcomingBody,
  routines: RoutinesBody,
  streaks: StreaksBody,
  projects: ProjectsBody,
  calendar: CalendarBody,
  categories: CategoriesBody,
};
