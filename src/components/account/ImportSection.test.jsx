import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { strings } from "../../strings";
import { renderWithAuth } from "../../test/renderWithAuth";
import ImportSection from "./ImportSection";

const t = strings.en;

function seedLocalData() {
  localStorage.setItem(
    "tasks",
    JSON.stringify([
      { id: "aaaaaaaa-0000-4000-8000-000000000001", title: "Real", order: 0 },
    ]),
  );
}

function render(request = vi.fn()) {
  return renderWithAuth(<ImportSection t={t} />, {
    api: { client: { request } },
  });
}

describe("ImportSection", () => {
  it("is hidden when nothing but the demo data is on the device", () => {
    render();

    expect(screen.queryByRole("region")).toBeNull();
  });

  it("is hidden without an API client", () => {
    seedLocalData();

    renderWithAuth(<ImportSection t={t} />, { api: {} });

    expect(screen.queryByRole("region")).toBeNull();
  });

  it("offers the move and opens the dialog", async () => {
    seedLocalData();
    const user = userEvent.setup();
    render();

    await user.click(screen.getByRole("button", { name: t.importOpen }));

    expect(
      await screen.findByRole("heading", { name: t.importDialogTitle }),
    ).toBeInTheDocument();
  });

  it("is still offered after the answer was no", () => {
    seedLocalData();
    localStorage.setItem("importDecision:user-1", "declined");

    render();

    expect(
      screen.getByRole("button", { name: t.importOpen }),
    ).toBeInTheDocument();
  });

  it("cancels without sending anything or storing an answer", async () => {
    seedLocalData();
    const user = userEvent.setup();
    const request = vi.fn();
    render(request);

    await user.click(screen.getByRole("button", { name: t.importOpen }));
    await user.click(screen.getByRole("button", { name: t.cancelButton }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(request).not.toHaveBeenCalled();
    expect(localStorage.getItem("importDecision:user-1")).toBeNull();
    expect(screen.queryByRole("button", { name: t.importDecline })).toBeNull();
  });

  it("does not offer the no-answer button in the manual dialog", async () => {
    seedLocalData();
    const user = userEvent.setup();
    render();

    await user.click(screen.getByRole("button", { name: t.importOpen }));

    expect(screen.queryByRole("button", { name: t.importDecline })).toBeNull();
    expect(screen.queryByText(t.importDeclineHint)).toBeNull();
  });
});
