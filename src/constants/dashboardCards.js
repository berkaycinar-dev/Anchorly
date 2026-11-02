export const CARD_SIZES = ["small", "wide"];

export const DASHBOARD_CARDS = [
  { id: "todayRing", size: "small", path: "/today", pageKey: "today" },
  {
    id: "weeklyRoutine",
    size: "small",
    path: "/archive",
    pageKey: "archive",
  },
  { id: "todayTasks", size: "small", path: "/today", pageKey: "today" },
  { id: "overdue", size: "small", path: "/today", pageKey: "today" },
  { id: "upcoming", size: "wide", path: "/calendar", pageKey: "calendar" },
  {
    id: "routines",
    size: "small",
    path: "/routine",
    pageKey: "dailyRoutine",
  },
  { id: "streaks", size: "small", path: "/archive", pageKey: "archive" },
  { id: "projects", size: "small", path: "/projects", pageKey: "projects" },
  { id: "calendar", size: "small", path: "/calendar", pageKey: "calendar" },
  { id: "categories", size: "small", path: "/archive", pageKey: "archive" },
];

export const DEFAULT_DASHBOARD_LAYOUT = [
  { id: "todayRing", size: "small" },
  { id: "weeklyRoutine", size: "small" },
  { id: "upcoming", size: "wide" },
];

export const LIST_LIMIT = 4;
export const LIST_SHOWN = 3;
export const UPCOMING_DAYS_AHEAD = 7;
export const SMALL_UPCOMING_DAYS = 2;
export const WIDE_UPCOMING_DAYS = 3;
export const SMALL_PROJECTS = 2;
export const WIDE_PROJECTS = 4;

const CARD_IDS = new Set(DASHBOARD_CARDS.map((card) => card.id));

export function getCardDefinition(id) {
  return DASHBOARD_CARDS.find((card) => card.id === id) ?? null;
}

export function normalizeDashboardLayout(value) {
  if (!Array.isArray(value)) {
    return DEFAULT_DASHBOARD_LAYOUT;
  }

  const seen = new Set();

  return value.reduce((layout, entry) => {
    if (
      entry &&
      CARD_IDS.has(entry.id) &&
      CARD_SIZES.includes(entry.size) &&
      !seen.has(entry.id)
    ) {
      seen.add(entry.id);
      layout.push({ id: entry.id, size: entry.size });
    }

    return layout;
  }, []);
}

export function getLayoutSlots(layout) {
  const slots = [];
  let halfFilled = false;

  layout.forEach((entry, index) => {
    const isWide = entry.size === "wide";

    if (isWide && halfFilled) {
      slots.push(index);
      halfFilled = false;
    }

    halfFilled = isWide ? false : !halfFilled;
  });

  if (halfFilled) {
    slots.push(layout.length);
  }

  return slots;
}
