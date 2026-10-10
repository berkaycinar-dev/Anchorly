import { useEffect, useState } from "react";
import { getLocalDateString } from "../utils/dateHelpers";

const MIDNIGHT_MARGIN_MS = 500;

function getMillisecondsUntilNextMidnight() {
  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  return nextMidnight.getTime() - now.getTime();
}

export default function useToday() {
  const [today, setToday] = useState(() => getLocalDateString());

  useEffect(() => {
    let timeoutId;

    function refreshToday() {
      setToday(getLocalDateString());
    }

    function scheduleNextRefresh() {
      timeoutId = setTimeout(() => {
        refreshToday();
        scheduleNextRefresh();
      }, getMillisecondsUntilNextMidnight() + MIDNIGHT_MARGIN_MS);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshToday();
      }
    }

    scheduleNextRefresh();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", refreshToday);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", refreshToday);
    };
  }, []);

  return today;
}