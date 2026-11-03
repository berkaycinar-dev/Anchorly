import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../data/api/ApiError";
import { strings } from "../strings";
import { renderAuthPage } from "../test/authPageHelpers";
import ForgotPasswordPage from "./ForgotPasswordPage";

const t = strings.en;

afterEach(() => {
  vi.useRealTimers();
});

function renderForgot(forgotPassword = vi.fn().mockResolvedValue(undefined)) {
  return renderAuthPage(<ForgotPasswordPage t={t} />, {
    path: "/forgot-password",
    api: { forgotPassword },
  });
}

describe("ForgotPasswordPage", () => {
  it("renders the form with a way back to sign in", () => {
    renderForgot();

    expect(
      screen.getByRole("heading", { level: 1, name: t.authForgotTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: t.authBackToSignIn }),
    ).toHaveAttribute("href", "/login");
  });

  it("validates the email before calling the API", async () => {
    const user = userEvent.setup();
    const forgotPassword = vi.fn();
    renderForgot(forgotPassword);

    await user.click(screen.getByRole("button", { name: t.authForgotSubmit }));
    expect(screen.getByText(t.authEmailRequired)).toBeInTheDocument();
    expect(screen.getByLabelText(t.authEmailLabel)).toHaveFocus();

    await user.type(screen.getByLabelText(t.authEmailLabel), "nope");
    await user.click(screen.getByRole("button", { name: t.authForgotSubmit }));
    expect(screen.getByText(t.authEmailInvalid)).toBeInTheDocument();
    expect(forgotPassword).not.toHaveBeenCalled();
  });

  it("shows the neutral sent state with a resend countdown", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const forgotPassword = vi.fn().mockResolvedValue(undefined);
    renderForgot(forgotPassword);

    await user.type(screen.getByLabelText(t.authEmailLabel), " ada@b.co ");
    await user.click(screen.getByRole("button", { name: t.authForgotSubmit }));

    expect(forgotPassword).toHaveBeenCalledWith("ada@b.co");
    expect(
      await screen.findByRole("heading", { name: t.authSentTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(t.authSentBody("ada@b.co"))).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t.authResendIn(60) }),
    ).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(61000);
    });

    const resend = await screen.findByRole("button", { name: t.authResend });
    expect(resend).toBeEnabled();

    await user.click(resend);
    expect(forgotPassword).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: t.authResendIn(60) }),
      ).toBeDisabled();
    });
  });

  it("explains rate limiting and keeps the form", async () => {
    const user = userEvent.setup();
    const forgotPassword = vi.fn().mockRejectedValue(
      new ApiError({
        status: 429,
        code: "TOO_MANY_REQUESTS",
        message: "x",
        retryAfterSeconds: 120,
      }),
    );
    renderForgot(forgotPassword);

    await user.type(screen.getByLabelText(t.authEmailLabel), "ada@b.co");
    await user.click(screen.getByRole("button", { name: t.authForgotSubmit }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t.authTooManyRequests(2, 0),
    );
    expect(
      screen.getByRole("button", { name: t.authForgotSubmit }),
    ).toBeDisabled();
  });

  it("shows a network alert and stays on the form", async () => {
    const user = userEvent.setup();
    const forgotPassword = vi
      .fn()
      .mockRejectedValue(
        new ApiError({ status: 0, code: "NETWORK_ERROR", message: "x" }),
      );
    renderForgot(forgotPassword);

    await user.type(screen.getByLabelText(t.authEmailLabel), "ada@b.co");
    await user.click(screen.getByRole("button", { name: t.authForgotSubmit }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t.authNetworkError,
    );
    expect(
      screen.getByRole("button", { name: t.authForgotSubmit }),
    ).toBeEnabled();
  });
});
