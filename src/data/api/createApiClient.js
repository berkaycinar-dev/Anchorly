import {
  ApiError,
  INVALID_RESPONSE,
  NETWORK_ERROR,
  TIMEOUT,
  UNKNOWN_ERROR,
} from "./ApiError";

export const DEFAULT_TIMEOUT_MS = 15000;
export const REFRESH_PATH = "/auth/refresh";

function createRequestSignal(timeoutMs, externalSignal) {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  function abortFromOutside() {
    controller.abort(externalSignal.reason);
  }

  if (externalSignal?.aborted) {
    abortFromOutside();
  } else {
    externalSignal?.addEventListener("abort", abortFromOutside, {
      once: true,
    });
  }

  return {
    signal: controller.signal,
    didTimeOut: () => timedOut,
    dispose() {
      clearTimeout(timer);
      externalSignal?.removeEventListener("abort", abortFromOutside);
    },
  };
}

function parseRetryAfter(value) {
  if (value === null || value.trim() === "") {
    return undefined;
  }

  const seconds = Number(value);

  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

function parseJson(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function toApiError(response, body) {
  const error = body?.error;

  return new ApiError({
    status: response.status,
    code: typeof error?.code === "string" ? error.code : UNKNOWN_ERROR,
    message:
      typeof error?.message === "string"
        ? error.message
        : `Request failed with status ${response.status}`,
    details: error?.details,
    retryAfterSeconds: parseRetryAfter(response.headers.get("Retry-After")),
  });
}

export default function createApiClient({
  baseUrl = "/api",
  fetchImpl = (...args) => globalThis.fetch(...args),
  onSessionExpired = () => {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  let accessToken = null;
  let refreshPromise = null;

  async function send(method, path, options) {
    const {
      body,
      token,
      signal,
      timeoutMs: requestTimeoutMs = timeoutMs,
    } = options;
    const headers = { Accept: "application/json" };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const requestSignal = createRequestSignal(requestTimeoutMs, signal);
    let response;
    let text;

    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: "same-origin",
        signal: requestSignal.signal,
      });
      text = await response.text();
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }

      if (requestSignal.didTimeOut()) {
        throw new ApiError({
          status: 0,
          code: TIMEOUT,
          message: "The server did not respond in time",
        });
      }

      throw new ApiError({
        status: 0,
        code: NETWORK_ERROR,
        message: "The server could not be reached",
      });
    } finally {
      requestSignal.dispose();
    }

    const parsed = text === "" ? { ok: true, value: null } : parseJson(text);

    if (!response.ok) {
      throw toApiError(response, parsed.ok ? parsed.value : null);
    }

    if (!parsed.ok) {
      throw new ApiError({
        status: response.status,
        code: INVALID_RESPONSE,
        message: "The server sent a response that is not valid JSON",
      });
    }

    return parsed.value;
  }

  async function performRefresh() {
    const hadSession = accessToken !== null;

    try {
      const session = await send("POST", REFRESH_PATH, {});
      accessToken = session.accessToken;
      return session;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        accessToken = null;

        if (hadSession) {
          onSessionExpired(error);
        }
      }

      throw error;
    }
  }

  function refreshSession() {
    if (!refreshPromise) {
      refreshPromise = performRefresh().finally(() => {
        refreshPromise = null;
      });
    }

    return refreshPromise;
  }

  async function request(method, path, options = {}) {
    const { auth = true, ...rest } = options;

    if (!auth) {
      return send(method, path, rest);
    }

    const usedToken = accessToken;

    try {
      return await send(method, path, { ...rest, token: usedToken });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error;
      }

      if (accessToken === usedToken) {
        await refreshSession();
      }

      return send(method, path, { ...rest, token: accessToken });
    }
  }

  return {
    request,
    refreshSession,
    getAccessToken: () => accessToken,
    setAccessToken(token) {
      accessToken = token ?? null;
    },
  };
}
