const MIGRATED_KEYS = ["tasks", "projects", "routines", "routineChecks"];

function decisionKey(userId) {
  return `importDecision:${userId}`;
}

export function getImportDecision(userId) {
  try {
    return localStorage.getItem(decisionKey(userId));
  } catch {
    return null;
  }
}

export function setImportDecision(userId, decision) {
  try {
    localStorage.setItem(decisionKey(userId), decision);
  } catch {
    return;
  }
}

export function backUpAndClearLocalData(now = new Date()) {
  try {
    const data = Object.fromEntries(
      MIGRATED_KEYS.map((key) => [key, localStorage.getItem(key)]),
    );

    localStorage.setItem(
      `importBackup:${now.toISOString()}`,
      JSON.stringify({ savedAt: now.toISOString(), data }),
    );
    MIGRATED_KEYS.forEach((key) => localStorage.removeItem(key));

    return true;
  } catch {
    return false;
  }
}
