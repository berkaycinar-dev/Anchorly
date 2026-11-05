import { useState } from "react";
import createLocalSettingsRepository from "../../data/local/settingsRepository";

export default function useFallbackPreferences() {
  const [preferences] = useState(() =>
    createLocalSettingsRepository().getSnapshot(),
  );

  return preferences;
}
