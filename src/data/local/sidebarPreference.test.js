import { describe, expect, it, vi } from "vitest";
import {
  getSidebarCollapsed,
  setSidebarCollapsed,
  SIDEBAR_COLLAPSED_KEY,
} from "./sidebarPreference";

describe("sidebar preference", () => {
  it("is expanded by default", () => {
    expect(getSidebarCollapsed()).toBe(false);
  });

  it("remembers the collapsed state", () => {
    expect(setSidebarCollapsed(true)).toBe(true);
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe("1");
    expect(getSidebarCollapsed()).toBe(true);

    expect(setSidebarCollapsed(false)).toBe(true);
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe("0");
    expect(getSidebarCollapsed()).toBe(false);
  });

  it("ignores values other than 1", () => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "true");

    expect(getSidebarCollapsed()).toBe(false);
  });

  it("falls back to expanded when storage is unavailable", () => {
    const failure = () => {
      throw new DOMException("Storage is disabled", "SecurityError");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(failure);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(failure);

    expect(getSidebarCollapsed()).toBe(false);
    expect(setSidebarCollapsed(true)).toBe(false);
  });
});
