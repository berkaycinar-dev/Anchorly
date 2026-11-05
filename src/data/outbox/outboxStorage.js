function storageKey(userId) {
  return `outbox:${userId}`;
}

function isEntry(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.method === "string" &&
    typeof value.path === "string" &&
    typeof value.time === "string"
  );
}

export function readOutbox(userId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(userId)));

    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    return [];
  }
}

export function writeOutbox(userId, entries) {
  try {
    if (entries.length === 0) {
      localStorage.removeItem(storageKey(userId));
    } else {
      localStorage.setItem(storageKey(userId), JSON.stringify(entries));
    }
  } catch {
    return;
  }
}
