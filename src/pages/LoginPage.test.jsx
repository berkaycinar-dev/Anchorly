import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTH_STATUS } from "../auth/authStatus";
import { ApiError } from "../data/api/ApiError";
import { strings } from "../strings";
import { getCurrentPath } from "../test/renderApp";
import { renderAuthPage } from "../test/authPageHelpers";
import LoginPage from "./LoginPage";

const t = strings.en;

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function renderLogin(options) {
  return renderAuthPage(<LoginPage t={t} />, {
    path: "/login",
    ...options,
  });
}

async function fillAndSubmit(user, email = "dev@anchorly.dev", password = "x") {
  if (email) {
    await user.type(screen.getByLabelText(t.authEmailLabel), email);
  }
  if (password) {
    await user.type(screen.getByLabelText(t.authPasswordLabel), password);
  }
  await user.click(screen.getByRole("button", { name: t.signIn }));
}

describe("LoginPage", () => {
  it("renders the form, the switch link and the guest link", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", { level: 1, name: t.signIn }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: t.signUp })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(
      screen.getByRole("link", { name: t.authContinueAsGuest }),
    ).toBeInTheDocument();
  });

  it("links to the password reset page", () => {
    renderLogin();

    expect(
      screen.getByRole("link", { name: t.authForgotLink }),
    ).toHaveAttribute("href", "/forgot-password");
  });

  it("confirms a finished password reset", () => {
    renderLogin({ state: { passwordReset: true } });

    expect(screen.getByRole("status")).toHaveTextContent(t.authPasswordUpdated);
  });

  it("does not show the reset confirmation by default", () => {
    renderLogin();

    expect(screen.queryByText(t.authPasswordUpdated)).toBeNull();
  });

  it("keeps the next destination on the switch link", () => {
    renderLogin({ path: "/login?next=%2Fprojects" });

    expect(screen.getByRole("link", { name: t.signUp })).toHaveAttribute(
      "href",
      "/register?next=%2Fprojects",
    );
  });

  it("sends the derived device name with the credentials", async () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    );
    const user = userEvent.setup();
    const login = vi.fn(() => new Promise(() => {}));
    renderLogin({ login });

    await fillAndSubmit(user, "dev@anchorly.dev", "secret123");

    expect(login).toHaveBeenCalledWith({
      email: "dev@anchorly.dev",
      password: "secret123",
      deviceName: "Chrome · Windows",
    });
  });

  it("shows field errors and does not call login for empty fields", async () => {
    const user = userEvent.setup();
    const { auth } = renderLogin();

    await user.click(screen.getByRole("button", { name: t.signIn }));

    expect(screen.getByText(t.authEmailRequired)).toBeInTheDocument();
    expect(screen.getByLabelText(t.authEmailLabel)).toHaveFocus();
    expect(auth.login).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(t.authEmailLabel), "a@b.co");
    expect(screen.queryByText(t.authEmailRequired)).toBeNull();

    await user.click(screen.getByRole("button", { name: t.signIn }));
    expect(screen.getByText(t.authPasswordRequired)).toBeInTheDocument();
    expect(screen.getByLabelText(t.authPasswordLabel)).toHaveFocus();
  });

  it("submits trimmed credentials", async () => {
    const user = userEvent.setup();
    const login = vi.fn(() => new Promise(() => {}));
    renderLogin({ login });

    await fillAndSubmit(user, " dev@anchorly.dev ", "secret123");

    expect(login).toHaveBeenCalledWith({
      email: "dev@anchorly.dev",
      password: "secret123",
    });
    expect(screen.getByRole("button", { name: t.signIn })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("shows a general alert for wrong credentials and re-enables the form", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(
      new ApiError({
        status: 401,
        code: "INVALID_CREDENTIALS",
        message: "x",
      }),
    );
    renderLogin({ login });

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t.authInvalidCredentials,
    );
    expect(screen.getByRole("button", { name: t.signIn })).toBeEnabled();
  });

  it("locks the button with a countdown after rate limiting", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const login = vi.fn().mockRejectedValue(
      new ApiError({
        status: 429,
        code: "TOO_MANY_REQUESTS",
        message: "x",
        retryAfterSeconds: 90,
      }),
    );
    renderLogin({ login });

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t.authTooManyRequests(1, 30),
    );
    const button = screen.getByRole("button", { name: /01:30/ });
    expect(button).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(91000);
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: t.signIn })).toBeEnabled();
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows a network alert when the server is unreachable", async () => {
    const user = userEvent.setup();
    const login = vi
      .fn()
      .mockRejectedValue(
        new ApiError({ status: 0, code: "NETWORK_ERROR", message: "x" }),
      );
    renderLogin({ login });

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t.authNetworkError,
    );
  });

  it("redirects to the safe next path when already signed in", () => {
    renderLogin({
      path: "/login?next=%2Fprojects",
      status: AUTH_STATUS.signedIn,
    });

    expect(getCurrentPath()).toBe("/projects");
  });

  it("ignores an unsafe next path and goes to the panel", () => {
    renderLogin({
      path: "/login?next=%2F%2Fevil.example",
      status: AUTH_STATUS.signedIn,
    });

    expect(getCurrentPath()).toBe("/");
  });

  it("shows a loading state while the session is restored", () => {
    renderLogin({ status: AUTH_STATUS.loading });

    expect(screen.getByRole("status")).toHaveTextContent(t.accountLoading);
    expect(screen.queryByLabelText(t.authEmailLabel)).toBeNull();
  });
});
