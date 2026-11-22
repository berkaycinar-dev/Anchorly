import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthContext } from "../../auth/AuthContext";
import { AUTH_STATUS } from "../../auth/authStatus";
import { ApiError } from "../../data/api/ApiError";
import { strings } from "../../strings";
import TermsUpdateDialog from "./TermsUpdateDialog";

const t = strings.en;
const USER = {
  id: "user-1",
  email: "dev@anchorly.local",
  termsAccepted: false,
};

function renderDialog(overrides = {}) {
  const value = {
    status: AUTH_STATUS.signedIn,
    user: USER,
    api: { acceptTerms: vi.fn(async () => ({ ...USER, termsAccepted: true })) },
    setUser: vi.fn(),
    logout: vi.fn(async () => ({ serverSignedOut: true, error: null })),
    ...overrides,
  };

  render(
    <AuthContext.Provider value={value}>
      <TermsUpdateDialog t={t} />
    </AuthContext.Provider>,
  );

  return value;
}

describe("TermsUpdateDialog", () => {
  it("asks a signed-in user who has not accepted the current terms", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", { name: t.termsUpdateTitle });
    expect(dialog).toHaveAttribute("open");
    expect(screen.getByText(t.termsUpdateBody)).toBeInTheDocument();
  });

  it("stays hidden when the terms are accepted or the user is signed out", () => {
    const { unmount } = render(
      <AuthContext.Provider
        value={{
          status: AUTH_STATUS.signedIn,
          user: { ...USER, termsAccepted: true },
        }}
      >
        <TermsUpdateDialog t={t} />
      </AuthContext.Provider>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    unmount();

    render(
      <AuthContext.Provider
        value={{ status: AUTH_STATUS.signedOut, user: null }}
      >
        <TermsUpdateDialog t={t} />
      </AuthContext.Provider>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays hidden when the server does not report the field", () => {
    render(
      <AuthContext.Provider
        value={{
          status: AUTH_STATUS.signedIn,
          user: { id: "user-1", email: "dev@anchorly.local" },
        }}
      >
        <TermsUpdateDialog t={t} />
      </AuthContext.Provider>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens both documents in a new tab", () => {
    renderDialog();

    const terms = screen.getByRole("link", {
      name: new RegExp(t.legalTermsTitle),
    });
    const privacy = screen.getByRole("link", {
      name: new RegExp(t.legalPrivacyTitle),
    });

    expect(terms).toHaveAttribute("href", "/terms");
    expect(privacy).toHaveAttribute("href", "/privacy");
    for (const link of [terms, privacy]) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("records the acceptance and passes the updated user on", async () => {
    const user = userEvent.setup();
    const auth = renderDialog();

    await user.click(screen.getByRole("button", { name: t.termsUpdateAccept }));

    expect(auth.api.acceptTerms).toHaveBeenCalledTimes(1);
    expect(auth.setUser).toHaveBeenCalledWith({ ...USER, termsAccepted: true });
  });

  it("shows an error and lets the user try again when accepting fails", async () => {
    const user = userEvent.setup();
    const acceptTerms = vi
      .fn()
      .mockRejectedValueOnce(new ApiError({ status: 0, code: "NETWORK_ERROR" }))
      .mockResolvedValueOnce({ ...USER, termsAccepted: true });
    const auth = renderDialog({ api: { acceptTerms } });

    await user.click(screen.getByRole("button", { name: t.termsUpdateAccept }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(auth.setUser).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: t.termsUpdateAccept }));

    expect(auth.setUser).toHaveBeenCalledTimes(1);
  });

  it("signs the user out instead", async () => {
    const user = userEvent.setup();
    const auth = renderDialog();

    await user.click(screen.getByRole("button", { name: t.signOut }));

    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(auth.api.acceptTerms).not.toHaveBeenCalled();
  });

  it("cannot be dismissed with the Escape key", async () => {
    const user = userEvent.setup();
    renderDialog();
    const dialog = screen.getByRole("dialog");

    const cancel = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancel);
    await user.keyboard("{Escape}");

    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog).toHaveAttribute("open");
  });
});
