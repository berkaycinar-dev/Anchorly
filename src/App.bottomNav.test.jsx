import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, it, expect } from "vitest";
import { renderApp, getCurrentPath } from "./test/renderApp";

function getBottomNav() {
  return screen.getByRole("navigation", { name: "Bottom menu" });
}

function getTab(name) {
  return within(getBottomNav()).getByRole("link", { name });
}

function getMoreButton() {
  return within(getBottomNav()).getByRole("button", { name: "More" });
}

beforeEach(() => {
  localStorage.setItem("language", JSON.stringify("en"));
});

describe("App bottom navigation", () => {
  it("shows four page tabs and a More button", () => {
    renderApp("/");

    expect(getTab(/^Dashboard/)).toHaveAttribute("href", "/");
    expect(getTab(/^Today/)).toHaveAttribute("href", "/today");
    expect(getTab(/^Routine/)).toHaveAttribute("href", "/routine");
    expect(getTab(/^Calendar/)).toHaveAttribute("href", "/calendar");
    expect(getMoreButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the remaining pages out of reach until More is opened", () => {
    renderApp("/");

    expect(
      within(getBottomNav()).queryByRole("link", { name: /^Archive/ }),
    ).not.toBeInTheDocument();
  });

  it("marks only the tab of the current page", () => {
    renderApp("/calendar");

    expect(getTab(/^Calendar/)).toHaveAttribute("aria-current", "page");
    expect(getTab(/^Dashboard/)).not.toHaveAttribute("aria-current");
    expect(getMoreButton()).not.toHaveClass("bottom-nav-item-active");
  });

  it("moves between pages with the tabs", async () => {
    const user = userEvent.setup();
    renderApp("/");

    await user.click(getTab(/^Routine/));

    expect(getCurrentPath()).toBe("/routine");
    expect(getTab(/^Routine/)).toHaveAttribute("aria-current", "page");
  });

  it("opens the More menu and navigates to a page inside it", async () => {
    const user = userEvent.setup();
    renderApp("/");

    await user.click(getMoreButton());

    expect(getMoreButton()).toHaveAttribute("aria-expanded", "true");
    expect(getTab(/^Archive/)).toHaveAttribute("href", "/archive");
    expect(getTab(/^Projects/)).toHaveAttribute("href", "/projects");
    expect(getTab(/^Settings/)).toHaveAttribute("href", "/settings");

    await user.click(getTab(/^Settings/));

    expect(getCurrentPath()).toBe("/settings");
    expect(getMoreButton()).toHaveAttribute("aria-expanded", "false");
    expect(getMoreButton()).toHaveClass("bottom-nav-item-active");
  });

  it("closes the More menu with Escape and returns focus to the button", async () => {
    const user = userEvent.setup();
    renderApp("/");

    await user.click(getMoreButton());
    await user.keyboard("{Escape}");

    expect(getMoreButton()).toHaveAttribute("aria-expanded", "false");
    expect(getMoreButton()).toHaveFocus();
  });

  it("closes the More menu when tapping outside of it", async () => {
    const user = userEvent.setup();
    renderApp("/");

    await user.click(getMoreButton());
    await user.click(document.querySelector(".page-title"));

    expect(getMoreButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps More marked on a project path", () => {
    localStorage.setItem(
      "projects",
      JSON.stringify([
        { id: "22222222-2222-4222-8222-222222222222", name: "Project 1" },
      ]),
    );
    renderApp("/projects/22222222-2222-4222-8222-222222222222");

    expect(getMoreButton()).toHaveClass("bottom-nav-item-active");
  });

  it("shows the active task count on the Today tab", () => {
    renderApp("/");

    const badge = getTab(/^Today/).querySelector(".bottom-nav-badge");

    expect(badge).toBeInTheDocument();
    expect(Number(badge.textContent)).toBeGreaterThan(0);
  });
});
