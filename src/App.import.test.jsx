import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setSessionHint } from "./data/local/sessionHint";
import { respondToDataRoute } from "./test/dataRoutes";
import { renderApp } from "./test/renderApp";

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
const IMPORT_RESULT = {
  projects: { imported: 0, skipped: 0 },
  routines: { imported: 0, skipped: 0 },
  routineChecks: { imported: 0, skipped: 0 },
  tasks: { imported: 1, skipped: 0 },
};

function stubFetch() {
  const fetchSpy = vi.fn(async (url, init) => {
    if (url === "/api/auth/refresh") {
      return jsonResponse(200, SESSION);
    }

    if (url === "/api/import") {
      return jsonResponse(200, IMPORT_RESULT);
    }

    return respondToDataRoute(url, init) ?? jsonResponse(404, {});
  });

  vi.stubGlobal("fetch", fetchSpy);

  return fetchSpy;
}

function seedLocalTask() {
  localStorage.setItem("language", JSON.stringify("en"));
  localStorage.setItem(
    "tasks",
    JSON.stringify([
      {
        id: "aaaaaaaa-0000-4000-8000-000000000001",
        title: "Task from this device",
        order: 0,
      },
    ]),
  );
  setSessionHint();
}

function countCalls(fetchSpy, path) {
  return fetchSpy.mock.calls.filter(([url]) => url === path).length;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("moving local data to the account", () => {
  it("asks after sign-in, imports, then loads the account data again", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    seedLocalTask();
    const fetchSpy = stubFetch();
    const user = userEvent.setup();

    renderApp("/");

    await user.click(await screen.findByRole("button", { name: "Move" }));
    await screen.findByRole("heading", { name: "Move complete" });

    const importCall = fetchSpy.mock.calls.find(
      ([url]) => url === "/api/import",
    );
    expect(JSON.parse(importCall[1].body).tasks).toHaveLength(1);
    expect(countCalls(fetchSpy, "/api/tasks")).toBe(1);

    await user.click(screen.getByRole("button", { name: "Done" }));

    await waitFor(() => expect(countCalls(fetchSpy, "/api/tasks")).toBe(2));
    expect(await screen.findByRole("main")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem("tasks")).toBeNull();
  });

  it("does not ask when the answer was no before", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    seedLocalTask();
    localStorage.setItem("importDecision:user-1", "declined");
    stubFetch();

    renderApp("/");

    expect(await screen.findByRole("main")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not ask guests", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    localStorage.setItem("language", JSON.stringify("en"));
    localStorage.setItem(
      "tasks",
      JSON.stringify([
        { id: "aaaaaaaa-0000-4000-8000-000000000001", title: "Mine", order: 0 },
      ]),
    );
    vi.stubGlobal("fetch", vi.fn());

    renderApp("/");

    expect(await screen.findByRole("main")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("offers the move on the account page after saying no", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    seedLocalTask();
    stubFetch();
    const user = userEvent.setup();

    renderApp("/account");

    await user.click(
      await screen.findByRole("button", { name: "No, don't move" }),
    );

    expect(
      await screen.findByRole("button", {
        name: "Move the data on this device",
      }),
    ).toBeInTheDocument();
  });
});
