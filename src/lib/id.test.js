import { afterEach, describe, it, expect, vi } from "vitest";
import { createId, isUuid } from "./id";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isUuid", () => {
  it("accepts a lowercase uuid", () => {
    expect(isUuid("3f2504e0-4f89-41d3-9a0c-0305e82c3301")).toBe(true);
  });

  it("accepts an uppercase uuid", () => {
    expect(isUuid("3F2504E0-4F89-41D3-9A0C-0305E82C3301")).toBe(true);
  });

  it("rejects numbers, numeric strings and other values", () => {
    [1, "1", "1788807397799", "", null, undefined, {}, []].forEach((value) => {
      expect(isUuid(value)).toBe(false);
    });
  });

  it("rejects strings with the wrong length or separators", () => {
    expect(isUuid("3f2504e0-4f89-41d3-9a0c-0305e82c33")).toBe(false);
    expect(isUuid("3f2504e04f8941d39a0c0305e82c3301")).toBe(false);
    expect(isUuid("not-a-uuid")).toBe(false);
  });
});

describe("createId", () => {
  it("returns a valid uuid", () => {
    expect(isUuid(createId())).toBe(true);
  });

  it("returns a different id on every call", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createId()));

    expect(ids.size).toBe(1000);
  });

  it("uses crypto.randomUUID when it is available", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000000",
    );

    expect(createId()).toBe("00000000-0000-4000-8000-000000000000");
  });

  it("builds a version 4 uuid from random bytes when randomUUID is missing", () => {
    const originalCrypto = globalThis.crypto;
    vi.stubGlobal("crypto", {
      getRandomValues: (array) => originalCrypto.getRandomValues(array),
    });

    const id = createId();

    expect(isUuid(id)).toBe(true);
    expect(id[14]).toBe("4");
    expect("89ab").toContain(id[19]);
  });

  it("sets the version and variant bits on the random bytes", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: (array) => array.fill(255),
    });

    expect(createId()).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
  });
});
