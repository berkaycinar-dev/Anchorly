import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setSessionHint } from "./data/local/sessionHint";
import { TABLET_MEDIA_QUERY } from "./hooks/useSidebar";
import { renderApp } from "./test/renderApp";

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

function getSidebar() {
  return document.querySelector(".sidebar");
}

beforeEach(() => {
  localStorage.setItem("language", JSON.stringify("en"));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  delete window.matchMedia;
});

describe("sidebar account area", () => {
  it("stays hidden while authentication is disabled", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "false");

    renderApp("/");

    expect(await screen.findByRole("main")).toBeInTheDocument();
    expect(getSidebar().querySelector(".sidebar-account")).toBeNull();
  });

  it("offers sign in and sign up to guests", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    vi.stubGlobal("fetch", vi.fn());

    renderApp("/");

    const sidebar = within(getSidebar());

    expect(sidebar.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(sidebar.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("shows the restored user and signs out through the API", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    const fetchSpy = vi.fn(async (url) =>
      url === "/api/auth/refresh"
        ? jsonResponse(200, SESSION)
        : jsonResponse(204),
    );
    vi.stubGlobal("fetch", fetchSpy);
    setSessionHint();
    const user = userEvent.setup();

    renderApp("/");

    expect(
      within(getSidebar()).getByRole("status", { name: "Loading account" }),
    ).toBeInTheDocument();

    const trigger = await within(getSidebar()).findByRole("button", {
      name: "Dev User, account menu",
    });

    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: "Sign out" }));

    expect(
      await within(getSidebar()).findByRole("link", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("closes only the menu with Escape inside the tablet overlay", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, SESSION)),
    );
    window.matchMedia = (media) => ({
      matches: media === TABLET_MEDIA_QUERY,
      media,
      addEventListener() {},
      removeEventListener() {},
    });
    setSessionHint();
    const user = userEvent.setup();

    renderApp("/");

    await user.click(screen.getByRole("button", { name: /^Anchorly, / }));
    await user.click(
      await within(getSidebar()).findByRole("button", {
        name: "Dev User, account menu",
      }),
    );
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).toBeNull();
    expect(getSidebar()).toHaveAttribute("data-overlay", "true");

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(getSidebar()).toHaveAttribute("data-overlay", "false"),
    );
  });
});
