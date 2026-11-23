// Runs in <head>, before the app bundle. Someone who has never used Anchorly
// and opens "/" is sent to the landing page; everyone else gets the app.
// It is a separate file because the site's CSP blocks inline scripts.
(function (window) {
  "use strict";

  const STARTED_KEY = "anchorlyStarted";
  // Written by the app: a signed-in session, and guest data on this device.
  const SESSION_HINT_KEY = "authSessionHint";
  const TASKS_KEY = "tasks";
  const LANGUAGE_KEY = "language";
  const LANDING = { tr: "/welcome/", en: "/welcome/en/" };

  function read(storage, key) {
    try {
      return storage ? storage.getItem(key) : null;
    } catch {
      return null;
    }
  }

  function write(storage, key, value) {
    try {
      if (storage) {
        storage.setItem(key, value);
      }
    } catch {
      // Storage can be full or blocked; the app still works without it.
    }
  }

  function landingFor(languages) {
    const first = String((languages && languages[0]) || "").toLowerCase();
    return first === "tr" || first.startsWith("tr-") ? LANDING.tr : LANDING.en;
  }

  // Pure decision, exported for tests. Returns one of:
  //   { action: "redirect", to }                  -> show the landing page
  //   { action: "enter", language, search }       -> load the app
  function decide({ pathname, search, storage, languages }) {
    const params = new URLSearchParams(search);

    // The landing page's buttons link to /?welcome=<lang>.
    if (params.has("welcome")) {
      const value = params.get("welcome");
      params.delete("welcome");
      const rest = params.toString();

      return {
        action: "enter",
        language: value === "tr" || value === "en" ? value : null,
        search: rest ? `?${rest}` : "",
      };
    }

    const started =
      read(storage, STARTED_KEY) === "1" ||
      read(storage, SESSION_HINT_KEY) === "1" ||
      read(storage, TASKS_KEY) !== null;

    // Only the root redirects; deep links (/today, /login, /reset-password…)
    // always open the app.
    if (pathname === "/" && !started) {
      return { action: "redirect", to: landingFor(languages) };
    }

    return { action: "enter", language: null, search };
  }

  function run() {
    // Reading localStorage itself can throw when site data is blocked.
    let storage;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }

    const { location, navigator } = window;
    const result = decide({
      pathname: location.pathname,
      search: location.search,
      storage,
      languages:
        navigator.languages && navigator.languages.length
          ? navigator.languages
          : [navigator.language],
    });

    if (result.action === "redirect") {
      // main.jsx checks this flag so the app does not start (and seed its
      // demo data) while the browser is leaving the page.
      window.__ANCHORLY_REDIRECTING__ = true;
      location.replace(result.to);
      return;
    }

    write(storage, STARTED_KEY, "1");

    // Coming from the English landing page: start the app in English, unless
    // a language was already chosen. The app stores settings as JSON.
    if (result.language && read(storage, LANGUAGE_KEY) === null) {
      write(storage, LANGUAGE_KEY, JSON.stringify(result.language));
    }

    if (result.search !== location.search) {
      window.history.replaceState(
        window.history.state,
        "",
        location.pathname + result.search + location.hash,
      );
    }
  }

  window.__anchorlyFirstVisit = { decide };
  run();
})(window);
