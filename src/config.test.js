import { describe, expect, it } from "vitest";
import { isAuthEnabled } from "./config";

describe("isAuthEnabled", () => {
  it("is enabled only when VITE_AUTH_ENABLED is exactly true", () => {
    expect(isAuthEnabled({ VITE_AUTH_ENABLED: "true" })).toBe(true);
    expect(isAuthEnabled({ VITE_AUTH_ENABLED: "false" })).toBe(false);
    expect(isAuthEnabled({ VITE_AUTH_ENABLED: "1" })).toBe(false);
    expect(isAuthEnabled({ VITE_AUTH_ENABLED: "TRUE" })).toBe(false);
    expect(isAuthEnabled({})).toBe(false);
  });

  it("is disabled in the test environment by default", () => {
    expect(isAuthEnabled()).toBe(false);
  });
});
