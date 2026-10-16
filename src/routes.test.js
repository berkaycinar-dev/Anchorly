import { describe, it, expect } from "vitest";
import {
  routes,
  PROJECT_DETAIL_PATH,
  getRouteForPathname,
  getProjectPath,
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

  it.each([
    ["/", "Dashboard"],
    ["/today", "Today"],
    ["/routine", "Daily Routine"],
    ["/calendar", "Calendar"],
    ["/archive", "Archive"],
    ["/projects", "Projects"],
    ["/projects/abc", "Projects"],
    ["/settings", "Settings"],
  ])("finds the page for %s", (pathname, expectedKey) => {
    expect(getRouteForPathname(pathname).key).toBe(expectedKey);
  });

  it.each(["/missing", "/todayx", "/today/extra", "/projects/a/b"])(
    "finds no page for %s",
    (pathname) => {
      expect(getRouteForPathname(pathname)).toBeNull();
    },
  );
});
