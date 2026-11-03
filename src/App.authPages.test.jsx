import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setSessionHint } from "./data/local/sessionHint";
import { getCurrentPath, renderApp } from "./test/renderApp";

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const SESSION = {
  user: { id: "user-1", email: "dev@anchorly.local", displayName: "Dev" },
  accessToken: "token-1",
  accessTokenExpiresIn: 900,
  refreshTokenExpiresAt: "2026-12-01T00:00:00.000Z",
};

beforeEach(() => {
  localStorage.setItem("language", JSON.stringify("en"));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("auth pages in the app", () => {
  it("renders the sign-in page without the app shell", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    vi.stubGlobal("fetch", vi.fn());

    renderApp("/login");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeInTheDocument();
    expect(document.querySelector(".sidebar")).toBeNull();
    expect(document.querySelector(".bottom-nav")).toBeNull();
    expect(document.title).toBe("Anchorly — Sign in");
  });

  it("renders the register page", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    vi.stubGlobal("fetch", vi.fn());

    renderApp("/register");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Create account" }),
    ).toBeInTheDocument();
  });

  it("redirects the auth pages home while authentication is disabled", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "false");

    renderApp("/login");

    await waitFor(() => {
      expect(getCurrentPath()).toBe("/");
    });
    expect(document.querySelector(".sidebar")).not.toBeNull();
  });

  it("signs in through the API and lands on the panel", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    const fetchSpy = vi.fn(async () => jsonResponse(200, SESSION));
    vi.stubGlobal("fetch", fetchSpy);
    const user = userEvent.setup();

    renderApp("/login?next=%2Ftoday");

    await user.type(
      await screen.findByLabelText("Email"),
      "dev@anchorly.local",
    );
    await user.type(screen.getByLabelText("Password"), "password1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(getCurrentPath()).toBe("/today");
    });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/auth/login");
    expect(JSON.parse(init.body)).toEqual({
      email: "dev@anchorly.local",
      password: "password1",
    });
    expect(document.querySelector(".sidebar")).not.toBeNull();
  });

  it("registers with the interface language", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    const fetchSpy = vi.fn(async () => jsonResponse(201, SESSION));
    vi.stubGlobal("fetch", fetchSpy);
    const user = userEvent.setup();

    renderApp("/register");

    await user.type(
      await screen.findByLabelText("Email"),
      "new@anchorly.local",
    );
    await user.type(screen.getByLabelText("Password"), "password1");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(getCurrentPath()).toBe("/");
    });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/auth/register");
    expect(JSON.parse(init.body).language).toBe("en");
  });

  it("sends a restored session straight away from the auth page", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, SESSION)),
    );
    setSessionHint();

    renderApp("/login");

    await waitFor(() => {
      expect(getCurrentPath()).toBe("/");
    });
  });

  it("uses the Turkish copy when the language is Turkish", async () => {
    localStorage.setItem("language", JSON.stringify("tr"));
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    vi.stubGlobal("fetch", vi.fn());

    renderApp("/login");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Giriş yap" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("E-posta")).toBeInTheDocument();
  });

  it("renders the forgot and reset pages without the app shell", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    vi.stubGlobal("fetch", vi.fn());

    const first = renderApp("/forgot-password");
    expect(
      await screen.findByRole("heading", { name: "Forgot your password?" }),
    ).toBeInTheDocument();
    expect(document.querySelector(".sidebar")).toBeNull();
    first.unmount();

    renderApp("/reset-password#token=abc");
    expect(
      await screen.findByRole("heading", { name: "Set a new password" }),
    ).toBeInTheDocument();
    expect(document.querySelector(".sidebar")).toBeNull();
  });

  it("requests a reset link through the API", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    const fetchSpy = vi.fn(async () => new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchSpy);
    const user = userEvent.setup();

    renderApp("/forgot-password");

    await user.type(
      await screen.findByLabelText("Email"),
      "dev@anchorly.local",
    );
    await user.click(screen.getByRole("button", { name: "Send link" }));

    expect(
      await screen.findByRole("heading", { name: "Check your email" }),
    ).toBeInTheDocument();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/auth/forgot-password");
    expect(JSON.parse(init.body)).toEqual({ email: "dev@anchorly.local" });
  });

  it("resets the password and shows the confirmation on sign in", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    const fetchSpy = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchSpy);
    const user = userEvent.setup();

    renderApp("/reset-password#token=abc123");

    await user.type(
      await screen.findByLabelText("New password"),
      "newpassword1",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(getCurrentPath()).toBe("/login");
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your password was updated",
    );
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/auth/reset-password");
    expect(JSON.parse(init.body)).toEqual({
      token: "abc123",
      password: "newpassword1",
    });
  });

  it("verifies the email from the link and clears the banner", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    const unverified = {
      ...SESSION,
      user: { ...SESSION.user, emailVerifiedAt: null },
    };
    const fetchSpy = vi.fn(async (url) => {
      if (url === "/api/auth/refresh") {
        return jsonResponse(200, unverified);
      }
      return jsonResponse(200, {
        user: { ...SESSION.user, emailVerifiedAt: "2026-11-04T00:00:00.000Z" },
      });
    });
    vi.stubGlobal("fetch", fetchSpy);
    setSessionHint();

    renderApp("/verify-email#token=tok1");

    expect(
      await screen.findByRole("heading", { name: "Email verified" }),
    ).toBeInTheDocument();
    const verifyCall = fetchSpy.mock.calls.find(
      ([url]) => url === "/api/auth/verify-email",
    );
    expect(JSON.parse(verifyCall[1].body)).toEqual({ token: "tok1" });

    await userEvent.click(screen.getByRole("link", { name: "Go to the app" }));

    expect(await screen.findByRole("main")).toBeInTheDocument();
    expect(document.querySelector(".verify-banner")).toBeNull();
  });

  it("shows the verification banner inside the app for unverified users", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(200, {
          ...SESSION,
          user: { ...SESSION.user, emailVerifiedAt: null },
        }),
      ),
    );
    setSessionHint();

    renderApp("/");

    expect(
      await screen.findByRole("region", { name: "Email verification" }),
    ).toBeInTheDocument();
  });
});

describe("account page in the app", () => {
  it("redirects signed-out visitors to sign in with a return path", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    vi.stubGlobal("fetch", vi.fn());

    renderApp("/account");

    await waitFor(() => {
      expect(getCurrentPath()).toBe("/login");
    });
    expect(screen.getByTestId("location")).toHaveAttribute(
      "data-search",
      "?next=%2Faccount",
    );
  });

  it("redirects home while authentication is disabled", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "false");

    renderApp("/account");

    await waitFor(() => {
      expect(getCurrentPath()).toBe("/");
    });
  });

  it("shows the account page inside the app shell for a restored session", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    setSessionHint();
    const fetchSpy = vi.fn(async (url) => {
      if (url === "/api/auth/refresh") {
        return jsonResponse(200, SESSION);
      }
      if (url === "/api/me/sessions") {
        return jsonResponse(200, []);
      }
      return jsonResponse(404, {});
    });
    vi.stubGlobal("fetch", fetchSpy);

    renderApp("/account");

    expect(
      await screen.findByRole("region", { name: "Profile" }),
    ).toBeInTheDocument();
    expect(getCurrentPath()).toBe("/account");
    expect(document.querySelector(".sidebar")).not.toBeNull();
    expect(document.title).toBe("Anchorly — Account");
  });
});
