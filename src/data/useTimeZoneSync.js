import { useContext, useEffect } from "react";
import { DataContext } from "./DataContext";

function detectTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

export default function useTimeZoneSync(enabled) {
  const context = useContext(DataContext);

  useEffect(() => {
    if (!enabled || !context) {
      return;
    }

    const timezone = detectTimeZone();
    const settings = context.repositories.settings;

    if (timezone && settings && settings.getSnapshot().timezone !== timezone) {
      settings.update({ timezone }).catch(() => {});
    }
  }, [context, enabled]);
}
