import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AUTH_STATUS } from "../auth/authStatus";
import { strings } from "../strings";
import { getCurrentPath } from "../test/renderApp";
import { renderWithAuth } from "../test/renderWithAuth";
import AccountPage from "./AccountPage";

const t = strings.en;

function renderPage(options) {
  return renderWithAuth(<AccountPage t={t} language="en" />, {
    api: { listSessions: vi.fn().mockResolvedValue([]) },
    ...options,
  });
}

describe("AccountPage", () => {
  it("renders every section for a signed-in user", async () => {
    renderPage();

    for (const title of [
      t.accountProfileTitle,
      t.accountPasswordTitle,
      t.accountSessionsTitle,
      t.accountDataTitle,
      t.accountDangerTitle,
    ]) {
      expect(screen.getByRole("region", { name: title })).toBeInTheDocument();
    }
    await screen.findByRole("region", { name: t.accountSessionsTitle });
  });

  it("shows a loading status while the session is restored", () => {
    renderPage({ status: AUTH_STATUS.loading, user: null });

    expect(screen.getByRole("status")).toHaveTextContent(t.accountLoading);
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("sends signed-out visitors to sign in and back", () => {
    renderPage({ status: AUTH_STATUS.signedOut, user: null });

    expect(getCurrentPath()).toBe("/login");
    expect(screen.getByTestId("location")).toHaveAttribute(
      "data-search",
      "?next=%2Faccount",
    );
  });
});
