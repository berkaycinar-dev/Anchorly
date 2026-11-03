import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderApp, getCurrentPath } from "./test/renderApp";
import { getSidebarLink } from "./test/queries";
import { SIDEBAR_COLLAPSED_KEY } from "./data/local/sidebarPreference";
import { TABLET_MEDIA_QUERY } from "./hooks/useSidebar";

function getSidebar() {
  return document.querySelector(".sidebar");
}

function getBrandButton() {
  return screen.getByRole("button", { name: /^Anchorly, / });
}

function useTabletScreen() {
  window.matchMedia = (media) => ({
    matches: media === TABLET_MEDIA_QUERY,
    media,
    addEventListener() {},
    removeEventListener() {},
  });
}

beforeEach(() => {
  localStorage.setItem("language", JSON.stringify("en"));
});

afterEach(() => {
  delete window.matchMedia;
});

describe("collapsible sidebar on desktop", () => {
  it("collapses and expands from the logo button", async () => {
    const user = userEvent.setup();
    renderApp("/");

    expect(getBrandButton()).toHaveAccessibleName("Anchorly, collapse sidebar");
    expect(getBrandButton()).toHaveAttribute("aria-expanded", "true");
    expect(getSidebar()).toHaveAttribute("data-expanded", "true");

    await user.click(getBrandButton());

    expect(getBrandButton()).toHaveAccessibleName("Anchorly, expand sidebar");
    expect(getBrandButton()).toHaveAttribute("aria-expanded", "false");
    expect(getSidebar()).toHaveAttribute("data-expanded", "false");
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe("1");

    await user.click(getBrandButton());

    expect(getSidebar()).toHaveAttribute("data-expanded", "true");
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe("0");
  });

  it("restores the collapsed state on the next visit", () => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "1");

    renderApp("/");

    expect(getSidebar()).toHaveAttribute("data-expanded", "false");
    expect(getBrandButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles with Ctrl+B but not while typing", async () => {
    const user = userEvent.setup();
    renderApp("/today");

    await user.keyboard("{Control>}b{/Control}");

    expect(getSidebar()).toHaveAttribute("data-expanded", "false");

    await user.click(screen.getByPlaceholderText("Add a new task..."));
    await user.keyboard("{Control>}b{/Control}");

    expect(getSidebar()).toHaveAttribute("data-expanded", "false");
  });

  it("keeps link names and badges reachable while collapsed", () => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "1");

    renderApp("/");

    expect(getSidebarLink(/^Today/)).toHaveAttribute("href", "/today");
    expect(getSidebarLink(/^Dashboard/)).toHaveAttribute("href", "/");
  });

  it("gives every link a hidden tooltip with its name", () => {
    renderApp("/");

    const nav = screen.getByRole("navigation", { name: "Main menu" });
    const tooltips = [...nav.querySelectorAll(".nav-tooltip")];

    expect(tooltips).toHaveLength(7);
    tooltips.forEach((tooltip) =>
      expect(tooltip).toHaveAttribute("aria-hidden", "true"),
    );
    expect(
      within(getSidebarLink(/^Calendar/)).getByText("Calendar", {
        selector: ".nav-tooltip",
      }),
    ).toBeInTheDocument();
  });

  it("shows the badge count in the tooltip", async () => {
    const user = userEvent.setup();
    renderApp("/today");

    await user.type(
      screen.getByPlaceholderText("Add a new task..."),
      "Write report{Enter}",
    );

    const link = getSidebarLink(/^Today/);
    const count = link.querySelector(".nav-badge").textContent;

    expect(Number(count)).toBeGreaterThan(0);
    expect(link.querySelector(".nav-tooltip")).toHaveTextContent(
      `Today · ${count}`,
    );
    expect(link).not.toHaveAccessibleName(/·/);
  });

  it("never shows a backdrop on desktop", async () => {
    const user = userEvent.setup();
    renderApp("/");

    await user.click(getBrandButton());

    expect(document.querySelector(".sidebar-backdrop")).toBeNull();
    expect(getSidebar()).toHaveAttribute("data-overlay", "false");
  });
});

describe("sidebar overlay on tablet", () => {
  it("starts narrow and opens over the content", async () => {
    useTabletScreen();
    const user = userEvent.setup();
    renderApp("/");

    expect(getSidebar()).toHaveAttribute("data-expanded", "false");
    expect(getBrandButton()).toHaveAccessibleName("Anchorly, expand sidebar");

    await user.click(getBrandButton());

    expect(getSidebar()).toHaveAttribute("data-overlay", "true");
    expect(getSidebar()).toHaveAttribute("data-expanded", "true");
    expect(document.querySelector(".sidebar-backdrop")).not.toBeNull();
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBeNull();
  });

  it("closes when the backdrop is clicked", async () => {
    useTabletScreen();
    const user = userEvent.setup();
    renderApp("/");

    await user.click(getBrandButton());
    fireEvent.click(document.querySelector(".sidebar-backdrop"));

    expect(getSidebar()).toHaveAttribute("data-overlay", "false");
    expect(document.querySelector(".sidebar-backdrop")).toBeNull();
  });

  it("closes after choosing a page", async () => {
    useTabletScreen();
    const user = userEvent.setup();
    renderApp("/");

    await user.click(getBrandButton());
    await user.click(getSidebarLink(/^Calendar/));

    expect(getCurrentPath()).toBe("/calendar");
    expect(getSidebar()).toHaveAttribute("data-overlay", "false");
  });

  it("closes with Escape", async () => {
    useTabletScreen();
    const user = userEvent.setup();
    renderApp("/");

    await user.click(getBrandButton());
    await user.keyboard("{Escape}");

    expect(getSidebar()).toHaveAttribute("data-overlay", "false");
  });

  it("forgets the open state on the next visit", async () => {
    useTabletScreen();
    const user = userEvent.setup();
    const { unmount } = renderApp("/");

    await user.click(getBrandButton());
    unmount();
    renderApp("/");

    expect(getSidebar()).toHaveAttribute("data-overlay", "false");
  });
});
