import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DataProvider from "./DataProvider";
import useRepositorySnapshot from "./useRepositorySnapshot";

function createListRepository(initialItems) {
  let items = initialItems;
  const listeners = new Set();

  return {
    getStatus: () => "ready",
    getSnapshot: () => items,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start: vi.fn(() => Promise.resolve()),
    getListenerCount: () => listeners.size,
    add(item) {
      items = [...items, item];
      listeners.forEach((listener) => listener());
      return Promise.resolve(item);
    },
  };
}

function renderSnapshot(repository) {
  function Wrapper({ children }) {
    return (
      <DataProvider createRepositories={() => ({ items: repository })}>
        {children}
      </DataProvider>
    );
  }

  return renderHook(() => useRepositorySnapshot("items"), {
    wrapper: Wrapper,
  });
}

describe("useRepositorySnapshot", () => {
  it("returns the current snapshot and the repository", () => {
    const repository = createListRepository(["a"]);

    const { result } = renderSnapshot(repository);

    expect(result.current[0]).toEqual(["a"]);
    expect(result.current[1]).toBe(repository);
  });

  it("renders again with the new snapshot after the repository changes", () => {
    const repository = createListRepository(["a"]);
    const { result } = renderSnapshot(repository);

    act(() => {
      repository.add("b");
    });

    expect(result.current[0]).toEqual(["a", "b"]);
  });

  it("starts the repository it reads", () => {
    const repository = createListRepository([]);

    renderSnapshot(repository);

    expect(repository.start).toHaveBeenCalledTimes(1);
  });

  it("stops listening to the repository after it unmounts", () => {
    const repository = createListRepository([]);
    const { unmount } = renderSnapshot(repository);
    const listenersWhileMounted = repository.getListenerCount();

    unmount();

    expect(listenersWhileMounted).toBeGreaterThan(0);
    expect(repository.getListenerCount()).toBe(0);
  });
});
