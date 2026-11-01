export const SESSION_HINT_KEY = "authSessionHint";

export function hasSessionHint() {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSessionHint() {
  try {
    localStorage.setItem(SESSION_HINT_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export function clearSessionHint() {
  try {
    localStorage.removeItem(SESSION_HINT_KEY);
    return true;
  } catch {
    return false;
  }
}
