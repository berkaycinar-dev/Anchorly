import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderApp } from "./test/renderApp";

function iconsIn(element) {
  return [...element.querySelectorAll("svg")];
}

function expectNavIcon(link, width) {
  const icons = iconsIn(link);

  expect(icons).toHaveLength(1);
  expect(icons[0]).toHaveClass("nav-icon", "lucide");
  expect(icons[0]).toHaveAttribute("aria-hidden", "true");
  expect(icons[0]).toHaveAttribute("width", width);
}

beforeEach(() => {
  localStorage.setItem("language", JSON.stringify("en"));
});

describe("navigation icons", () => {
  it("gives every sidebar link one decorative icon", () => {
    renderApp("/");

    const sidebar = screen.getByRole("navigation", { name: "Main menu" });
    const links = within(sidebar).getAllByRole("link");

    expect(links).toHaveLength(7);
    links.forEach((link) => expectNavIcon(link, "18"));
  });

  it("gives every bottom navigation entry one decorative icon", () => {
    renderApp("/");

    const bottomNav = screen.getByRole("navigation", { name: "Bottom menu" });
    const entries = [
      ...within(bottomNav).getAllByRole("link", { hidden: true }),
      within(bottomNav).getByRole("button", { name: "More" }),
    ];

    expect(entries).toHaveLength(8);
    entries.forEach((entry) => expectNavIcon(entry, "20"));
  });

  it.each([["Main menu"], ["Bottom menu"]])(
    "uses a different icon for every entry in the %s",
    (name) => {
      renderApp("/");

      const navigation = screen.getByRole("navigation", { name });
      const shapes = iconsIn(navigation).map((icon) => icon.innerHTML);

      expect(shapes.length).toBeGreaterThanOrEqual(7);
      expect(new Set(shapes).size).toBe(shapes.length);
    },
  );
});
