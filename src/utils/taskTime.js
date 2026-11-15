export function compareTasksForDay(a, b) {
  if (a.completed !== b.completed) {
    return Number(a.completed) - Number(b.completed);
  }

  if (a.dueTime && b.dueTime) {
    return a.dueTime.localeCompare(b.dueTime);
  }

  if (a.dueTime || b.dueTime) {
    return a.dueTime ? -1 : 1;
  }

  return 0;
}
