import { describe, expect, it } from "vitest";
import { ApiError, NETWORK_ERROR, TIMEOUT } from "../data/api/ApiError";
import { strings } from "../strings";
import describeAuthError from "./authErrors";

const t = strings.en;

function apiError(overrides) {
  return new ApiError({ status: 400, message: "x", ...overrides });
}

describe("describeAuthError", () => {
  it("maps invalid credentials to a general alert", () => {
    const result = describeAuthError(
      apiError({ status: 401, code: "INVALID_CREDENTIALS" }),
      t,
    );

    expect(result.alert).toEqual({
      tone: "danger",
      message: t.authInvalidCredentials,
    });
    expect(result.fields).toEqual({});
  });

  it("maps a taken email to an alert that offers signing in", () => {
    const result = describeAuthError(
      apiError({ status: 409, code: "EMAIL_TAKEN" }),
      t,
    );

    expect(result.alert.message).toBe(t.authEmailTaken);
    expect(result.alert.offerSignIn).toBe(true);
  });

  it("flags an invalid or expired token without an alert", () => {
    const result = describeAuthError(
      apiError({ code: "INVALID_EMAIL_TOKEN" }),
      t,
    );

    expect(result.tokenInvalid).toBe(true);
    expect(result.alert).toBeNull();
  });

  it("maps validation details to field messages", () => {
    const result = describeAuthError(
      apiError({
        code: "VALIDATION_ERROR",
        details: [
          { path: "body.email", message: "bad" },
          { path: "body.password", message: "short" },
          { path: "body.email", message: "again" },
        ],
      }),
      t,
    );

    expect(result.fields).toEqual({
      email: t.authEmailInvalid,
      password: t.authPasswordTooShort,
    });
    expect(result.alert).toBeNull();
  });

  it("falls back to a general alert when no field can be identified", () => {
    const withUnknown = describeAuthError(
      apiError({
        code: "VALIDATION_ERROR",
        details: [{ path: "body.deviceName", message: "bad" }],
      }),
      t,
    );
    const withoutDetails = describeAuthError(
      apiError({ code: "VALIDATION_ERROR" }),
      t,
    );

    expect(withUnknown.alert.message).toBe(t.authGenericError);
    expect(withoutDetails.alert.message).toBe(t.authGenericError);
  });

  it("reports the retry delay for rate limiting", () => {
    const result = describeAuthError(
      apiError({
        status: 429,
        code: "TOO_MANY_REQUESTS",
        retryAfterSeconds: 760,
      }),
      t,
    );

    expect(result.retryAfterSeconds).toBe(760);
    expect(result.alert.message).toBe(t.authTooManyRequests(12, 40));
    expect(result.alert.rateLimited).toBe(true);
  });

  it("uses a default delay when the server gives none", () => {
    const result = describeAuthError(
      apiError({ status: 429, code: "TOO_MANY_REQUESTS" }),
      t,
    );

    expect(result.retryAfterSeconds).toBe(60);
  });

  it("maps network failures and timeouts", () => {
    for (const code of [NETWORK_ERROR, TIMEOUT]) {
      const result = describeAuthError(apiError({ status: 0, code }), t);
      expect(result.alert.message).toBe(t.authNetworkError);
    }
  });

  it("falls back to the generic message for anything else", () => {
    expect(
      describeAuthError(apiError({ status: 500, code: "BOOM" }), t).alert
        .message,
    ).toBe(t.authGenericError);
    expect(describeAuthError(new Error("x"), t).alert.message).toBe(
      t.authGenericError,
    );
  });
});
