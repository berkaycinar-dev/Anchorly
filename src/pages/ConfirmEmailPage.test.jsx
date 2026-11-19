import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AUTH_STATUS } from "../auth/authStatus";
import { ApiError } from "../data/api/ApiError";
import { NETWORK_ERROR } from "../data/api/ApiError";
import { strings } from "../strings";
import { renderAuthPage } from "../test/authPageHelpers";
import ConfirmEmailPage from "./ConfirmEmailPage";

const t = strings.en;
const OLD_USER = {
  id: "user-1",
  email: "dev@anchorly.local",
  emailVerifiedAt: null,
};
const CHANGED_USER = {
  ...OLD_USER,
  email: "new@example.com",
  emailVerifiedAt: "2026-11-19T00:00:00.000Z",
};

function renderConfirm({
  hash = "#token=abc123",
  confirmEmailChange = vi.fn().mockResolvedValue(CHANGED_USER),
  setUser = vi.fn(),
  status = AUTH_STATUS.signedOut,
  user = null,
  strict = false,
} = {}) {
  const view = renderAuthPage(<ConfirmEmailPage t={t} />, {
    path: `/confirm-email${hash}`,
    strict,
    status,
    user,
    setUser,
    api: { confirmEmailChange },
  });

  return { ...view, confirmEmailChange, setUser };
}

describe("ConfirmEmailPage", () => {
  it("confirms the token once, even under StrictMode, and removes it from the address", async () => {
    const { confirmEmailChange } = renderConfirm({ strict: true });

    expect(
      await screen.findByRole("heading", { name: t.confirmEmailSuccessTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(t.confirmEmailSuccessBody("new@example.com")),
    ).toBeInTheDocument();
    expect(confirmEmailChange).toHaveBeenCalledTimes(1);
    expect(confirmEmailChange).toHaveBeenCalledWith("abc123");
    expect(screen.getByTestId("location")).toHaveAttribute("data-hash", "");
  });

  it("shows a loading state while confirming", () => {
    renderConfirm({ confirmEmailChange: vi.fn(() => new Promise(() => {})) });

    expect(
      screen.getByRole("heading", { name: t.confirmEmailLoadingTitle }),
    ).toBeInTheDocument();
  });

  it("updates the signed-in user and links to the account page", async () => {
    const { setUser } = renderConfirm({
      status: AUTH_STATUS.signedIn,
      user: OLD_USER,
    });

    const link = await screen.findByRole("link", {
      name: t.accountGoToAccount,
    });
    expect(link).toHaveAttribute("href", "/account");
    await waitFor(() => expect(setUser).toHaveBeenCalledWith(CHANGED_USER));
  });

  it("leaves another signed-in account alone", async () => {
    const { setUser } = renderConfirm({
      status: AUTH_STATUS.signedIn,
      user: { ...OLD_USER, id: "user-2" },
    });

    await screen.findByRole("heading", { name: t.confirmEmailSuccessTitle });
    expect(setUser).not.toHaveBeenCalled();
  });

  it("offers sign in after success when signed out", async () => {
    renderConfirm();

    expect(await screen.findByRole("link", { name: t.signIn })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows an invalid link without calling the API when there is no token", () => {
    const { confirmEmailChange } = renderConfirm({ hash: "" });

    expect(
      screen.getByRole("heading", { name: t.authLinkInvalidTitle }),
    ).toBeInTheDocument();
    expect(confirmEmailChange).not.toHaveBeenCalled();
  });

  it("shows an invalid link for a used or expired token", async () => {
    renderConfirm({
      confirmEmailChange: vi.fn().mockRejectedValue(
        new ApiError({
          status: 400,
          code: "INVALID_EMAIL_TOKEN",
          message: "x",
        }),
      ),
    });

    expect(
      await screen.findByRole("heading", { name: t.authLinkInvalidTitle }),
    ).toBeInTheDocument();
  });

  it("explains when another account took the address", async () => {
    renderConfirm({
      confirmEmailChange: vi
        .fn()
        .mockRejectedValue(
          new ApiError({ status: 409, code: "EMAIL_TAKEN", message: "x" }),
        ),
    });

    expect(
      await screen.findByRole("heading", { name: t.confirmEmailTakenTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(t.confirmEmailTakenBody)).toBeInTheDocument();
  });

  it("lets the user retry after a network failure", async () => {
    const user = userEvent.setup();
    const confirmEmailChange = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({ status: 0, code: NETWORK_ERROR, message: "x" }),
      )
      .mockResolvedValueOnce(CHANGED_USER);
    renderConfirm({ confirmEmailChange });

    await user.click(
      await screen.findByRole("button", { name: t.verifyRetry }),
    );

    expect(
      await screen.findByRole("heading", { name: t.confirmEmailSuccessTitle }),
    ).toBeInTheDocument();
    expect(confirmEmailChange).toHaveBeenCalledTimes(2);
  });
});
