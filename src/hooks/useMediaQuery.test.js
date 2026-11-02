import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, it, expect } from "vitest";
import useMediaQuery, { WIDE_SCREEN_MEDIA_QUERY } from "./useMediaQuery";

function mockMatchMedia(initialMatches) {
  const listeners = new Set();
  const mediaQueryList = {
    matches: initialMatches,
    media: WIDE_SCREEN_MEDIA_QUERY,
    addEventListener: (type, listener) => listeners.add(listener),
    removeEventListener: (type, listener) => listeners.delete(listener),
  };

  window.matchMedia = () => mediaQueryList;

  return {
    listeners,
    change(matches) {
      mediaQueryList.matches = matches;
      listeners.forEach((listener) => listener({ matches }));
    },
  };
}

afterEach(() => {
  delete window.matchMedia;
});

describe("useMediaQuery", () => {
  it("returns false when the browser has no matchMedia", () => {
    const { result } = renderHook(() => useMediaQuery(WIDE_SCREEN_MEDIA_QUERY));

    expect(result.current).toBe(false);
  });

  it("returns the current match of the query", () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => useMediaQuery(WIDE_SCREEN_MEDIA_QUERY));

    expect(result.current).toBe(true);
  });

  it("follows changes of the query", () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery(WIDE_SCREEN_MEDIA_QUERY));

    act(() => {
      media.change(true);
    });

    expect(result.current).toBe(true);
  });

  it("stops listening when it unmounts", () => {
    const media = mockMatchMedia(false);
    const { unmount } = renderHook(() =>
      useMediaQuery(WIDE_SCREEN_MEDIA_QUERY),
    );

    expect(media.listeners.size).toBe(1);

    unmount();

    expect(media.listeners.size).toBe(0);
  });
});
