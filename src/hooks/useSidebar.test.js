import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SIDEBAR_COLLAPSED_KEY } from "../data/local/sidebarPreference";
import useSidebar, { TABLET_MEDIA_QUERY } from "./useSidebar";

function installMatchMedia(initialMatches) {
  const listeners = new Set();
  const query = {
    matches: initialMatches,
    media: TABLET_MEDIA_QUERY,
    addEventListener: (type, listener) => listeners.add(listener),
    removeEventListener: (type, listener) => listeners.delete(listener),
  };

  window.matchMedia = (media) =>
    media === TABLET_MEDIA_QUERY
      ? query
      : {
          matches: false,
          media,
          addEventListener() {},
          removeEventListener() {},
        };

  return {
    change(matches) {
      query.matches = matches;
      listeners.forEach((listener) => listener({ matches }));
    },
    listenerCount: () => listeners.size,
  };
}

function pressKey(init, target = document.body) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });

  act(() => {
    target.dispatchEvent(event);
  });

  return event;
}

afterEach(() => {
  delete window.matchMedia;
  document.body.innerHTML = "";
});

describe("useSidebar on desktop", () => {
  it("starts expanded without a stored preference", () => {
    const { result } = renderHook(() => useSidebar());

    expect(result.current.isExpanded).toBe(true);
    expect(result.current.isOverlayOpen).toBe(false);
  });

  it("starts collapsed when the preference says so", () => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "1");

    const { result } = renderHook(() => useSidebar());

    expect(result.current.isExpanded).toBe(false);
  });

  it("toggles and remembers the choice", () => {
    const { result } = renderHook(() => useSidebar());

    act(() => result.current.toggle());

    expect(result.current.isExpanded).toBe(false);
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe("1");

    act(() => result.current.toggle());

    expect(result.current.isExpanded).toBe(true);
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe("0");
  });

  it("toggles with Ctrl+B and Meta+B", () => {
    const { result } = renderHook(() => useSidebar());

    const event = pressKey({ key: "b", ctrlKey: true });

    expect(event.defaultPrevented).toBe(true);
    expect(result.current.isExpanded).toBe(false);

    pressKey({ key: "B", metaKey: true });

    expect(result.current.isExpanded).toBe(true);
  });

  it("ignores B without a modifier and with extra modifiers", () => {
    const { result } = renderHook(() => useSidebar());

    pressKey({ key: "b" });
    pressKey({ key: "b", ctrlKey: true, shiftKey: true });
    pressKey({ key: "b", ctrlKey: true, altKey: true });

    expect(result.current.isExpanded).toBe(true);
  });

  it.each([["input"], ["textarea"], ["select"]])(
    "ignores the shortcut while typing in a %s",
    (tagName) => {
      const field = document.createElement(tagName);
      document.body.append(field);
      const { result } = renderHook(() => useSidebar());

      const event = pressKey({ key: "b", ctrlKey: true }, field);

      expect(event.defaultPrevented).toBe(false);
      expect(result.current.isExpanded).toBe(true);
    },
  );

  it("ignores the shortcut inside a dialog", () => {
    const dialog = document.createElement("dialog");
    const button = document.createElement("button");
    dialog.append(button);
    document.body.append(dialog);
    const { result } = renderHook(() => useSidebar());

    pressKey({ key: "b", ctrlKey: true }, button);

    expect(result.current.isExpanded).toBe(true);
  });

  it("removes its keyboard listener on unmount", () => {
    const { unmount } = renderHook(() => useSidebar());

    unmount();
    const event = pressKey({ key: "b", ctrlKey: true });

    expect(event.defaultPrevented).toBe(false);
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBeNull();
  });
});

describe("useSidebar on tablet", () => {
  it("starts with the overlay closed, even with a collapsed preference", () => {
    installMatchMedia(true);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "0");

    const { result } = renderHook(() => useSidebar());

    expect(result.current.isExpanded).toBe(false);
    expect(result.current.isOverlayOpen).toBe(false);
  });

  it("opens and closes the overlay without touching the preference", () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useSidebar());

    act(() => result.current.toggle());

    expect(result.current.isOverlayOpen).toBe(true);
    expect(result.current.isExpanded).toBe(true);

    act(() => result.current.toggle());

    expect(result.current.isOverlayOpen).toBe(false);

    act(() => result.current.toggle());
    act(() => result.current.closeOverlay());

    expect(result.current.isOverlayOpen).toBe(false);
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBeNull();
  });

  it("closes the overlay with Escape", () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useSidebar());

    act(() => result.current.toggle());
    pressKey({ key: "Escape" });

    expect(result.current.isOverlayOpen).toBe(false);
  });

  it("opens the overlay with Ctrl+B", () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useSidebar());

    pressKey({ key: "b", ctrlKey: true });

    expect(result.current.isOverlayOpen).toBe(true);
  });

  it("follows the screen size and closes the overlay when it changes", () => {
    const media = installMatchMedia(true);
    const { result } = renderHook(() => useSidebar());

    act(() => result.current.toggle());
    act(() => media.change(false));

    expect(result.current.isOverlayOpen).toBe(false);
    expect(result.current.isExpanded).toBe(true);

    act(() => result.current.toggle());

    expect(result.current.isExpanded).toBe(false);
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe("1");

    act(() => media.change(true));

    expect(result.current.isOverlayOpen).toBe(false);
  });

  it("stops listening to the screen size on unmount", () => {
    const media = installMatchMedia(true);
    const { unmount } = renderHook(() => useSidebar());

    expect(media.listenerCount()).toBe(1);

    unmount();

    expect(media.listenerCount()).toBe(0);
  });
});
