export const MAX_REQUEST_BYTES = 6 * 1024 * 1024;

const encoder = new TextEncoder();

function sizeOf(value) {
  return encoder.encode(JSON.stringify(value)).length;
}

function splitBySize(items, maxBytes) {
  const groups = [];
  let current = [];
  let currentBytes = 0;

  for (const item of items) {
    const itemBytes = sizeOf(item) + 1;

    if (current.length > 0 && currentBytes + itemBytes > maxBytes) {
      groups.push(current);
      current = [];
      currentBytes = 0;
    }

    current.push(item);
    currentBytes += itemBytes;
  }

  if (current.length > 0) {
    groups.push(current);
  }

  return groups;
}

export default function planImportRequests(
  payload,
  maxBytes = MAX_REQUEST_BYTES,
) {
  if (sizeOf(payload) <= maxBytes) {
    return [payload];
  }

  return [
    {
      projects: payload.projects,
      routines: payload.routines,
      routineChecks: [],
      tasks: [],
    },
    ...splitBySize(payload.tasks, maxBytes).map((tasks) => ({
      projects: [],
      routines: [],
      routineChecks: [],
      tasks,
    })),
    ...splitBySize(payload.routineChecks, maxBytes).map((routineChecks) => ({
      projects: [],
      routines: [],
      routineChecks,
      tasks: [],
    })),
  ];
}
