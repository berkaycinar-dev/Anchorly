import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  INVALID_RESPONSE,
  NETWORK_ERROR,
  TIMEOUT,
  UNKNOWN_ERROR,
} from "./ApiError";
import createApiClient, {
  DEFAULT_TIMEOUT_MS,
  REFRESH_PATH,
} from "./createApiClient";

function jsonResponse(status, body, headers = {}) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function errorResponse(status, code, message = "Something failed", extra) {
  return jsonResponse(status, { error: { code, message, ...extra } });
}

function session(accessToken) {
  return {
    user: { id: "user-1", email: "dev@anchorly.local" },
    accessToken,
    accessTokenExpiresIn: 900,
    refreshTokenExpiresAt: "2026-12-01T00:00:00.000Z",
  };
}

function headersOf(call) {
  return call[1].headers;
}

function hangingFetch() {
  return vi.fn(
    (url, init) =>
      new Promise((resolve, reject) => {
        init.signal.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted", "AbortError"));
        });
      }),
  );
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("createApiClient request", () => {
  it("sends a JSON request under /api and returns the parsed body", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { ok: true }));
    const client = createApiClient({ fetchImpl });

    const result = await client.request("POST", "/auth/login", {
      auth: false,
      body: { email: "dev@anchorly.local", password: "devpassword" },
    });

    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("/api/auth/login");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("same-origin");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({
      email: "dev@anchorly.local",
      password: "devpassword",
    });
  });

  it("uses the configured base URL", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, {}));
    const client = createApiClient({ fetchImpl, baseUrl: "https://api.test" });

    await client.request("GET", "/me");

    expect(fetchImpl.mock.calls[0][0]).toBe("https://api.test/me");
  });

  it("sends no body or content type when there is no body", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, {}));
    const client = createApiClient({ fetchImpl });

    await client.request("GET", "/me");

    const [, init] = fetchImpl.mock.calls[0];
    expect(init.body).toBeUndefined();
    expect(init.headers["Content-Type"]).toBeUndefined();
  });

  it("returns null for a 204 response", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    const client = createApiClient({ fetchImpl });

    await expect(client.request("DELETE", "/me/sessions")).resolves.toBeNull();
  });

  it("sends the extra headers of a request", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, {}));
    const client = createApiClient({ fetchImpl });

    await client.request("PATCH", "/tasks/1", {
      body: {},
      headers: { "X-Client-Time": "2026-11-05T10:00:00.000Z" },
    });

    expect(fetchImpl.mock.calls[0][1].headers).toMatchObject({
      Accept: "application/json",
      "X-Client-Time": "2026-11-05T10:00:00.000Z",
    });
  });

  it("adds the bearer token only to authenticated requests", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, {}));
    const client = createApiClient({ fetchImpl });

    await client.request("GET", "/me");
    client.setAccessToken("token-1");
    await client.request("GET", "/me");
    await client.request("POST", "/auth/login", { auth: false, body: {} });

    expect(headersOf(fetchImpl.mock.calls[0]).Authorization).toBeUndefined();
    expect(headersOf(fetchImpl.mock.calls[1]).Authorization).toBe(
      "Bearer token-1",
    );
    expect(headersOf(fetchImpl.mock.calls[2]).Authorization).toBeUndefined();
  });

  it("never sends the mobile client header", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, {}));
    const client = createApiClient({ fetchImpl });
    client.setAccessToken("token-1");

    await client.request("GET", "/me");

    const names = Object.keys(headersOf(fetchImpl.mock.calls[0])).map((name) =>
      name.toLowerCase(),
    );
    expect(names).not.toContain("x-anchorly-client");
  });

  it("turns an API error body into an ApiError", async () => {
    const details = [{ path: "body.email", message: "Invalid email" }];
    const fetchImpl = vi.fn(async () =>
      errorResponse(400, "VALIDATION_ERROR", "Request is invalid", {
        details,
      }),
    );
    const client = createApiClient({ fetchImpl });

    const error = await client
      .request("POST", "/auth/register", { auth: false, body: {} })
      .catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("Request is invalid");
    expect(error.details).toEqual(details);
  });

  it("reads Retry-After seconds from a rate limited response", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(
        429,
        { error: { code: "TOO_MANY_REQUESTS", message: "Slow down" } },
        { "Retry-After": "540" },
      ),
    );
    const client = createApiClient({ fetchImpl });

    const error = await client
      .request("POST", "/auth/login", { auth: false, body: {} })
      .catch((caught) => caught);

    expect(error.code).toBe("TOO_MANY_REQUESTS");
    expect(error.retryAfterSeconds).toBe(540);
  });

  it("reports an error response without a JSON body as unknown", async () => {
    const fetchImpl = vi.fn(
      async () => new Response("Bad Gateway", { status: 502 }),
    );
    const client = createApiClient({ fetchImpl });

    const error = await client.request("GET", "/me").catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(error.code).toBe(UNKNOWN_ERROR);
    expect(error.retryAfterSeconds).toBeUndefined();
  });

  it("reports a successful response that is not JSON as invalid", async () => {
    const fetchImpl = vi.fn(
      async () => new Response("<html></html>", { status: 200 }),
    );
    const client = createApiClient({ fetchImpl });

    const error = await client.request("GET", "/me").catch((caught) => caught);

    expect(error.status).toBe(200);
    expect(error.code).toBe(INVALID_RESPONSE);
  });

  it("reports a failed connection as a network error", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const client = createApiClient({ fetchImpl });

    const error = await client.request("GET", "/me").catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.code).toBe(NETWORK_ERROR);
  });

  it("gives up after the default timeout", async () => {
    vi.useFakeTimers();
    const client = createApiClient({ fetchImpl: hangingFetch() });

    const pending = client.request("GET", "/me").catch((caught) => caught);
    await vi.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS - 1);
    let settled = false;
    pending.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    const error = await pending;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.code).toBe(TIMEOUT);
  });

  it("accepts a timeout for a single request", async () => {
    vi.useFakeTimers();
    const client = createApiClient({ fetchImpl: hangingFetch() });

    const pending = client
      .request("GET", "/me/export", { timeoutMs: 100 })
      .catch((caught) => caught);
    await vi.advanceTimersByTimeAsync(100);

    expect((await pending).code).toBe(TIMEOUT);
  });

  it("passes a caller abort through instead of turning it into an ApiError", async () => {
    const controller = new AbortController();
    const client = createApiClient({ fetchImpl: hangingFetch() });

    const pending = client
      .request("GET", "/me", { signal: controller.signal })
      .catch((caught) => caught);
    controller.abort();
    const error = await pending;

    expect(error).not.toBeInstanceOf(ApiError);
    expect(error.name).toBe("AbortError");
  });
});

