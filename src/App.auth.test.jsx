import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setSessionHint } from "./data/local/sessionHint";
import { renderApp } from "./test/renderApp";

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("App authentication", () => {
  it("never contacts the API while authentication is disabled", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "false");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    setSessionHint();

    renderApp("/");

    expect(await screen.findByRole("main")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("restores the session through the API proxy when enabled", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    const fetchSpy = vi.fn(async () =>
      jsonResponse(200, {
        user: { id: "user-1", email: "dev@anchorly.local" },
        accessToken: "token-1",
        accessTokenExpiresIn: 900,
        refreshTokenExpiresAt: "2026-12-01T00:00:00.000Z",
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    setSessionHint();

    renderApp("/");

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/auth/refresh");
    expect(init.method).toBe("POST");
  });

  it("does not contact the API on start without a session hint", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    renderApp("/");

    expect(await screen.findByRole("main")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
