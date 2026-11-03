import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AUTH_STATUS } from "../auth/authStatus";
import { ApiError } from "../data/api/ApiError";
import { strings } from "../strings";
import { renderAuthPage } from "../test/authPageHelpers";
import VerifyEmailPage from "./VerifyEmailPage";

const t = strings.en;
const VERIFIED_USER = {
  id: "user-1",
  email: "dev@anchorly.local",
  emailVerifiedAt: "2026-11-04T00:00:00.000Z",
};

function renderVerify({
  hash = "#token=abc123",
  verifyEmail = vi.fn().mockResolvedValue(VERIFIED_USER),
  resendVerification = vi.fn().mockResolvedValue(undefined),
  getMe = vi.fn().mockResolvedValue(VERIFIED_USER),
  setUser = vi.fn(),
  status = AUTH_STATUS.signedOut,
  user = null,
  strict = false,
} = {}) {
  const element = <VerifyEmailPage t={t} />;
  const view = renderAuthPage(element, {
    path: `/verify-email${hash}`,
    strict,
    status,
    user,
    setUser,
    api: { verifyEmail, resendVerification, getMe },
  });

  return { ...view, verifyEmail, resendVerification, getMe, setUser };
}

describe("VerifyEmailPage", () => {
  it("verifies the token once, even under StrictMode, and removes it from the address", async () => {
    const { verifyEmail } = renderVerify({ strict: true });

    expect(
      await screen.findByRole("heading", { name: t.verifySuccessTitle }),
    ).toBeInTheDocument();
    expect(verifyEmail).toHaveBeenCalledTimes(1);
    expect(verifyEmail).toHaveBeenCalledWith("abc123");
    expect(screen.getByTestId("location")).toHaveAttribute("data-hash", "");
  });

  it("shows a loading state while verifying", () => {
    renderVerify({ verifyEmail: vi.fn(() => new Promise(() => {})) });

    expect(
      screen.getByRole("heading", { name: t.verifyLoadingTitle }),
    ).toBeInTheDocument();
  });

  it("updates the signed-in user and links to the app on success", async () => {
    const { setUser } = renderVerify({
      status: AUTH_STATUS.signedIn,
      user: {
        id: "user-1",
        email: "dev@anchorly.local",
        emailVerifiedAt: null,
      },
    });

    const link = await screen.findByRole("link", { name: t.verifyGoToApp });
    expect(link).toHaveAttribute("href", "/");
    expect(setUser).toHaveBeenCalledWith(VERIFIED_USER);
  });

  it("offers sign in after success when signed out", async () => {
    renderVerify();

    expect(await screen.findByRole("link", { name: t.signIn })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows the invalid state without a token and never calls the API", () => {
    const { verifyEmail } = renderVerify({ hash: "" });

    expect(
      screen.getByRole("heading", { name: t.authLinkInvalidTitle }),
    ).toBeInTheDocument();
    expect(verifyEmail).not.toHaveBeenCalled();
  });

  it("shows the invalid state when the token is rejected", async () => {
    renderVerify({
      verifyEmail: vi.fn().mockRejectedValue(
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
    expect(screen.getByRole("link", { name: t.signIn })).toBeInTheDocument();
  });

  it("requests a new link in one click when signed in", async () => {
    const user = userEvent.setup();
    const { resendVerification } = renderVerify({
      status: AUTH_STATUS.signedIn,
      verifyEmail: vi.fn().mockRejectedValue(
        new ApiError({
          status: 400,
          code: "INVALID_EMAIL_TOKEN",
          message: "x",
        }),
      ),
    });

    await user.click(
      await screen.findByRole("button", { name: t.authRequestNewLink }),
    );

    expect(resendVerification).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("button", { name: t.verifyLinkSent }),
    ).toBeDisabled();
  });

  it("shows the rate limit message when requesting a new link fails", async () => {
    const user = userEvent.setup();
    renderVerify({
      status: AUTH_STATUS.signedIn,
      verifyEmail: vi.fn().mockRejectedValue(
        new ApiError({
          status: 400,
          code: "INVALID_EMAIL_TOKEN",
          message: "x",
        }),
      ),
      resendVerification: vi.fn().mockRejectedValue(
        new ApiError({
          status: 429,
          code: "TOO_MANY_REQUESTS",
          message: "x",
          retryAfterSeconds: 45,
        }),
      ),
    });

    await user.click(
      await screen.findByRole("button", { name: t.authRequestNewLink }),
    );

    expect(
      await screen.findByText(t.authTooManyRequests(0, 45)),
    ).toBeInTheDocument();
  });

  it("switches to the success state when the account is already verified", async () => {
    const user = userEvent.setup();
    renderVerify({
      status: AUTH_STATUS.signedIn,
      verifyEmail: vi.fn().mockRejectedValue(
        new ApiError({
          status: 400,
          code: "INVALID_EMAIL_TOKEN",
          message: "x",
        }),
      ),
      resendVerification: vi.fn().mockRejectedValue(
        new ApiError({
          status: 409,
          code: "EMAIL_ALREADY_VERIFIED",
          message: "x",
        }),
      ),
    });

    await user.click(
      await screen.findByRole("button", { name: t.authRequestNewLink }),
    );

    expect(
      await screen.findByRole("heading", { name: t.verifySuccessTitle }),
    ).toBeInTheDocument();
  });

  it("lets the user retry after a network failure", async () => {
    const user = userEvent.setup();
    const verifyEmail = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({ status: 0, code: "NETWORK_ERROR", message: "x" }),
      )
      .mockResolvedValueOnce(VERIFIED_USER);
    renderVerify({ verifyEmail });

    expect(
      await screen.findByRole("heading", { name: t.verifyFailedTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(t.authNetworkError)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t.verifyRetry }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: t.verifySuccessTitle }),
      ).toBeInTheDocument();
    });
    expect(verifyEmail).toHaveBeenCalledTimes(2);
    expect(verifyEmail).toHaveBeenLastCalledWith("abc123");
  });
});
