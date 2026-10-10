export function getWeekStartOffset(date, startDay) {
  const day = date.getDay();

  if (startDay === "monday") {
    return day === 0 ? 6 : day - 1;
  }

  return day;
}

export function getWeekStartDate(date, startDay) {
  const offset = getWeekStartOffset(date, startDay);
  const start = new Date(date);
  start.setDate(date.getDate() - offset);
  return start;
}

export function getWeekDays(anchorDate, weekStartDay) {
  const startOfWeek = getWeekStartDate(anchorDate, weekStartDay);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + index);
    return day;
  });
}

export function getRoutineKey(routineId, day, year, monthIndex) {
  const monthKey = `${year}-${monthIndex + 1}`;
  return `${monthKey}-${routineId}-${day}`;
}

export function getRoutineKeyForDate(routineId, date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month}-${routineId}-${day}`;
}

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function addDaysToDateString(dateString, days) {
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + days);

  return getLocalDateString(date);
}

export function getNextRepeatDate(dateString, repeat) {
  if (repeat === "daily") {
    return addDaysToDateString(dateString, 1);
  }

  if (repeat === "weekly") {
    return addDaysToDateString(dateString, 7);
  }

  return dateString;
}

export function getRoutineIdFromKey(key) {
  const firstDash = key.indexOf("-");
  const secondDash = key.indexOf("-", firstDash + 1);
  const lastDash = key.lastIndexOf("-");

  return key.slice(secondDash + 1, lastDash);
}