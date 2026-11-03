import { describe, expect, it } from "vitest";
import { strings } from "../strings";
import { validateEmail, validatePassword } from "./validateAuthForm";

const t = strings.en;

describe("validateEmail", () => {
  it("requires a value", () => {
    expect(validateEmail("", t)).toBe(t.authEmailRequired);
    expect(validateEmail("   ", t)).toBe(t.authEmailRequired);
  });

  it("rejects malformed addresses", () => {
    expect(validateEmail("berkay@", t)).toBe(t.authEmailInvalid);
    expect(validateEmail("berkay", t)).toBe(t.authEmailInvalid);
    expect(validateEmail("a b@c.de", t)).toBe(t.authEmailInvalid);
    expect(validateEmail(`${"a".repeat(250)}@b.co`, t)).toBe(
      t.authEmailInvalid,
    );
  });

  it("accepts a normal address, ignoring surrounding spaces", () => {
    expect(validateEmail(" berkay@example.com ", t)).toBe("");
  });
});

describe("validatePassword", () => {
  it("requires a value", () => {
    expect(validatePassword("", t)).toBe(t.authPasswordRequired);
  });

  it("only enforces the minimum length when asked to", () => {
    expect(validatePassword("1234", t)).toBe("");
    expect(validatePassword("1234", t, { checkLength: true })).toBe(
      t.authPasswordTooShort,
    );
    expect(validatePassword("12345678", t, { checkLength: true })).toBe("");
  });

  it("rejects passwords above the maximum length", () => {
    expect(validatePassword("a".repeat(128), t)).toBe("");
    expect(validatePassword("a".repeat(129), t)).toBe(t.authPasswordTooLong);
  });
});
