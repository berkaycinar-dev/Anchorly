import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setSessionHint } from "./data/local/sessionHint";
import { TABLET_MEDIA_QUERY } from "./hooks/useSidebar";
import { respondToDataRoute } from "./test/dataRoutes";
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
    const fetchSpy = vi.fn(
      async (url, init) =>
        respondToDataRoute(url, init) ??
        (url === "/api/auth/refresh"
          ? jsonResponse(200, SESSION)
          : jsonResponse(204)),
    );
    vi.stubGlobal("fetch", fetchSpy);
    setSessionHint();
    const user = userEvent.setup();

    renderApp("/");

    expect(screen.getByRole("status")).toHaveTextContent("Loading your data");
    expect(getSidebar()).toBeNull();

    const trigger = await screen.findByRole("button", {
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
      vi.fn(
        async (url, init) =>
          respondToDataRoute(url, init) ?? jsonResponse(200, SESSION),
      ),
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

    await user.click(
      await screen.findByRole("button", { name: /^Anchorly, / }),
    );
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

describe("changes waiting to be sent", () => {
  it("shows the waiting changes in the app while the server cannot be reached", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    localStorage.setItem(
      "outbox:user-1",
      JSON.stringify([
        {
          method: "PATCH",
          path: "/tasks/11111111-1111-4111-8111-111111111111",
          body: { title: "Offline edit" },
          time: "2026-11-05T09:00:00.000Z",
        },
      ]),
    );
    const fetchSpy = vi.fn(async (url, init) => {
      if (init?.method === "PATCH") {
        throw new TypeError("Failed to fetch");
      }

      return (
        respondToDataRoute(url, init) ??
        (url === "/api/auth/refresh"
          ? jsonResponse(200, SESSION)
          : jsonResponse(204))
      );
    });
    vi.stubGlobal("fetch", fetchSpy);
    setSessionHint();

    renderApp("/");

    expect(
      await screen.findByText(
        "You are offline. 1 change will be sent when you are back online.",
      ),
    ).toBeInTheDocument();
    expect(localStorage.getItem("outbox:user-1")).not.toBeNull();
  });

  it("sends the waiting changes with the time they were made and clears them", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    localStorage.setItem(
      "outbox:user-1",
      JSON.stringify([
        {
          method: "PATCH",
          path: "/tasks/11111111-1111-4111-8111-111111111111",
          body: { title: "Offline edit" },
          time: "2026-11-05T09:00:00.000Z",
        },
      ]),
    );
    const fetchSpy = vi.fn(
      async (url, init) =>
        respondToDataRoute(url, init) ??
        (url === "/api/auth/refresh"
          ? jsonResponse(200, SESSION)
          : jsonResponse(200, {})),
    );
    vi.stubGlobal("fetch", fetchSpy);
    setSessionHint();

    renderApp("/");

    expect(await screen.findByRole("main")).toBeInTheDocument();

    const patch = fetchSpy.mock.calls.find(
      ([, init]) => init?.method === "PATCH",
    );

    expect(patch[0]).toBe("/api/tasks/11111111-1111-4111-8111-111111111111");
    expect(patch[1].headers["X-Client-Time"]).toBe("2026-11-05T09:00:00.000Z");
    expect(localStorage.getItem("outbox:user-1")).toBeNull();
  });
});