describe("createApiClient session refresh", () => {
  it("refreshes once on 401 and retries the request with the new token", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(401, "UNAUTHORIZED"))
      .mockResolvedValueOnce(jsonResponse(200, session("token-2")))
      .mockResolvedValueOnce(jsonResponse(200, { user: { id: "user-1" } }));
    const client = createApiClient({ fetchImpl });
    client.setAccessToken("token-1");

    const result = await client.request("GET", "/me");

    expect(result).toEqual({ user: { id: "user-1" } });
    expect(fetchImpl).toHaveBeenCalledTimes(3);

    const [refreshUrl, refreshInit] = fetchImpl.mock.calls[1];
    expect(refreshUrl).toBe(`/api${REFRESH_PATH}`);
    expect(refreshInit.method).toBe("POST");
    expect(refreshInit.body).toBeUndefined();
    expect(refreshInit.headers.Authorization).toBeUndefined();

    expect(headersOf(fetchImpl.mock.calls[2]).Authorization).toBe(
      "Bearer token-2",
    );
    expect(client.getAccessToken()).toBe("token-2");
  });

  it("shares one refresh between requests that fail at the same time", async () => {
    const refreshGate = deferred();
    let refreshCalls = 0;
    const fetchImpl = vi.fn(async (url, init) => {
      if (url === `/api${REFRESH_PATH}`) {
        refreshCalls += 1;
        await refreshGate.promise;
        return jsonResponse(200, session("token-2"));
      }

      if (init.headers.Authorization === "Bearer token-2") {
        return jsonResponse(200, { url });
      }

      return errorResponse(401, "UNAUTHORIZED");
    });
    const client = createApiClient({ fetchImpl });
    client.setAccessToken("token-1");

    const pending = Promise.all([
      client.request("GET", "/me"),
      client.request("GET", "/me/sessions"),
      client.request("GET", "/me/settings"),
    ]);
    await vi.waitFor(() => {
      expect(fetchImpl).toHaveBeenCalledTimes(4);
    });
    refreshGate.resolve();

    await expect(pending).resolves.toEqual([
      { url: "/api/me" },
      { url: "/api/me/sessions" },
      { url: "/api/me/settings" },
    ]);
    expect(refreshCalls).toBe(1);
  });

  it("uses a token another request already refreshed instead of refreshing again", async () => {
    const firstAttempt = deferred();
    let refreshCalls = 0;
    const fetchImpl = vi.fn(async (url, init) => {
      if (url === `/api${REFRESH_PATH}`) {
        refreshCalls += 1;
        return jsonResponse(200, session("token-2"));
      }

      if (init.headers.Authorization === "Bearer token-2") {
        return jsonResponse(200, { url });
      }

      if (url === "/api/me/sessions") {
        await firstAttempt.promise;
      }

      return errorResponse(401, "UNAUTHORIZED");
    });
    const client = createApiClient({ fetchImpl });
    client.setAccessToken("token-1");

    const slow = client.request("GET", "/me/sessions");
    await client.request("GET", "/me");
    firstAttempt.resolve();

    await expect(slow).resolves.toEqual({ url: "/api/me/sessions" });
    expect(refreshCalls).toBe(1);
  });

  it("ends the session when the refresh is rejected", async () => {
    const onSessionExpired = vi.fn();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(401, "UNAUTHORIZED"))
      .mockResolvedValueOnce(errorResponse(401, "INVALID_REFRESH_TOKEN"));
    const client = createApiClient({ fetchImpl, onSessionExpired });
    client.setAccessToken("token-1");

    const error = await client.request("GET", "/me").catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("INVALID_REFRESH_TOKEN");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(client.getAccessToken()).toBeNull();
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(onSessionExpired.mock.calls[0][0].code).toBe(
      "INVALID_REFRESH_TOKEN",
    );
  });

  it("keeps the session when the refresh fails for another reason", async () => {
    const onSessionExpired = vi.fn();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(401, "UNAUTHORIZED"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const client = createApiClient({ fetchImpl, onSessionExpired });
    client.setAccessToken("token-1");

    const error = await client.request("GET", "/me").catch((caught) => caught);

    expect(error.code).toBe(NETWORK_ERROR);
    expect(client.getAccessToken()).toBe("token-1");
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("does not loop when the retried request is rejected again", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(401, "UNAUTHORIZED"))
      .mockResolvedValueOnce(jsonResponse(200, session("token-2")))
      .mockResolvedValueOnce(errorResponse(401, "UNAUTHORIZED"));
    const client = createApiClient({ fetchImpl });
    client.setAccessToken("token-1");

    const error = await client.request("GET", "/me").catch((caught) => caught);

    expect(error.code).toBe("UNAUTHORIZED");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("does not refresh for requests sent without authentication", async () => {
    const onSessionExpired = vi.fn();
    const fetchImpl = vi.fn(async () =>
      errorResponse(401, "INVALID_CREDENTIALS"),
    );
    const client = createApiClient({ fetchImpl, onSessionExpired });
    client.setAccessToken("token-1");

    const error = await client
      .request("POST", "/auth/login", { auth: false, body: {} })
      .catch((caught) => caught);

    expect(error.code).toBe("INVALID_CREDENTIALS");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("does not refresh for errors other than 401", async () => {
    const fetchImpl = vi.fn(async () =>
      errorResponse(403, "EMAIL_NOT_VERIFIED"),
    );
    const client = createApiClient({ fetchImpl });
    client.setAccessToken("token-1");

    const error = await client
      .request("GET", "/me/export")
      .catch((caught) => caught);

    expect(error.code).toBe("EMAIL_NOT_VERIFIED");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("stores the token from a direct refresh and returns the session", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, session("token-9")));
    const client = createApiClient({ fetchImpl });

    await expect(client.refreshSession()).resolves.toEqual(session("token-9"));
    expect(client.getAccessToken()).toBe("token-9");
  });

  it("lets a direct refresh wait longer than the default timeout", async () => {
    vi.useFakeTimers();
    const client = createApiClient({ fetchImpl: hangingFetch() });
    const longTimeoutMs = DEFAULT_TIMEOUT_MS * 4;

    const pending = client
      .refreshSession({ timeoutMs: longTimeoutMs })
      .catch((caught) => caught);
    await vi.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS + 1);
    let settled = false;
    pending.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(longTimeoutMs);

    expect((await pending).code).toBe(TIMEOUT);
  });

  it("uses the default timeout for a direct refresh without options", async () => {
    vi.useFakeTimers();
    const client = createApiClient({ fetchImpl: hangingFetch() });

    const pending = client.refreshSession().catch((caught) => caught);
    await vi.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS);

    expect((await pending).code).toBe(TIMEOUT);
  });

  it("does not report an expired session when there was none", async () => {
    const onSessionExpired = vi.fn();
    const fetchImpl = vi.fn(async () =>
      errorResponse(401, "INVALID_REFRESH_TOKEN"),
    );
    const client = createApiClient({ fetchImpl, onSessionExpired });

    await expect(client.refreshSession()).rejects.toMatchObject({
      code: "INVALID_REFRESH_TOKEN",
    });
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("clears the token when it is set to null", () => {
    const client = createApiClient({ fetchImpl: vi.fn() });

    client.setAccessToken("token-1");
    expect(client.getAccessToken()).toBe("token-1");

    client.setAccessToken(null);
    expect(client.getAccessToken()).toBeNull();
  });
});
