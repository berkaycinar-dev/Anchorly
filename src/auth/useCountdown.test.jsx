import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useCountdown, { formatCountdown } from "./useCountdown";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useCountdown", () => {
  it("starts idle", () => {
    const { result } = renderHook(() => useCountdown());

    expect(result.current[0]).toBe(0);
  });

  it("counts down to zero and stops", () => {
    const { result } = renderHook(() => useCountdown());

    act(() => {
      result.current[1](3);
    });
    expect(result.current[0]).toBe(3);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current[0]).toBe(2);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current[0]).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("restarts with a new duration", () => {
    const { result } = renderHook(() => useCountdown());

    act(() => {
      result.current[1](10);
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    act(() => {
      result.current[1](30);
    });

    expect(result.current[0]).toBe(30);
  });

  it("clears its timer on unmount", () => {
    const { result, unmount } = renderHook(() => useCountdown());

    act(() => {
      result.current[1](5);
    });
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("formatCountdown", () => {
  it("formats minutes and seconds with padding", () => {
    expect(formatCountdown(760)).toBe("12:40");
    expect(formatCountdown(9)).toBe("00:09");
    expect(formatCountdown(3600)).toBe("60:00");
  });
});
