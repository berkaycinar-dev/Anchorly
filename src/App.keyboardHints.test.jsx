import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, it, expect } from "vitest";
import { renderApp } from "./test/renderApp";

beforeEach(() => {
  localStorage.setItem("language", JSON.stringify("en"));
});

describe("App keyboard hints", () => {
  it("shows a search key for the task search field", () => {
    renderApp("/today");

    expect(
      screen.getByRole("textbox", { name: "Search tasks" }),
    ).toHaveAttribute("enterkeyhint", "search");
  });

  it.each([
    ["/today", "New task"],
    ["/routine", "New routine"],
  ])("shows a done key and no autofill on %s", (path, name) => {
    renderApp(path);

    const field = screen.getByRole("textbox", { name });

    expect(field).toHaveAttribute("enterkeyhint", "done");
    expect(field).toHaveAttribute("autocomplete", "off");
  });

  it("shows a done key and no autofill on the new project field", async () => {
    const user = userEvent.setup();
    renderApp("/projects");

    await user.click(
      screen.getByRole("button", { name: "Create a new project" }),
    );

    const field = screen.getByRole("textbox", { name: "New project" });

    expect(field).toHaveAttribute("enterkeyhint", "done");
    expect(field).toHaveAttribute("autocomplete", "off");
  });
});
