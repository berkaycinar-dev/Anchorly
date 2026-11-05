import { describe, expect, it, vi } from "vitest";
import { ApiError, NETWORK_ERROR, TIMEOUT } from "./ApiError";
import {
  getDataErrorKind,
  getSnapshot,
  reportDataError,
  subscribe,
} from "./dataErrorStatus";

function apiError(status, code) {
  return new ApiError({ status, code, message: "failed" });
}

describe("getDataErrorKind", () => {
  it("treats unreachable servers and timeouts as network problems", () => {
    expect(getDataErrorKind(apiError(0, NETWORK_ERROR))).toBe("network");
    expect(getDataErrorKind(apiError(0, TIMEOUT))).toBe("network");
  });

  it("treats a proxy or gateway answer as a network problem", () => {
    expect(getDataErrorKind(apiError(504, "BAD_GATEWAY"))).toBe("network");
    expect(getDataErrorKind(apiError(500, "UNKNOWN_ERROR"))).toBe("network");
  });

  it("treats other server answers and unknown errors as other problems", () => {
    expect(getDataErrorKind(apiError(400, "VALIDATION_ERROR"))).toBe("other");
    expect(getDataErrorKind(apiError(500, "INTERNAL"))).toBe("other");
    expect(getDataErrorKind(new Error("boom"))).toBe("other");
  });

  it("ignores an expired session because the auth layer handles it", () => {
    expect(getDataErrorKind(apiError(401, "UNAUTHORIZED"))).toBeNull();
  });
});

describe("reportDataError", () => {
  it("publishes a new snapshot with the kind for each report", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    const before = getSnapshot().id;

    reportDataError(apiError(0, NETWORK_ERROR));
    reportDataError(apiError(0, NETWORK_ERROR));

    expect(getSnapshot()).toEqual({ id: before + 2, kind: "network" });
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("does not publish anything for an expired session", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    const before = getSnapshot();

    reportDataError(apiError(401, "UNAUTHORIZED"));

    expect(getSnapshot()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    subscribe(listener)();

    reportDataError(new Error("boom"));

    expect(listener).not.toHaveBeenCalled();
  });
});
