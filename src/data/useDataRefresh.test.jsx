import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataContext } from "./DataContext";
import useDataRefresh, {
  REFRESH_INTERVAL_MS,
  REFRESH_MIN_GAP_MS,
} from "./useDataRefresh";

function setup(enabled = true) {
  const refresh = vi.fn();
  const context = { refresh };
  const wrapper = ({ children }) => (
    <DataContext.Provider value={context}>{children}</DataContext.Provider>
  );
  const rendered = renderHook(() => useDataRefresh(enabled), { wrapper });

  return { refresh, ...rendered };
}

function setVisibility(state) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
}

describe("useDataRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility("visible");
  });

  afterEach(() => {
    vi.useRealTimers();
    setVisibility("visible");
  });

  it("refreshes when the tab becomes visible again", () => {
    const { refresh } = setup();

    vi.advanceTimersByTime(REFRESH_MIN_GAP_MS);
    document.dispatchEvent(new Event("visibilitychange"));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh when the tab is hidden", () => {
    const { refresh } = setup();

    vi.advanceTimersByTime(REFRESH_MIN_GAP_MS);
    setVisibility("hidden");
    document.dispatchEvent(new Event("visibilitychange"));

    expect(refresh).not.toHaveBeenCalled();
  });

  it("refreshes when the window gets focus", () => {
    const { refresh } = setup();

    vi.advanceTimersByTime(REFRESH_MIN_GAP_MS);
    window.dispatchEvent(new Event("focus"));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("refreshes on a timer while the tab is visible", () => {
    const { refresh } = setup();

    vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 2);

    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("skips the timer refresh while the tab is hidden", () => {
    const { refresh } = setup();
    setVisibility("hidden");

    vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 2);

    expect(refresh).not.toHaveBeenCalled();
  });

  it("throttles events that arrive close together", () => {
    const { refresh } = setup();

    vi.advanceTimersByTime(REFRESH_MIN_GAP_MS);
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("refreshes again once the gap has passed", () => {
    const { refresh } = setup();

    vi.advanceTimersByTime(REFRESH_MIN_GAP_MS);
    window.dispatchEvent(new Event("focus"));
    vi.advanceTimersByTime(REFRESH_MIN_GAP_MS);
    window.dispatchEvent(new Event("focus"));

    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("refreshes right away when the connection comes back", () => {
    const { refresh } = setup();

    window.dispatchEvent(new Event("online"));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does nothing while it is not enabled", () => {
    const { refresh } = setup(false);

    vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
    window.dispatchEvent(new Event("online"));
    window.dispatchEvent(new Event("focus"));

    expect(refresh).not.toHaveBeenCalled();
  });

  it("stops listening after it unmounts", () => {
    const { refresh, unmount } = setup();

    unmount();
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
    window.dispatchEvent(new Event("online"));

    expect(refresh).not.toHaveBeenCalled();
  });
});
