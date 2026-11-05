import { act, render, renderHook, screen } from "@testing-library/react";
import { useContext } from "react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthContext } from "../auth/AuthContext";
import { AUTH_STATUS } from "../auth/authStatus";
import { ApiError } from "./api/ApiError";
import DataProvider from "./DataProvider";
import { DataContext } from "./DataContext";
import useRepository from "./useRepository";

function createFakeRepository(initialStatus = "ready") {
  let status = initialStatus;
  const listeners = new Set();

  return {
    getStatus: () => status,
    getSnapshot: () => [],
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start: vi.fn(() => Promise.resolve()),
    create: vi.fn(() => Promise.reject(new Error("offline"))),
    refresh: vi.fn(() => Promise.resolve()),
    setStatus(next) {
      status = next;
      listeners.forEach((listener) => listener());
    },
  };
}

function createApiSet(status = "ready") {
  return {
    tasks: createFakeRepository(status),
    projects: createFakeRepository(status),
  };
}

function authValue(overrides = {}) {
  return {
    status: AUTH_STATUS.signedIn,
    user: { id: "user-1" },
    api: { client: { id: "client" } },
    logout: vi.fn(),
    ...overrides,
  };
}

function renderWithAuth(ui, auth) {
  return render(<AuthContext.Provider value={auth}>{ui}</AuthContext.Provider>);
}

function Probe() {
  return <p>app content</p>;
}

