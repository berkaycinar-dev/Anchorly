import { describe, expect, it } from "vitest";
import getSafeNextPath, { withNextPath } from "./safeNextPath";

describe("getSafeNextPath", () => {
  it("accepts internal paths with query and hash", () => {
    expect(getSafeNextPath("/account")).toBe("/account");
    expect(getSafeNextPath("/projects/abc?tab=1#top")).toBe(
      "/projects/abc?tab=1#top",
    );
  });

  it("falls back for missing or non-string values", () => {
    expect(getSafeNextPath(null)).toBe("/");
    expect(getSafeNextPath(undefined)).toBe("/");
    expect(getSafeNextPath(42)).toBe("/");
    expect(getSafeNextPath("")).toBe("/");
  });

  it("rejects external and protocol-relative targets", () => {
    expect(getSafeNextPath("https://evil.example")).toBe("/");
    expect(getSafeNextPath("//evil.example")).toBe("/");
    expect(getSafeNextPath("/\\evil.example")).toBe("/");
    expect(getSafeNextPath("javascript:alert(1)")).toBe("/");
  });

  it("rejects the auth pages themselves", () => {
    expect(getSafeNextPath("/login")).toBe("/");
    expect(getSafeNextPath("/register?next=/today")).toBe("/");
  });

  it("honours a custom fallback", () => {
    expect(getSafeNextPath("//x", "/today")).toBe("/today");
  });
});

describe("withNextPath", () => {
  it("returns the bare path when there is nothing to preserve", () => {
    expect(withNextPath("/register", "/")).toBe("/register");
    expect(withNextPath("/register", null)).toBe("/register");
  });

  it("encodes the preserved destination", () => {
    expect(withNextPath("/register", "/projects/a?x=1")).toBe(
      "/register?next=%2Fprojects%2Fa%3Fx%3D1",
    );
  });
});
