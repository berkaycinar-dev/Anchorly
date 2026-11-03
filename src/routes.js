import { matchPath } from "react-router";

export const routes = [
  { key: "Dashboard", path: "/", titleKey: "dashboard" },
  { key: "Today", path: "/today", titleKey: "today" },
  { key: "Daily Routine", path: "/routine", titleKey: "dailyRoutine" },
  { key: "Calendar", path: "/calendar", titleKey: "calendar" },
  { key: "Archive", path: "/archive", titleKey: "archive" },
  { key: "Projects", path: "/projects", titleKey: "projects" },
  { key: "Settings", path: "/settings", titleKey: "settings" },
];

export const authRoutes = [
  { key: "Login", path: "/login", titleKey: "signIn" },
  { key: "Register", path: "/register", titleKey: "signUp" },
  { key: "Forgot", path: "/forgot-password", titleKey: "authForgotTitle" },
  { key: "Reset", path: "/reset-password", titleKey: "authResetTitle" },
];

export const PROJECT_DETAIL_PATH = "/projects/:projectId";

export const ARCHIVE_SERIES_PATH = "/archive/series/:groupId";

export function getProjectPath(projectId) {
  return `/projects/${encodeURIComponent(projectId)}`;
}

export function getArchiveSeriesPath(groupId) {
  return `/archive/series/${encodeURIComponent(groupId)}`;
}

export function getRouteForPathname(pathname) {
  const route = routes.find((candidate) => matchPath(candidate.path, pathname));

  if (route) {
    return route;
  }

  if (matchPath(PROJECT_DETAIL_PATH, pathname)) {
    return routes.find((candidate) => candidate.key === "Projects");
  }

  if (matchPath(ARCHIVE_SERIES_PATH, pathname)) {
    return routes.find((candidate) => candidate.key === "Archive");
  }

  return null;
}

export function getAuthRouteForPathname(pathname) {
  return (
    authRoutes.find((candidate) => matchPath(candidate.path, pathname)) ?? null
  );
}
