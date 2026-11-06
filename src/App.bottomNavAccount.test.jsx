import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setSessionHint } from "./data/local/sessionHint";
import { respondToDataRoute } from "./test/dataRoutes";
import { getCurrentPath, renderApp } from "./test/renderApp";

function jsonResponse(status, body) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const SESSION = {
  user: { id: "user-1", email: "dev@anchorly.local", displayName: "Dev User" },
  accessToken: "token-1",
  accessTokenExpiresIn: 900,
  refreshTokenExpiresAt: "2026-12-01T00:00:00.000Z",
};

async function findBottomNav() {
  return screen.findByRole("navigation", { name: "Bottom menu" });
}

async function openMore() {
  const user = userEvent.setup();
  const nav = await findBottomNav();

  await user.click(within(nav).getByRole("button", { name: "More" }));

  return { user, nav: within(nav) };
}

function stubSignedInApi() {
  const fetchSpy = vi.fn(
    async (url, init) =>
      respondToDataRoute(url, init) ??
      (url === "/api/auth/refresh"
        ? jsonResponse(200, SESSION)
        : url === "/api/me/sessions"
          ? jsonResponse(200, [])
          : jsonResponse(204)),
  );

  vi.stubGlobal("fetch", fetchSpy);
  setSessionHint();

  return fetchSpy;
}

beforeEach(() => {
  localStorage.setItem("language", JSON.stringify("en"));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("account entries in the bottom menu", () => {
  it("shows no account entries while authentication is disabled", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "false");

    renderApp("/");

    const { nav } = await openMore();

    expect(nav.queryByRole("link", { name: "Sign in" })).toBeNull();
    expect(nav.queryByRole("link", { name: "Sign up" })).toBeNull();
    expect(nav.queryByRole("link", { name: "Account" })).toBeNull();
    expect(nav.queryByRole("button", { name: "Sign out" })).toBeNull();
  });

  it("offers sign in and sign up to guests", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    vi.stubGlobal("fetch", vi.fn());

    renderApp("/");

    const { nav } = await openMore();

    expect(nav.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(nav.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(nav.queryByRole("link", { name: "Account" })).toBeNull();
    expect(nav.queryByRole("button", { name: "Sign out" })).toBeNull();
  });

  it("opens the sign up page from the menu", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    vi.stubGlobal("fetch", vi.fn());

    renderApp("/");

    const { user, nav } = await openMore();

    await user.click(nav.getByRole("link", { name: "Sign up" }));

    expect(getCurrentPath()).toBe("/register");
  });

  it("offers the account page and sign out to signed in users", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    stubSignedInApi();

    renderApp("/");

    const { nav } = await openMore();

    expect(nav.getByRole("link", { name: "Account" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(nav.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(nav.queryByRole("link", { name: "Sign in" })).toBeNull();
    expect(nav.queryByRole("link", { name: "Sign up" })).toBeNull();
  });

  it("keeps More marked on the account page", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    stubSignedInApi();

    renderApp("/");

    const { user, nav } = await openMore();

    await user.click(nav.getByRole("link", { name: "Account" }));

    expect(getCurrentPath()).toBe("/account");
    expect(nav.getByRole("button", { name: "More" })).toHaveClass(
      "bottom-nav-item-active",
    );
    expect(nav.getByRole("button", { name: "More" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("signs out from the menu and offers sign in again", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    const fetchSpy = stubSignedInApi();

    renderApp("/");

    const { user, nav } = await openMore();

    await user.click(nav.getByRole("button", { name: "Sign out" }));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/auth/logout",
        expect.objectContaining({ method: "POST" }),
      ),
    );

    const freshNav = within(await findBottomNav());

    await user.click(freshNav.getByRole("button", { name: "More" }));

    expect(
      await freshNav.findByRole("link", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(freshNav.queryByRole("button", { name: "Sign out" })).toBeNull();
  });
});
