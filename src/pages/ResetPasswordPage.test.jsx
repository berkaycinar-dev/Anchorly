import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../data/api/ApiError";
import { strings } from "../strings";
import { renderAuthPage } from "../test/authPageHelpers";
import { getCurrentPath } from "../test/renderApp";
import ResetPasswordPage from "./ResetPasswordPage";

const t = strings.en;

function renderReset({
  hash = "#token=abc123",
  resetPassword = vi.fn().mockResolvedValue(undefined),
} = {}) {
  return renderAuthPage(<ResetPasswordPage t={t} />, {
    path: `/reset-password${hash}`,
    api: { resetPassword },
  });
}

async function submitPassword(user, password = "newpassword1") {
  await user.type(screen.getByLabelText(t.authNewPasswordLabel), password);
  await user.click(screen.getByRole("button", { name: t.authResetSubmit }));
}

describe("ResetPasswordPage", () => {
  it("renders the new password form and removes the token from the address", () => {
    renderReset();

    expect(
      screen.getByRole("heading", { level: 1, name: t.authResetTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(t.authPasswordHint)).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveAttribute("data-hash", "");
  });

  it("shows the invalid link state when there is no token", () => {
    renderReset({ hash: "" });

    expect(
      screen.getByRole("heading", { name: t.authLinkInvalidTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: t.authRequestNewLink }),
    ).toHaveAttribute("href", "/forgot-password");
    expect(screen.getByRole("link", { name: t.signIn })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("validates the password length before calling the API", async () => {
    const user = userEvent.setup();
    const resetPassword = vi.fn();
    renderReset({ resetPassword });

    await submitPassword(user, "1234");

    expect(screen.getByText(t.authPasswordTooShort)).toBeInTheDocument();
    expect(screen.getByLabelText(t.authNewPasswordLabel)).toHaveFocus();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("sends the token and password, then goes to sign in", async () => {
    const user = userEvent.setup();
    const resetPassword = vi.fn().mockResolvedValue(undefined);
    renderReset({ resetPassword });

    await submitPassword(user);

    expect(resetPassword).toHaveBeenCalledWith({
      token: "abc123",
      password: "newpassword1",
    });
    await waitFor(() => {
      expect(getCurrentPath()).toBe("/login");
    });
  });

  it("switches to the invalid link state when the token is rejected", async () => {
    const user = userEvent.setup();
    const resetPassword = vi.fn().mockRejectedValue(
      new ApiError({
        status: 400,
        code: "INVALID_EMAIL_TOKEN",
        message: "x",
      }),
    );
    renderReset({ resetPassword });

    await submitPassword(user);

    expect(
      await screen.findByRole("heading", { name: t.authLinkInvalidTitle }),
    ).toBeInTheDocument();
  });

  it("maps a server password error onto the field", async () => {
    const user = userEvent.setup();
    const resetPassword = vi.fn().mockRejectedValue(
      new ApiError({
        status: 400,
        code: "VALIDATION_ERROR",
        message: "x",
        details: [{ path: "body.password", message: "short" }],
      }),
    );
    renderReset({ resetPassword });

    await submitPassword(user);

    expect(await screen.findByText(t.authPasswordTooShort)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t.authResetSubmit }),
    ).toBeEnabled();
  });

  it("shows the rate limit alert with a locked button", async () => {
    const user = userEvent.setup();
    const resetPassword = vi.fn().mockRejectedValue(
      new ApiError({
        status: 429,
        code: "TOO_MANY_REQUESTS",
        message: "x",
        retryAfterSeconds: 30,
      }),
    );
    renderReset({ resetPassword });

    await submitPassword(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t.authTooManyRequests(0, 30),
    );
    expect(screen.getByRole("button", { name: /00:30/ })).toBeDisabled();
  });
});
