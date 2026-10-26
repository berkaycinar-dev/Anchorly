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

export const PROJECT_DETAIL_PATH = "/projects/:projectId";

export function getProjectPath(projectId) {
  return `/projects/${encodeURIComponent(projectId)}`;
}

export function getRouteForPathname(pathname) {
  const route = routes.find((candidate) => matchPath(candidate.path, pathname));

  if (route) {
    return route;
  }

  if (matchPath(PROJECT_DETAIL_PATH, pathname)) {
    return routes.find((candidate) => candidate.key === "Projects");
  }

  return null;
}
