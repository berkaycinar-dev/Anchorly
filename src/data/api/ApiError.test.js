import { describe, expect, it } from "vitest";
import {
  ApiError,
  NETWORK_ERROR,
  TIMEOUT,
  UNKNOWN_ERROR,
  isUnreachable,
} from "./ApiError";

function apiError(status, code) {
  return new ApiError({ status, code, message: "failed" });
}

describe("isUnreachable", () => {
  it.each([NETWORK_ERROR, TIMEOUT])("is true for %s", (code) => {
    expect(isUnreachable(apiError(0, code))).toBe(true);
  });

  it.each([502, 503, 504])(
    "is true for a %s answer from a gateway or proxy",
    (status) => {
      expect(isUnreachable(apiError(status, "BAD_GATEWAY"))).toBe(true);
    },
  );

  it.each([500, 502])(
    "is true for a %s answer without an API error body",
    (status) => {
      expect(isUnreachable(apiError(status, UNKNOWN_ERROR))).toBe(true);
    },
  );

  it("is false for an error the API itself sent", () => {
    expect(isUnreachable(apiError(500, "INTERNAL_ERROR"))).toBe(false);
    expect(isUnreachable(apiError(400, "VALIDATION_ERROR"))).toBe(false);
    expect(isUnreachable(apiError(404, UNKNOWN_ERROR))).toBe(false);
    expect(isUnreachable(apiError(401, "UNAUTHORIZED"))).toBe(false);
  });

  it("is false for anything that is not an ApiError", () => {
    expect(isUnreachable(new Error("boom"))).toBe(false);
    expect(isUnreachable(null)).toBe(false);
  });
});
