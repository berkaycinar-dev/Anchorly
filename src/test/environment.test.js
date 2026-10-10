import { describe, it, expect } from "vitest";

describe("test ortamı", () => {
  it("saat dilimi Europe/Istanbul (UTC+3) olarak sabitlenmiş", () => {
    expect(new Date().getTimezoneOffset()).toBe(-180);
  });

  it("jsdom içinde localStorage kullanılabilir", () => {
    localStorage.setItem("probe", "1");
    expect(localStorage.getItem("probe")).toBe("1");
  });

  it("her testten sonra localStorage temizlenir", () => {
    expect(localStorage.getItem("probe")).toBeNull();
  });
});