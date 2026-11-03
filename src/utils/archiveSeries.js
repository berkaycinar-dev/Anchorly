import { parseLocalDate } from "./dateHelpers";

export const SERIES_PAGE_SIZE = 8;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isRecurringTask(task) {
  return Boolean(task.repeatGroupId);
}

export function isOneTimeTask(task) {
  return !task.repeatGroupId;
}

export function getOccurrenceStatus(task, today) {
  if (task.completed) {
    return "done";
  }

  if (task.date < today) {
    return "missed";
  }

  if (task.date === today) {
    return "today";
  }

  return "upcoming";
}

export function getDaysFromToday(dateString, today) {
  const difference = parseLocalDate(dateString) - parseLocalDate(today);

  return Math.round(difference / MS_PER_DAY);
}

function buildSeries(id, occurrences, today) {
  const sorted = [...occurrences].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const elapsed = sorted.filter((task) => task.date <= today);
  const doneCount = elapsed.filter((task) => task.completed).length;
  const missedCount = elapsed.filter(
    (task) => task.date < today && !task.completed,
  ).length;
  const next = sorted.find((task) => task.date >= today && !task.completed);

  return {
    id,
    title: first.title,
    category: first.category,
    repeat: last.repeat,
    startDate: first.date,
    endDate: last.date,
    total: sorted.length,
    elapsedCount: elapsed.length,
    remainingCount: sorted.length - elapsed.length,
    doneCount,
    missedCount,
    percent:
      elapsed.length === 0 ? 0 : Math.round((doneCount / elapsed.length) * 100),
    nextDate: next ? next.date : null,
    hasPendingToday: sorted.some(
      (task) => task.date === today && !task.completed,
    ),
    occurrences: sorted,
  };
}

function compareSeries(a, b) {
  if (a.nextDate !== b.nextDate) {
    if (a.nextDate === null) {
      return 1;
    }

    if (b.nextDate === null) {
      return -1;
    }

    return a.nextDate.localeCompare(b.nextDate);
  }

  return a.title.localeCompare(b.title);
}

export function buildSeriesList(tasks, today) {
  const groups = new Map();

  tasks.filter(isRecurringTask).forEach((task) => {
    const group = groups.get(task.repeatGroupId);

    if (group) {
      group.push(task);
    } else {
      groups.set(task.repeatGroupId, [task]);
    }
  });

  return [...groups.entries()]
    .map(([id, occurrences]) => buildSeries(id, occurrences, today))
    .sort(compareSeries);
}

export function getSeriesSummary(seriesList) {
  const elapsedCount = seriesList.reduce(
    (sum, series) => sum + series.elapsedCount,
    0,
  );
  const doneCount = seriesList.reduce(
    (sum, series) => sum + series.doneCount,
    0,
  );

  return {
    activeCount: seriesList.length,
    pendingTodayCount: seriesList.filter((series) => series.hasPendingToday)
      .length,
    doneCount,
    elapsedCount,
    percent:
      elapsedCount === 0 ? 0 : Math.round((doneCount / elapsedCount) * 100),
  };
}

export function filterOccurrences(occurrences, filter) {
  if (filter === "done") {
    return occurrences.filter((task) => task.completed);
  }

  if (filter === "todo") {
    return occurrences.filter((task) => !task.completed);
  }

  return occurrences;
}

export function getPageCount(itemCount, pageSize = SERIES_PAGE_SIZE) {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}

export function getPageSlice(items, page, pageSize = SERIES_PAGE_SIZE) {
  const pageCount = getPageCount(items.length, pageSize);
  const safePage = Math.min(Math.max(page, 0), pageCount - 1);
  const startIndex = safePage * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);

  return {
    items: pageItems,
    page: safePage,
    pageCount,
    from: items.length === 0 ? 0 : startIndex + 1,
    to: startIndex + pageItems.length,
    total: items.length,
  };
}

export function getTodayPageIndex(
  occurrences,
  today,
  pageSize = SERIES_PAGE_SIZE,
) {
  if (occurrences.length === 0) {
    return 0;
  }

  const upcomingIndex = occurrences.findIndex((task) => task.date >= today);
  const position =
    upcomingIndex === -1 ? occurrences.length - 1 : upcomingIndex;

  return Math.floor(position / pageSize);
}

export function getPaginationItems(currentPage, pageCount) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index);
  }

  const items = [0];

  if (currentPage > 2) {
    items.push("ellipsis-start");
  }

  const rangeStart = Math.max(1, currentPage - 1);
  const rangeEnd = Math.min(pageCount - 2, currentPage + 1);

  for (let page = rangeStart; page <= rangeEnd; page++) {
    items.push(page);
  }

  if (currentPage < pageCount - 3) {
    items.push("ellipsis-end");
  }

  items.push(pageCount - 1);

  return items;
}
