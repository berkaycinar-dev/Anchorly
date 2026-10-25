import { StrictMode } from "react";
import { render, renderHook } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import DataProvider from "./DataProvider";
import useRepository from "./useRepository";

function createFakeRepository() {
  return {
    getStatus: () => "ready",
    getSnapshot: () => [],
    subscribe: () => () => {},
    start: vi.fn(() => Promise.resolve()),
  };
}

function createFakeRepositories() {
  return {
    tasks: createFakeRepository(),
    projects: createFakeRepository(),
  };
}

function createWrapper(createRepositories) {
  return function Wrapper({ children }) {
    return (
      <DataProvider createRepositories={createRepositories}>
        {children}
      </DataProvider>
    );
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("DataProvider", () => {
  it("gives a hook the repository with the requested name", () => {
    const repositories = createFakeRepositories();

    const { result } = renderHook(() => useRepository("tasks"), {
      wrapper: createWrapper(() => repositories),
    });

    expect(result.current).toBe(repositories.tasks);
  });

  it("creates the repositories with today's local date", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 10, 0, 30));
    const createRepositories = vi.fn(createFakeRepositories);

    renderHook(() => useRepository("tasks"), {
      wrapper: createWrapper(createRepositories),
    });

    expect(createRepositories).toHaveBeenCalledWith({ today: "2026-10-10" });
  });

  it("keeps the same repositories when the tree renders again", () => {
    const createRepositories = vi.fn(createFakeRepositories);

    const { result, rerender } = renderHook(() => useRepository("tasks"), {
      wrapper: createWrapper(createRepositories),
    });
    const firstRepository = result.current;
    rerender();

    expect(result.current).toBe(firstRepository);
    expect(createRepositories).toHaveBeenCalledTimes(1);
  });

  it("gives each provider its own repositories", () => {
    const wrapper = createWrapper(createFakeRepositories);

    const first = renderHook(() => useRepository("tasks"), { wrapper });
    const second = renderHook(() => useRepository("tasks"), { wrapper });

    expect(first.result.current).not.toBe(second.result.current);
  });

  it("does not start a repository that nothing uses", () => {
    const repositories = createFakeRepositories();

    renderHook(() => useRepository("tasks"), {
      wrapper: createWrapper(() => repositories),
    });

    expect(repositories.tasks.start).toHaveBeenCalledTimes(1);
    expect(repositories.projects.start).not.toHaveBeenCalled();
  });

  it("starts a repository only once when several components use it", () => {
    const repositories = createFakeRepositories();

    function Consumer() {
      useRepository("tasks");
      return null;
    }

    render(
      <DataProvider createRepositories={() => repositories}>
        <Consumer />
        <Consumer />
      </DataProvider>,
    );

    expect(repositories.tasks.start).toHaveBeenCalledTimes(1);
  });

  it("starts a repository only once in strict mode", () => {
    const repositories = createFakeRepositories();

    function Consumer() {
      useRepository("tasks");
      return null;
    }

    render(
      <StrictMode>
        <DataProvider createRepositories={() => repositories}>
          <Consumer />
        </DataProvider>
      </StrictMode>,
    );

    expect(repositories.tasks.start).toHaveBeenCalledTimes(1);
  });

  it("uses the local repositories by default", () => {
    const { result } = renderHook(() => useRepository("settings"), {
      wrapper: DataProvider,
    });

    expect(result.current.getSnapshot()).toMatchObject({ language: "tr" });
  });
});

describe("useRepository", () => {
  it("throws when it is used outside a DataProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useRepository("tasks"))).toThrow(
      "useRepository must be used within a DataProvider",
    );
  });

  it("throws for a repository name that does not exist", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      renderHook(() => useRepository("notes"), {
        wrapper: createWrapper(createFakeRepositories),
      }),
    ).toThrow('Unknown repository "notes"');
  });
});