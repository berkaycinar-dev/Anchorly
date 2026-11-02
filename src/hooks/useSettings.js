import { useCallback } from "react";
import useRepositorySnapshot from "../data/useRepositorySnapshot";

export default function useSettings() {
  const [settings, repository] = useRepositorySnapshot("settings");

  const setTheme = useCallback(
    (theme) => {
      repository.update({ theme });
    },
    [repository],
  );

  const setLanguage = useCallback(
    (language) => {
      repository.update({ language });
    },
    [repository],
  );

  const setFontFamily = useCallback(
    (fontFamily) => {
      repository.update({ fontFamily });
    },
    [repository],
  );

  const setWeekStartDay = useCallback(
    (weekStartDay) => {
      repository.update({ weekStartDay });
    },
    [repository],
  );

  const setDashboardLayout = useCallback(
    (dashboardLayout) => {
      repository.update({ dashboardLayout });
    },
    [repository],
  );

  return {
    ...settings,
    setTheme,
    setLanguage,
    setFontFamily,
    setWeekStartDay,
    setDashboardLayout,
  };
}
