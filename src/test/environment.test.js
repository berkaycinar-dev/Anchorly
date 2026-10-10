import { describe, it, expect } from "vitest";

describe("test environment", () => {
  it("pins the time zone to Europe/Istanbul (UTC+3)", () => {
    expect(new Date().getTimezoneOffset()).toBe(-180);
  });

  it("provides localStorage inside jsdom", () => {
    localStorage.setItem("probe", "1");
    expect(localStorage.getItem("probe")).toBe("1");
  });

  it("clears localStorage after every test", () => {
    expect(localStorage.getItem("probe")).toBeNull();
  });
});