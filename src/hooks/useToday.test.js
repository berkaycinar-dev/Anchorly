import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import useToday from "./useToday";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useToday", () => {
  it("returns the local today on the first render", () => {
    vi.setSystemTime(new Date(2026, 9, 10, 14, 30));

    const { result } = renderHook(() => useToday());

    expect(result.current).toBe("2026-10-10");
  });

  it("moves to the new day by itself after midnight", () => {
    vi.setSystemTime(new Date(2026, 9, 10, 23, 59, 50));

    const { result } = renderHook(() => useToday());
    expect(result.current).toBe("2026-10-10");

    act(() => {
      vi.advanceTimersByTime(11_000);
    });

    expect(result.current).toBe("2026-10-11");
  });

  it("schedules the timer again for the next midnight", () => {
    vi.setSystemTime(new Date(2026, 9, 10, 23, 59, 50));

    const { result } = renderHook(() => useToday());

    act(() => {
      vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 11_000);
    });

    expect(result.current).toBe("2026-10-12");
  });

  it("checks the day when the tab becomes visible again", () => {
    vi.setSystemTime(new Date(2026, 9, 10, 22, 0));

    const { result } = renderHook(() => useToday());

    vi.setSystemTime(new Date(2026, 9, 11, 8, 0));

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(result.current).toBe("2026-10-11");
  });

  it("checks the day when the window gains focus", () => {
    vi.setSystemTime(new Date(2026, 9, 10, 22, 0));

    const { result } = renderHook(() => useToday());

    vi.setSystemTime(new Date(2026, 9, 11, 8, 0));

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(result.current).toBe("2026-10-11");
  });

  it("cleans up the timer and listeners on unmount", () => {
    vi.setSystemTime(new Date(2026, 9, 10, 23, 59, 50));

    const { unmount } = renderHook(() => useToday());

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});