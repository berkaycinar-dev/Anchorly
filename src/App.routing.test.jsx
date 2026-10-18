import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, it, expect } from "vitest";
import { renderApp, getCurrentPath } from "./test/renderApp";
import { getSidebarLink } from "./test/queries";

const PROJECT_ID = "22222222-2222-4222-8222-222222222222";

function getPageTitle() {
  return document.querySelector(".page-title");
}

beforeEach(() => {
  localStorage.setItem("language", JSON.stringify("en"));
  localStorage.setItem(
    "projects",
    JSON.stringify([{ id: PROJECT_ID, name: "Project 1" }]),
  );
});

describe("App routing", () => {
  it.each([
    ["/", "Dashboard"],
    ["/today", "Today"],
    ["/routine", "Daily Routine"],
    ["/calendar", "Calendar"],
    ["/archive", "Archive"],
    ["/projects", "Projects"],
    ["/settings", "Settings"],
  ])("opens %s on the %s page", (path, title) => {
    renderApp(path);

    expect(getPageTitle().textContent).toBe(title);
    expect(getCurrentPath()).toBe(path);
  });

  it("sends an unknown path to the dashboard", () => {
    renderApp("/does-not-exist");

    expect(getCurrentPath()).toBe("/");
    expect(getPageTitle().textContent).toBe("Dashboard");
  });

  it("sends a nested unknown path to the dashboard", () => {
    renderApp("/today/extra");

    expect(getCurrentPath()).toBe("/");
    expect(getPageTitle().textContent).toBe("Dashboard");
  });

  it("gives each sidebar link its own href", () => {
    renderApp("/");

    expect(getSidebarLink(/^Dashboard/)).toHaveAttribute("href", "/");
    expect(getSidebarLink(/^Today/)).toHaveAttribute("href", "/today");
    expect(getSidebarLink(/^Daily Routine/)).toHaveAttribute(
      "href",
      "/routine",
    );
    expect(getSidebarLink(/^Calendar/)).toHaveAttribute("href", "/calendar");
    expect(getSidebarLink(/^Archive/)).toHaveAttribute("href", "/archive");
    expect(getSidebarLink(/^Projects/)).toHaveAttribute("href", "/projects");
    expect(getSidebarLink(/^Settings/)).toHaveAttribute("href", "/settings");
  });

  it("marks only the sidebar link of the current page", () => {
    renderApp("/calendar");

    expect(getSidebarLink(/^Calendar/)).toHaveAttribute("aria-current", "page");
    expect(getSidebarLink(/^Calendar/)).toHaveClass("nav-item", "active-nav");
    expect(getSidebarLink(/^Dashboard/)).not.toHaveAttribute("aria-current");
    expect(getSidebarLink(/^Dashboard/)).not.toHaveClass("active-nav");
  });

  it("keeps Projects marked on a project path", () => {
    renderApp(`/projects/${PROJECT_ID}`);

    expect(getSidebarLink(/^Projects/)).toHaveAttribute("aria-current", "page");
    expect(getSidebarLink(/^Dashboard/)).not.toHaveAttribute("aria-current");
  });

  it("moves between pages with the sidebar links", async () => {
    const user = userEvent.setup();
    renderApp("/");

    await user.click(getSidebarLink(/^Today/));

    expect(getCurrentPath()).toBe("/today");
    expect(getPageTitle().textContent).toBe("Today");

    await user.click(getSidebarLink(/^Calendar/));

    expect(getCurrentPath()).toBe("/calendar");
    expect(getPageTitle().textContent).toBe("Calendar");
    expect(getSidebarLink(/^Calendar/)).toHaveAttribute("aria-current", "page");
  });

  it("shows a project on its own path", () => {
    renderApp(`/projects/${PROJECT_ID}`);

    expect(
      screen.getByRole("heading", { level: 2, name: "Project 1" }),
    ).toBeInTheDocument();
    expect(getPageTitle().textContent).toBe("Projects");
  });

  it("sends an unknown project id back to the project list", () => {
    renderApp("/projects/not-a-project");

    expect(getCurrentPath()).toBe("/projects");
    expect(
      screen.getByRole("heading", { level: 3, name: "Project 1" }),
    ).toBeInTheDocument();
  });

  it("opens a project from its card", async () => {
    const user = userEvent.setup();
    renderApp("/projects");

    await user.click(
      screen.getByRole("heading", { level: 3, name: "Project 1" }),
    );

    expect(getCurrentPath()).toBe(`/projects/${PROJECT_ID}`);
    expect(
      screen.getByRole("heading", { level: 2, name: "Project 1" }),
    ).toBeInTheDocument();
  });

  it("goes back to the project list from a project", async () => {
    const user = userEvent.setup();
    renderApp(`/projects/${PROJECT_ID}`);

    await user.click(screen.getByRole("button", { name: /Back to Projects/ }));

    expect(getCurrentPath()).toBe("/projects");
    expect(
      screen.getByRole("heading", { level: 3, name: "Project 1" }),
    ).toBeInTheDocument();
  });

  it("puts the page name in the document title", async () => {
    const user = userEvent.setup();
    renderApp("/calendar");

    expect(document.title).toBe("Anchorly — Calendar");

    await user.click(getSidebarLink(/^Today/));

    expect(document.title).toBe("Anchorly — Today");
  });

  it("writes the document title in the language of the app", () => {
    localStorage.setItem("language", JSON.stringify("tr"));
    renderApp("/calendar");

    expect(document.title).toBe("Anchorly — Takvim");
  });

  it("opens the Today page and focuses the new task field on the n key", async () => {
    const user = userEvent.setup();
    renderApp("/");

    await user.keyboard("n");

    expect(getCurrentPath()).toBe("/today");
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Add a new task...")).toHaveFocus();
    });
  });
});