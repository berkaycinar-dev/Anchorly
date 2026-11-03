import { useCallback, useEffect, useState } from "react";

export default function useCountdown() {
  const [endsAt, setEndsAt] = useState(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (endsAt === null) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(left);

      if (left === 0) {
        setEndsAt(null);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [endsAt]);

  const start = useCallback((seconds) => {
    setRemaining(seconds);
    setEndsAt(Date.now() + seconds * 1000);
  }, []);

  return [remaining, start];
}

export function formatCountdown(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
