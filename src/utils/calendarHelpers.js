import {
  getLocalDateString,
  getWeekStartOffset,
  parseLocalDate,
} from "./dateHelpers";

export const CELL_DOT_LIMIT = 4;

export function getMonthGridCells(year, monthIndex, weekStartDay) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingDays = getWeekStartOffset(firstOfMonth, weekStartDay);
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(year, monthIndex, 1 - leadingDays + index);
    const weekday = date.getDay();

    return {
      date,
      dateString: getLocalDateString(date),
      inMonth: date.getMonth() === monthIndex,
      isWeekend: weekday === 0 || weekday === 6,
    };
  });
}

export function groupTasksByDate(tasks) {
  const groups = new Map();

  tasks.forEach((task) => {
    if (!task.date) {
      return;
    }

    const group = groups.get(task.date);

    if (group) {
      group.push(task);
    } else {
      groups.set(task.date, [task]);
    }
  });

  groups.forEach((group) => {
    group.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  });

  return groups;
}

export function getCompletionPercent(tasks) {
  if (tasks.length === 0) {
    return null;
  }

  const completed = tasks.filter((task) => task.completed).length;

  return Math.round((completed / tasks.length) * 100);
}

export function getDefaultSelectedDate(year, monthIndex, today) {
  const reference = parseLocalDate(today);

  if (reference.getFullYear() === year && reference.getMonth() === monthIndex) {
    return today;
  }

  return getLocalDateString(new Date(year, monthIndex, 1));
}

export function getWeekdayHeaders(weekStartDay, locale) {
  const longFormatter = new Intl.DateTimeFormat(locale, { weekday: "long" });
  const shortFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const firstDay = weekStartDay === "monday" ? 1 : 0;
  const sunday = new Date(2026, 0, 4);

  return Array.from({ length: 7 }, (_, index) => {
    const weekday = (firstDay + index) % 7;
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + weekday);
    const isWeekend = weekday === 0 || weekday === 6;
    const formatter = isWeekend ? shortFormatter : longFormatter;

    return {
      key: weekday,
      isWeekend,
      label: formatter.format(date).toLocaleUpperCase(locale),
    };
  });
}
