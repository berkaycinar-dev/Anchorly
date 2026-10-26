import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { renderApp } from "./test/renderApp";

function getAppRoot() {
  return document.querySelector(".app");
}

describe("App settings", () => {
  it("opens with the default theme, font and language", () => {
    renderApp("/settings");

    expect(getAppRoot()).toHaveClass("theme-gray");
    expect(getAppRoot().style.getPropertyValue("--font-main")).toContain(
      "Inter",
    );
    expect(document.querySelector(".page-title")).toHaveTextContent("Ayarlar");
  });

  it("applies and saves a new theme", async () => {
    const user = userEvent.setup();
    renderApp("/settings");

    await user.click(screen.getByRole("button", { name: "green" }));

    expect(getAppRoot()).toHaveClass("theme-green");
    expect(localStorage.getItem("theme")).toBe('"green"');
  });

  it("switches the interface to English and saves the language", async () => {
    const user = userEvent.setup();
    renderApp("/settings");

    await user.click(screen.getByRole("button", { name: "EN" }));

    expect(document.querySelector(".page-title")).toHaveTextContent("Settings");
    expect(localStorage.getItem("language")).toBe('"en"');
  });

  it("applies and saves a new font and week start", async () => {
    const user = userEvent.setup();
    renderApp("/settings");

    await user.click(screen.getByRole("button", { name: "Poppins" }));
    await user.click(screen.getByRole("button", { name: "Pazar" }));

    expect(getAppRoot().style.getPropertyValue("--font-main")).toContain(
      "Poppins",
    );
    expect(localStorage.getItem("fontFamily")).toBe('"Poppins"');
    expect(localStorage.getItem("weekStartDay")).toBe('"sunday"');
  });

  it("keeps the chosen settings after the app opens again", async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp("/settings");
    await user.click(screen.getByRole("button", { name: "pink" }));
    await user.click(screen.getByRole("button", { name: "EN" }));
    unmount();

    renderApp("/settings");

    expect(getAppRoot()).toHaveClass("theme-pink");
    expect(document.querySelector(".page-title")).toHaveTextContent("Settings");
  });
});