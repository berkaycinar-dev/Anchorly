import { useContext, useEffect } from "react";
import { DataContext } from "./DataContext";

export const REFRESH_MIN_GAP_MS = 10000;
export const REFRESH_INTERVAL_MS = 60000;

export default function useDataRefresh(enabled) {
  const context = useContext(DataContext);

  useEffect(() => {
    if (!enabled || !context) {
      return undefined;
    }

    let lastRun = Date.now();

    function run(force) {
      const now = Date.now();

      if (!force && now - lastRun < REFRESH_MIN_GAP_MS) {
        return;
      }

      lastRun = now;
      context.refresh();
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        run(false);
      }
    }

    function handleFocus() {
      run(false);
    }

    function handleOnline() {
      run(true);
    }

    function handleInterval() {
      if (document.visibilityState === "visible") {
        run(false);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    const intervalId = setInterval(handleInterval, REFRESH_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      clearInterval(intervalId);
    };
  }, [context, enabled]);
}
