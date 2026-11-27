// Keeps the browser's "install app" prompt so the Settings > About button can
// show it later. Browsers fire `beforeinstallprompt` once, early, often before
// the Settings page exists, so the listener has to start with the app.
//
// Status values:
//   "available"   -> the browser handed us a prompt; the button can show it
//   "installed"   -> running as the installed app, or just installed
//   "ios"         -> iOS Safari: no prompt API, install via Share > Add to Home Screen
//   "unavailable" -> no prompt (unsupported browser, or already installed)

export const INSTALL_STATUS = {
  available: "available",
  installed: "installed",
  ios: "ios",
  unavailable: "unavailable",
};

function isStandalone(win) {
  try {
    if (win.navigator?.standalone === true) {
      return true;
    }
    return (
      typeof win.matchMedia === "function" &&
      win.matchMedia("(display-mode: standalone)").matches
    );
  } catch {
    return false;
  }
}

function isIos(win) {
  const nav = win.navigator ?? {};
  const ua = nav.userAgent ?? "";
  // iPadOS reports itself as a Mac; touch support gives it away.
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (nav.platform === "MacIntel" && nav.maxTouchPoints > 1)
  );
}

export function createInstallPromptStore(win) {
  let deferredPrompt = null;
  let status = INSTALL_STATUS.unavailable;
  const listeners = new Set();

  function setStatus(next) {
    if (next !== status) {
      status = next;
      listeners.forEach((listener) => listener());
    }
  }

  function initialStatus() {
    if (isStandalone(win)) {
      return INSTALL_STATUS.installed;
    }
    return isIos(win) ? INSTALL_STATUS.ios : INSTALL_STATUS.unavailable;
  }

  function handleBeforeInstallPrompt(event) {
    // Keep the prompt for our own button instead of the browser's mini-infobar.
    event.preventDefault();
    deferredPrompt = event;
    setStatus(INSTALL_STATUS.available);
  }

  function handleAppInstalled() {
    deferredPrompt = null;
    setStatus(INSTALL_STATUS.installed);
  }

  status = initialStatus();
  win.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  win.addEventListener("appinstalled", handleAppInstalled);

  return {
    getStatus: () => status,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    // Shows the browser's install dialog. Resolves to "accepted",
    // "dismissed" or "unavailable".
    async install() {
      const prompt = deferredPrompt;
      if (!prompt) {
        return "unavailable";
      }
      // A prompt can only be used once.
      deferredPrompt = null;
      setStatus(INSTALL_STATUS.unavailable);

      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === "accepted") {
          setStatus(INSTALL_STATUS.installed);
        }
        return outcome;
      } catch {
        return "unavailable";
      }
    },
    stop() {
      win.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      win.removeEventListener("appinstalled", handleAppInstalled);
    },
  };
}

let defaultStore = null;

// Called once from main.jsx, before the app renders.
export function startInstallPrompt(win = window) {
  if (!defaultStore) {
    defaultStore = createInstallPromptStore(win);
  }
  return defaultStore;
}

export function getInstallPromptStore() {
  return defaultStore;
}
