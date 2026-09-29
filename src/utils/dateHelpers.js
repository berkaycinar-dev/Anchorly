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

// DEĞİŞTİ: artık weekStartDay parametre olarak alınıyor
export function getWeekDays(anchorDate, weekStartDay) {
  const startOfWeek = getWeekStartDate(anchorDate, weekStartDay);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + index);
    return day;
  });
}

// DEĞİŞTİ: artık year ve monthIndex parametre olarak alınıyor
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

export function getNextRepeatDate(dateString, repeat) {
  const date = new Date(dateString);

  if (repeat === "daily") {
    date.setDate(date.getDate() + 1);
  } else if (repeat === "weekly") {
    date.setDate(date.getDate() + 7);
  }

  return date.toISOString().slice(0, 10);
}