describe("DataProvider with an account", () => {
  it("uses the local repositories while signed out", () => {
    const createRepositories = vi.fn(() => createApiSet());
    const createApiRepositories = vi.fn(() => createApiSet());

    renderWithAuth(
      <DataProvider
        createRepositories={createRepositories}
        createApiRepositories={createApiRepositories}
      >
        <Probe />
      </DataProvider>,
      authValue({ status: AUTH_STATUS.signedOut, user: null }),
    );

    expect(createRepositories).toHaveBeenCalledTimes(1);
    expect(createApiRepositories).not.toHaveBeenCalled();
    expect(screen.getByText("app content")).toBeInTheDocument();
  });

  it("uses the API repositories with the client while signed in", async () => {
    const createApiRepositories = vi.fn(() => createApiSet());
    const request = vi.fn(() => Promise.resolve([]));
    const auth = authValue({ api: { client: { id: "client", request } } });

    renderWithAuth(
      <DataProvider
        createRepositories={() => createApiSet()}
        createApiRepositories={createApiRepositories}
        today="2026-11-05"
      >
        <Probe />
      </DataProvider>,
      auth,
    );

    expect(createApiRepositories).toHaveBeenCalledWith({
      client: expect.objectContaining({
        id: "client",
        request: expect.any(Function),
      }),
      today: "2026-11-05",
    });

    const { client } = createApiRepositories.mock.calls[0][0];

    await client.request("GET", "/tasks");

    expect(request).toHaveBeenCalledWith("GET", "/tasks", {});
  });

  it("refreshes every repository when the connection comes back", async () => {
    const repositories = createApiSet();

    renderWithAuth(
      <DataProvider
        createRepositories={() => createApiSet()}
        createApiRepositories={() => repositories}
        today="2026-11-05"
      >
        <Probe />
      </DataProvider>,
      authValue(),
    );

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(repositories.tasks.refresh).toHaveBeenCalledTimes(1);
    expect(repositories.projects.refresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh while the data is still loading", () => {
    const repositories = createApiSet("loading");

    renderWithAuth(
      <DataProvider
        createRepositories={() => createApiSet()}
        createApiRepositories={() => repositories}
        today="2026-11-05"
      >
        <Probe />
      </DataProvider>,
      authValue(),
    );

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(repositories.tasks.refresh).not.toHaveBeenCalled();
  });

  it("sends the changes saved earlier before it starts the repositories", async () => {
    localStorage.setItem(
      "outbox:user-1",
      JSON.stringify([
        {
          method: "PATCH",
          path: "/tasks/1",
          body: { title: "x" },
          time: "2026-11-05T09:00:00.000Z",
        },
      ]),
    );
    let finishRequest;
    const request = vi.fn(
      () =>
        new Promise((resolve) => {
          finishRequest = () => resolve({});
        }),
    );
    const apiSet = createApiSet("loading");

    renderWithAuth(
      <DataProvider createApiRepositories={() => apiSet}>
        <Probe />
      </DataProvider>,
      authValue({ api: { client: { request } } }),
    );

    expect(request).toHaveBeenCalledTimes(1);
    expect(apiSet.tasks.start).not.toHaveBeenCalled();

    await act(async () => finishRequest());

    expect(apiSet.tasks.start).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("outbox:user-1")).toBeNull();
  });

  it("refreshes the repositories once the saved changes have been sent", async () => {
    localStorage.setItem(
      "outbox:user-1",
      JSON.stringify([
        {
          method: "PATCH",
          path: "/tasks/1",
          body: {},
          time: "2026-11-05T09:00:00.000Z",
        },
      ]),
    );
    const apiSet = createApiSet();
    const request = vi.fn(() => Promise.resolve({}));

    renderWithAuth(
      <DataProvider createApiRepositories={() => apiSet}>
        <Probe />
      </DataProvider>,
      authValue({ api: { client: { request } } }),
    );

    await act(async () => {});

    expect(apiSet.tasks.refresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh while changes are still waiting to be sent", async () => {
    localStorage.setItem(
      "outbox:user-1",
      JSON.stringify([
        {
          method: "PATCH",
          path: "/tasks/1",
          body: {},
          time: "2026-11-05T09:00:00.000Z",
        },
      ]),
    );
    const apiSet = createApiSet();
    const request = vi.fn(() =>
      Promise.reject(
        new ApiError({ status: 0, code: "NETWORK_ERROR", message: "x" }),
      ),
    );

    renderWithAuth(
      <DataProvider createApiRepositories={() => apiSet}>
        <Probe />
      </DataProvider>,
      authValue({ api: { client: { request } } }),
    );

    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });

    expect(apiSet.tasks.refresh).not.toHaveBeenCalled();
    expect(localStorage.getItem("outbox:user-1")).not.toBeNull();
  });

  it("sends the waiting changes again when the connection comes back", async () => {
    localStorage.setItem(
      "outbox:user-1",
      JSON.stringify([
        {
          method: "PATCH",
          path: "/tasks/1",
          body: {},
          time: "2026-11-05T09:00:00.000Z",
        },
      ]),
    );
    const request = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({ status: 0, code: "NETWORK_ERROR", message: "x" }),
      )
      .mockResolvedValue({});

    renderWithAuth(
      <DataProvider createApiRepositories={() => createApiSet()}>
        <Probe />
      </DataProvider>,
      authValue({ api: { client: { request } } }),
    );

    await act(async () => {});

    expect(localStorage.getItem("outbox:user-1")).not.toBeNull();

    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });

    expect(request).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem("outbox:user-1")).toBeNull();
  });

  it("has no outbox on the local repositories", () => {
    const { result } = renderHook(() => useContext(DataContext), {
      wrapper: ({ children }) => (
        <AuthContext.Provider
          value={authValue({
            status: AUTH_STATUS.signedOut,
            user: null,
            api: null,
          })}
        >
          <DataProvider createRepositories={() => createApiSet()}>
            {children}
          </DataProvider>
        </AuthContext.Provider>
      ),
    });

    expect(result.current.outbox).toBeNull();
  });

  it("shows a loading screen instead of the app while the session is restored", () => {
    const createRepositories = vi.fn(() => createApiSet());

    renderWithAuth(
      <DataProvider createRepositories={createRepositories}>
        <Probe />
      </DataProvider>,
      authValue({ status: AUTH_STATUS.loading, user: null, api: null }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Verilerin yükleniyor",
    );
    expect(screen.queryByText("app content")).not.toBeInTheDocument();
    expect(createRepositories).not.toHaveBeenCalled();
  });

  it("starts every API repository even when nothing asks for it", () => {
    const apiSet = createApiSet("loading");

    renderWithAuth(
      <DataProvider createApiRepositories={() => apiSet}>
        <Probe />
      </DataProvider>,
      authValue(),
    );

    expect(apiSet.tasks.start).toHaveBeenCalledTimes(1);
    expect(apiSet.projects.start).toHaveBeenCalledTimes(1);
  });

  it("shows the loading screen until every repository is ready, then the app", () => {
    const apiSet = createApiSet("loading");

    renderWithAuth(
      <DataProvider createApiRepositories={() => apiSet}>
        <Probe />
      </DataProvider>,
      authValue(),
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("app content")).not.toBeInTheDocument();

    act(() => apiSet.tasks.setStatus("ready"));
    expect(screen.queryByText("app content")).not.toBeInTheDocument();

    act(() => apiSet.projects.setStatus("ready"));
    expect(screen.getByText("app content")).toBeInTheDocument();
  });

  it("shows the error screen when a repository fails to load", () => {
    const apiSet = createApiSet("loading");

    renderWithAuth(
      <DataProvider createApiRepositories={() => apiSet}>
        <Probe />
      </DataProvider>,
      authValue(),
    );

    act(() => apiSet.tasks.setStatus("error"));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Verilerin yüklenemedi",
    );
    expect(screen.queryByText("app content")).not.toBeInTheDocument();
  });

  it("retries only the repositories that failed", async () => {
    const apiSet = createApiSet("loading");

    renderWithAuth(
      <DataProvider createApiRepositories={() => apiSet}>
        <Probe />
      </DataProvider>,
      authValue(),
    );
    act(() => apiSet.tasks.setStatus("error"));
    act(() => apiSet.projects.setStatus("ready"));
    apiSet.tasks.start.mockClear();
    apiSet.projects.start.mockClear();

    await userEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));

    expect(apiSet.tasks.start).toHaveBeenCalledTimes(1);
    expect(apiSet.projects.start).not.toHaveBeenCalled();
  });

  it("signs out from the error screen", async () => {
    const apiSet = createApiSet("error");
    const auth = authValue();

    renderWithAuth(
      <DataProvider createApiRepositories={() => apiSet}>
        <Probe />
      </DataProvider>,
      auth,
    );

    await userEvent.click(screen.getByRole("button", { name: "Çıkış yap" }));

    expect(auth.logout).toHaveBeenCalledTimes(1);
  });

  it("creates new repositories when another user signs in", () => {
    const createApiRepositories = vi.fn(() => createApiSet());
    const tree = (userId) => (
      <AuthContext.Provider value={authValue({ user: { id: userId } })}>
        <DataProvider createApiRepositories={createApiRepositories}>
          <Probe />
        </DataProvider>
      </AuthContext.Provider>
    );
    const { rerender } = render(tree("user-1"));

    rerender(tree("user-1"));
    expect(createApiRepositories).toHaveBeenCalledTimes(1);

    rerender(tree("user-2"));
    expect(createApiRepositories).toHaveBeenCalledTimes(2);
  });

  it("switches back to local repositories after signing out", () => {
    const createRepositories = vi.fn(() => createApiSet());
    const createApiRepositories = vi.fn(() => createApiSet());
    const tree = (auth) => (
      <AuthContext.Provider value={auth}>
        <DataProvider
          createRepositories={createRepositories}
          createApiRepositories={createApiRepositories}
        >
          <Probe />
        </DataProvider>
      </AuthContext.Provider>
    );
    const { rerender } = render(tree(authValue()));

    rerender(tree(authValue({ status: AUTH_STATUS.signedOut, user: null })));

    expect(createRepositories).toHaveBeenCalledTimes(1);
    expect(screen.getByText("app content")).toBeInTheDocument();
  });

  it("reports a rejected change through the data error store", async () => {
    const { getSnapshot } = await import("./api/dataErrorStatus");
    const apiSet = createApiSet();
    const before = getSnapshot().id;

    const { result } = renderHook(() => useRepository("tasks"), {
      wrapper: ({ children }) => (
        <AuthContext.Provider value={authValue()}>
          <DataProvider createApiRepositories={() => apiSet}>
            {children}
          </DataProvider>
        </AuthContext.Provider>
      ),
    });

    await expect(result.current.create()).rejects.toThrow("offline");

    expect(getSnapshot().id).toBe(before + 1);
  });

  it("stays on local repositories when signed in but the auth api has no client", () => {
    const createRepositories = vi.fn(() => createApiSet());
    const createApiRepositories = vi.fn(() => createApiSet());

    renderWithAuth(
      <DataProvider
        createRepositories={createRepositories}
        createApiRepositories={createApiRepositories}
      >
        <Probe />
      </DataProvider>,
      authValue({ api: {} }),
    );

    expect(createRepositories).toHaveBeenCalledTimes(1);
    expect(createApiRepositories).not.toHaveBeenCalled();
  });

  it("creates fresh repositories when a reload is asked for", () => {
    const createApiRepositories = vi.fn(() => createApiSet());
    const { result } = renderHook(() => useContext(DataContext), {
      wrapper: ({ children }) => (
        <AuthContext.Provider value={authValue()}>
          <DataProvider createApiRepositories={createApiRepositories}>
            {children}
          </DataProvider>
        </AuthContext.Provider>
      ),
    });
    const firstRepositories = result.current.repositories;

    act(() => result.current.reload());

    expect(createApiRepositories).toHaveBeenCalledTimes(2);
    expect(result.current.repositories).not.toBe(firstRepositories);
  });

  it("also reloads the local repositories", () => {
    const createRepositories = vi.fn(() => createApiSet());
    const { result } = renderHook(() => useContext(DataContext), {
      wrapper: ({ children }) => (
        <DataProvider createRepositories={createRepositories}>
          {children}
        </DataProvider>
      ),
    });

    act(() => result.current.reload());

    expect(createRepositories).toHaveBeenCalledTimes(2);
  });
});
