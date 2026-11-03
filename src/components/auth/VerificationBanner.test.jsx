import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../../auth/AuthContext";
import { AUTH_STATUS } from "../../auth/authStatus";
import { ApiError } from "../../data/api/ApiError";
import { strings } from "../../strings";
import ToastProvider from "../toast/ToastProvider";
import VerificationBanner from "./VerificationBanner";

const t = strings.en;
const UNVERIFIED = {
  id: "user-1",
  email: "dev@anchorly.local",
  emailVerifiedAt: null,
};

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderBanner({
  status = AUTH_STATUS.signedIn,
  user = UNVERIFIED,
  resendVerification = vi.fn().mockResolvedValue(undefined),
  getMe = vi.fn().mockResolvedValue({ ...UNVERIFIED, emailVerifiedAt: "x" }),
  setUser = vi.fn(),
} = {}) {
  const view = render(
    <MemoryRouter useTransitions={false}>
      <ToastProvider closeLabel="Close">
        <AuthContext.Provider
          value={{
            status,
            user,
            setUser,
            api: { resendVerification, getMe },
          }}
        >
          <VerificationBanner t={t} />
        </AuthContext.Provider>
      </ToastProvider>
    </MemoryRouter>,
  );

  return { ...view, resendVerification, getMe, setUser };
}

describe("VerificationBanner", () => {
  it("shows for a signed-in user with an unverified email", () => {
    renderBanner();

    expect(
      screen.getByRole("region", { name: t.verifyBannerLabel }),
    ).toHaveTextContent(t.verifyBannerBody("dev@anchorly.local"));
  });

  it("stays hidden for verified users, guests and loading sessions", () => {
    for (const options of [
      { user: { ...UNVERIFIED, emailVerifiedAt: "2026-11-01T00:00:00.000Z" } },
      { status: AUTH_STATUS.signedOut, user: null },
      { status: AUTH_STATUS.loading, user: null },
      { status: AUTH_STATUS.disabled, user: null },
    ]) {
      const { container, unmount } = renderBanner(options);
      expect(container.querySelector(".verify-banner")).toBeNull();
      unmount();
    }
  });

  it("resends the link, confirms with a toast and locks the button for a minute", async () => {
    const user = userEvent.setup();
    const { resendVerification } = renderBanner();

    await user.click(screen.getByRole("button", { name: t.authResend }));

    expect(resendVerification).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(t.verifyLinkSent)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t.authResendIn(60) }),
    ).toBeDisabled();
  });

  it("explains rate limiting in a toast", async () => {
    const user = userEvent.setup();
    renderBanner({
      resendVerification: vi.fn().mockRejectedValue(
        new ApiError({
          status: 429,
          code: "TOO_MANY_REQUESTS",
          message: "x",
          retryAfterSeconds: 90,
        }),
      ),
    });

    await user.click(screen.getByRole("button", { name: t.authResend }));

    expect(
      await screen.findByText(t.authTooManyRequests(1, 30)),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t.authResendIn(90) }),
    ).toBeDisabled();
  });

  it("refreshes the user when the email is already verified", async () => {
    const user = userEvent.setup();
    const { getMe, setUser } = renderBanner({
      resendVerification: vi.fn().mockRejectedValue(
        new ApiError({
          status: 409,
          code: "EMAIL_ALREADY_VERIFIED",
          message: "x",
        }),
      ),
    });

    await user.click(screen.getByRole("button", { name: t.authResend }));

    await waitFor(() => {
      expect(setUser).toHaveBeenCalledTimes(1);
    });
    expect(getMe).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(t.verifyAlreadyVerified),
    ).toBeInTheDocument();
  });

  it("can be dismissed and stays dismissed for the session", async () => {
    const user = userEvent.setup();
    const first = renderBanner();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(first.container.querySelector(".verify-banner")).toBeNull();
    first.unmount();

    const second = renderBanner();
    expect(second.container.querySelector(".verify-banner")).toBeNull();
  });

  it("re-enables the resend button after the countdown", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderBanner();

    await user.click(screen.getByRole("button", { name: t.authResend }));
    await screen.findByRole("button", { name: t.authResendIn(60) });

    act(() => {
      vi.advanceTimersByTime(61000);
    });

    expect(
      await screen.findByRole("button", { name: t.authResend }),
    ).toBeEnabled();
  });
});
