import { DEFAULT_SETTINGS, THEMES } from "../constants/settings";
import { normalizeDashboardLayout } from "../constants/dashboardCards";

export const SETTING_TRANSFORMS = {
  theme: (savedTheme) =>
    THEMES.includes(savedTheme) ? savedTheme : DEFAULT_SETTINGS.theme,
  dashboardLayout: normalizeDashboardLayout,
};

export function normalizeSettings(rawSettings) {
  return Object.fromEntries(
    Object.entries(DEFAULT_SETTINGS).map(([key, fallback]) => {
      const value = rawSettings?.[key] ?? fallback;
      const transform = SETTING_TRANSFORMS[key];

      return [key, transform ? transform(value) : value];
    }),
  );
}
