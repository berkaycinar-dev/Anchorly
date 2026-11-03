import { describe, it, expect } from "vitest";
import {
  routes,
  PROJECT_DETAIL_PATH,
  ARCHIVE_SERIES_PATH,
  accountRoute,
  authRoutes,
  getAuthRouteForPathname,
  getRouteForPathname,
  getProjectPath,
  getArchiveSeriesPath,
} from "./routes";
import { strings } from "./strings";

describe("routes", () => {
  it("lists the seven pages in sidebar order", () => {
    expect(routes.map((route) => route.key)).toEqual([
      "Dashboard",
      "Today",
      "Daily Routine",
      "Calendar",
      "Archive",
      "Projects",
      "Settings",
    ]);
  });

  it("gives every page its own path", () => {
    expect(routes.map((route) => route.path)).toEqual([
      "/",
      "/today",
      "/routine",
      "/calendar",
      "/archive",
      "/projects",
      "/settings",
    ]);
  });

  it("points every title key at a label in both languages", () => {
    routes.forEach((route) => {
      expect(typeof strings.tr[route.titleKey]).toBe("string");
      expect(typeof strings.en[route.titleKey]).toBe("string");
    });
  });

  it("describes the project detail path", () => {
    expect(PROJECT_DETAIL_PATH).toBe("/projects/:projectId");
  });

  it("builds the path of a single project", () => {
    expect(getProjectPath("abc")).toBe("/projects/abc");
  });

  it("describes the archive series path", () => {
    expect(ARCHIVE_SERIES_PATH).toBe("/archive/series/:groupId");
  });

  it("builds the path of a single archive series", () => {
    expect(getArchiveSeriesPath("g 1")).toBe("/archive/series/g%201");
  });

  it.each([
    ["/", "Dashboard"],
    ["/today", "Today"],
    ["/routine", "Daily Routine"],
    ["/calendar", "Calendar"],
    ["/archive", "Archive"],
    ["/archive/series/abc", "Archive"],
    ["/projects", "Projects"],
    ["/projects/abc", "Projects"],
    ["/settings", "Settings"],
  ])("finds the page for %s", (pathname, expectedKey) => {
    expect(getRouteForPathname(pathname).key).toBe(expectedKey);
  });

  it.each([
    "/missing",
    "/todayx",
    "/today/extra",
    "/projects/a/b",
    "/archive/series",
    "/archive/series/a/b",
  ])("finds no page for %s", (pathname) => {
    expect(getRouteForPathname(pathname)).toBeNull();
  });

  it("keeps the account page out of the sidebar routes but resolves its title", () => {
    expect(routes.some((route) => route.path === accountRoute.path)).toBe(
      false,
    );
    expect(getRouteForPathname("/account")).toBe(accountRoute);
    expect(strings.tr[accountRoute.titleKey]).toBeTruthy();
    expect(strings.en[accountRoute.titleKey]).toBeTruthy();
  });

  it("lists the auth pages outside the sidebar routes", () => {
    expect(authRoutes.map((route) => route.path)).toEqual([
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
    ]);
    expect(routes.some((route) => route.path === "/login")).toBe(false);
  });

  it("finds auth routes by pathname", () => {
    expect(getAuthRouteForPathname("/login").key).toBe("Login");
    expect(getAuthRouteForPathname("/register").key).toBe("Register");
    expect(getAuthRouteForPathname("/today")).toBeNull();
  });

  it("gives every auth page a title string in both languages", () => {
    for (const route of authRoutes) {
      expect(strings.tr[route.titleKey]).toBeTruthy();
      expect(strings.en[route.titleKey]).toBeTruthy();
    }
  });
});
