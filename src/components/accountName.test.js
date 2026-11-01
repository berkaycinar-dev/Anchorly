import { describe, expect, it } from "vitest";
import { getDisplayName, getInitials } from "./accountName";

describe("account name helpers", () => {
  it("prefers the display name", () => {
    expect(
      getDisplayName({ displayName: "  Berkay Çınar ", email: "b@x.dev" }),
    ).toBe("Berkay Çınar");
  });

  it("falls back to the part of the email before the @", () => {
    expect(getDisplayName({ displayName: null, email: "berkay@x.dev" })).toBe(
      "berkay",
    );
    expect(getDisplayName({ displayName: "   ", email: "dev@x.dev" })).toBe(
      "dev",
    );
  });

  it("uses the first and last word for initials", () => {
    expect(getInitials("Berkay Can Çınar")).toBe("BÇ");
    expect(getInitials("berkay.cinar")).toBe("BC");
    expect(getInitials("ada_lovelace")).toBe("AL");
  });

  it("uses the first two letters of a single word", () => {
    expect(getInitials("berkay")).toBe("BE");
    expect(getInitials("x")).toBe("X");
  });
});
