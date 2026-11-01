import { describe, expect, it, vi } from "vitest";
import {
  clearSessionHint,
  hasSessionHint,
  SESSION_HINT_KEY,
  setSessionHint,
} from "./sessionHint";

describe("session hint", () => {
  it("is absent by default", () => {
    expect(hasSessionHint()).toBe(false);
  });

  it("can be set and cleared", () => {
    expect(setSessionHint()).toBe(true);
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBe("1");
    expect(hasSessionHint()).toBe(true);

    expect(clearSessionHint()).toBe(true);
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBeNull();
    expect(hasSessionHint()).toBe(false);
  });

  it("ignores values other than 1", () => {
    localStorage.setItem(SESSION_HINT_KEY, "true");

    expect(hasSessionHint()).toBe(false);
  });

  it("stores nothing secret", () => {
    setSessionHint();

    expect(Object.keys(localStorage)).toEqual([SESSION_HINT_KEY]);
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBe("1");
  });

  it("treats unavailable storage as no hint without throwing", () => {
    const failure = () => {
      throw new DOMException("Storage is disabled", "SecurityError");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(failure);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(failure);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(failure);

    expect(hasSessionHint()).toBe(false);
    expect(setSessionHint()).toBe(false);
    expect(clearSessionHint()).toBe(false);
  });
});
