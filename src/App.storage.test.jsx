import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, it, expect, vi } from "vitest";
import { renderApp } from "./test/renderApp";
import { strings } from "./strings";

const t = strings.en;

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  localStorage.setItem("language", JSON.stringify("en"));
});

describe("App and unsafe storage", () => {
  it("does not show a warning when storage is healthy", () => {
    renderApp();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("opens and warns when the stored tasks are corrupt JSON", () => {
    localStorage.setItem("tasks", "{broken");

    renderApp();

    expect(screen.getByRole("alert")).toHaveTextContent(t.storageReadWarning);
    expect(localStorage.getItem("tasks:corrupt")).toBe("{broken");
  });

  it("opens and warns when the stored tasks are not an array", () => {
    const rawValue = JSON.stringify({ not: "an array" });
    localStorage.setItem("tasks", rawValue);

    renderApp();

    expect(screen.getByRole("alert")).toHaveTextContent(t.storageReadWarning);
    expect(localStorage.getItem("tasks:corrupt")).toBe(rawValue);
  });

  it("opens in the default language and warns when reading storage is not allowed", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Access denied", "SecurityError");
    });

    renderApp();

    expect(screen.getByRole("alert")).toHaveTextContent(
      strings.tr.storageUnavailableWarning,
    );
  });

  it("opens and warns when storage is full", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota reached", "QuotaExceededError");
    });

    renderApp();

    expect(screen.getByRole("alert")).toHaveTextContent(t.storageQuotaWarning);
  });

  it("hides the warning when the close button is clicked", async () => {
    const user = userEvent.setup();
    localStorage.setItem("tasks", "{broken");

    renderApp();

    await user.click(
      within(screen.getByRole("alert")).getByRole("button", {
        name: t.closeButton,
      }),
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
