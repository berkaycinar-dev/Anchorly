import { act, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../data/api/ApiError";
import {
  hasSessionHint,
  SESSION_HINT_KEY,
  setSessionHint,
} from "../data/local/sessionHint";
import AuthProvider, {
  STARTUP_REFRESH_ATTEMPTS,
  STARTUP_REFRESH_TIMEOUT_MS,
  STARTUP_RETRY_DELAY_MS,
} from "./AuthProvider";
import { SIGNED_IN_MESSAGE, SIGNED_OUT_MESSAGE } from "./authChannel";
import { AUTH_STATUS } from "./authStatus";
import useAuth from "./useAuth";

const user = {
  id: "user-1",
  email: "dev@anchorly.local",
  displayName: "Dev",
  emailVerifiedAt: "2026-11-01T00:00:00.000Z",
};

function session(sessionUser = user) {
  return {
    user: sessionUser,
    accessToken: "token-1",
    accessTokenExpiresIn: 900,
    refreshTokenExpiresAt: "2026-12-01T00:00:00.000Z",
  };
}

function unauthorized(code = "INVALID_REFRESH_TOKEN") {
  return new ApiError({ status: 401, code, message: "Unauthorized" });
}

function networkError() {
  return new ApiError({ status: 0, code: "NETWORK_ERROR", message: "Down" });
}

function createFakeApi(overrides = {}) {
  return {
    clearSession: vi.fn(),
    login: vi.fn(async () => session()),
    register: vi.fn(async () => session()),
    logout: vi.fn(async () => {}),
    refreshSession: vi.fn(async () => session()),
    ...overrides,
  };
}

function createChannelHub() {
  const channels = new Set();

  function create() {
    const listeners = new Set();
    const channel = {
      posted: [],
      closed: false,
      postMessage(data) {
        channel.posted.push(data);
        for (const other of channels) {
          if (other !== channel) {
            other.deliver(data);
          }
        }
      },
      addEventListener(type, listener) {
        listeners.add(listener);
      },
      removeEventListener(type, listener) {
        listeners.delete(listener);
      },
      close() {
        channel.closed = true;
        channels.delete(channel);
      },
      deliver(data) {
        for (const listener of listeners) {
          listener({ data });
        }
      },
    };

    channels.add(channel);
    return channel;
  }

  return {
    create: vi.fn(create),
    channels,
    sendFromAnotherTab(data) {
      for (const channel of channels) {
        channel.deliver(data);
      }
    },
  };
}

function Probe({ latestRef }) {
  const auth = useAuth();

  useEffect(() => {
    latestRef.current = auth;
  });

  return (
    <div>
      <p data-testid="status">{auth.status}</p>
      <p data-testid="email">{auth.user?.email ?? ""}</p>
      <p data-testid="startup-error">{auth.startupError?.code ?? ""}</p>
    </div>
  );
}

function renderAuth({
  api = createFakeApi(),
  enabled = true,
  hub = createChannelHub(),
} = {}) {
  const latest = { current: null };
  const apiOptions = {};
  const createApi = vi.fn((options) => {
    Object.assign(apiOptions, options);
    return api;
  });

  const utils = render(
    <AuthProvider
      enabled={enabled}
      createApi={createApi}
      createChannel={hub.create}
    >
      <Probe latestRef={latest} />
    </AuthProvider>,
  );

  return {
    ...utils,
    api,
    hub,
    createApi,
    auth: () => latest.current,
    expireSession: () =>
      act(() => {
        apiOptions.onSessionExpired(unauthorized());
      }),
  };
}

function status() {
  return screen.getByTestId("status").textContent;
}

function serverError(statusCode = 503) {
  return new ApiError({
    status: statusCode,
    code: "UNKNOWN_ERROR",
    message: "Unavailable",
  });
}

async function advance(milliseconds) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}

afterEach(() => {
  vi.useRealTimers();
});

function postedTypes(hub) {
  return [...hub.channels].flatMap((channel) =>
    channel.posted.map((message) => message.type),
  );
}

describe("AuthProvider when disabled", () => {
  it("makes no requests and opens no channel", () => {
    setSessionHint();
    const { createApi, hub, auth } = renderAuth({ enabled: false });

    expect(status()).toBe(AUTH_STATUS.disabled);
    expect(auth().enabled).toBe(false);
    expect(auth().api).toBeNull();
    expect(createApi).not.toHaveBeenCalled();
    expect(hub.create).not.toHaveBeenCalled();
  });

  it("rejects sign in attempts", async () => {
    const { auth } = renderAuth({ enabled: false });

    await expect(auth().login({})).rejects.toThrow(
      "Authentication is disabled",
    );
    await expect(auth().register({})).rejects.toThrow(
      "Authentication is disabled",
    );
    await expect(auth().logout()).rejects.toThrow("Authentication is disabled");
  });
});

describe("AuthProvider on start", () => {
  it("is signed out without asking the server when there is no session hint", () => {
    const { api, auth } = renderAuth();

    expect(status()).toBe(AUTH_STATUS.signedOut);
    expect(auth().enabled).toBe(true);
    expect(api.refreshSession).not.toHaveBeenCalled();
  });

  it("restores the session when there is a session hint", async () => {
    setSessionHint();
    const { api } = renderAuth();

    expect(status()).toBe(AUTH_STATUS.loading);
    await waitFor(() => {
      expect(status()).toBe(AUTH_STATUS.signedIn);
    });
    expect(screen.getByTestId("email")).toHaveTextContent(user.email);
    expect(api.refreshSession).toHaveBeenCalledTimes(1);
    expect(hasSessionHint()).toBe(true);
  });

  it("forgets the hint when the server rejects the session", async () => {
    setSessionHint();
    renderAuth({
      api: createFakeApi({
        refreshSession: vi.fn(async () => {
          throw unauthorized();
        }),
      }),
    });

    await waitFor(() => {
      expect(status()).toBe(AUTH_STATUS.signedOut);
    });
    expect(hasSessionHint()).toBe(false);
    expect(screen.getByTestId("startup-error")).toHaveTextContent("");
  });

  it("asks for the session with the long startup timeout", async () => {
    setSessionHint();
    const { api } = renderAuth();

    await waitFor(() => {
      expect(status()).toBe(AUTH_STATUS.signedIn);
    });
    expect(api.refreshSession).toHaveBeenCalledWith({
      timeoutMs: STARTUP_REFRESH_TIMEOUT_MS,
    });
  });

  it("does not retry when the server rejects the session", async () => {
    vi.useFakeTimers();
    setSessionHint();
    const { api } = renderAuth({
      api: createFakeApi({
        refreshSession: vi.fn(async () => {
          throw unauthorized();
        }),
      }),
    });

    await advance(STARTUP_RETRY_DELAY_MS * STARTUP_REFRESH_ATTEMPTS);

    expect(api.refreshSession).toHaveBeenCalledTimes(1);
    expect(status()).toBe(AUTH_STATUS.signedOut);
  });

  it("keeps loading and tries again when the server cannot be reached at first", async () => {
    vi.useFakeTimers();
    setSessionHint();
    const refreshSession = vi
      .fn()
      .mockRejectedValueOnce(networkError())
      .mockResolvedValueOnce(session());
    renderAuth({ api: createFakeApi({ refreshSession }) });

    await advance(STARTUP_RETRY_DELAY_MS - 1);

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(status()).toBe(AUTH_STATUS.loading);

    await advance(1);

    expect(refreshSession).toHaveBeenCalledTimes(2);
    expect(status()).toBe(AUTH_STATUS.signedIn);
    expect(hasSessionHint()).toBe(true);
  });

  it("tries again when the server answers with an error while it wakes up", async () => {
    vi.useFakeTimers();
    setSessionHint();
    const refreshSession = vi
      .fn()
      .mockRejectedValueOnce(serverError(504))
      .mockResolvedValueOnce(session());
    renderAuth({ api: createFakeApi({ refreshSession }) });

    await advance(STARTUP_RETRY_DELAY_MS);

    expect(refreshSession).toHaveBeenCalledTimes(2);
    expect(status()).toBe(AUTH_STATUS.signedIn);
  });

  it("does not retry other client errors", async () => {
    vi.useFakeTimers();
    setSessionHint();
    const { api } = renderAuth({
      api: createFakeApi({
        refreshSession: vi.fn(async () => {
          throw serverError(429);
        }),
      }),
    });

    await advance(STARTUP_RETRY_DELAY_MS * STARTUP_REFRESH_ATTEMPTS);

    expect(api.refreshSession).toHaveBeenCalledTimes(1);
    expect(status()).toBe(AUTH_STATUS.signedOut);
  });

  it("keeps the hint and reports the error when the server stays unreachable", async () => {
    vi.useFakeTimers();
    setSessionHint();
    const { api } = renderAuth({
      api: createFakeApi({
        refreshSession: vi.fn(async () => {
          throw networkError();
        }),
      }),
    });

    await advance(STARTUP_RETRY_DELAY_MS * STARTUP_REFRESH_ATTEMPTS);

    expect(api.refreshSession).toHaveBeenCalledTimes(STARTUP_REFRESH_ATTEMPTS);
    expect(status()).toBe(AUTH_STATUS.signedOut);
    expect(hasSessionHint()).toBe(true);
    expect(screen.getByTestId("startup-error")).toHaveTextContent(
      "NETWORK_ERROR",
    );
  });

  it("forgets the hint when a retry finds the session rejected", async () => {
    vi.useFakeTimers();
    setSessionHint();
    const refreshSession = vi
      .fn()
      .mockRejectedValueOnce(networkError())
      .mockRejectedValueOnce(unauthorized());
    renderAuth({ api: createFakeApi({ refreshSession }) });

    await advance(STARTUP_RETRY_DELAY_MS);

    expect(status()).toBe(AUTH_STATUS.signedOut);
    expect(hasSessionHint()).toBe(false);
  });

  it("stops retrying when it is unmounted", async () => {
    vi.useFakeTimers();
    setSessionHint();
    const refreshSession = vi.fn().mockRejectedValue(networkError());
    const { unmount } = renderAuth({ api: createFakeApi({ refreshSession }) });

    await advance(0);
    unmount();
    await advance(STARTUP_RETRY_DELAY_MS * STARTUP_REFRESH_ATTEMPTS);

    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it("does not write the hint back when it was removed during the restore", async () => {
    setSessionHint();
    let finish;
    const api = createFakeApi({
      refreshSession: vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      ),
    });
    renderAuth({ api });

    localStorage.removeItem(SESSION_HINT_KEY);
    await act(async () => {
      finish(session());
    });

    expect(status()).toBe(AUTH_STATUS.signedIn);
    expect(hasSessionHint()).toBe(false);
  });
});

describe("AuthProvider sign in and out", () => {
  it("signs in, stores the hint and tells the other tabs", async () => {
    const { api, auth, hub } = renderAuth();
    const input = { email: user.email, password: "devpassword" };

    let returned;
    await act(async () => {
      returned = await auth().login(input);
    });

    expect(api.login).toHaveBeenCalledWith(input);
    expect(returned).toEqual(user);
    expect(status()).toBe(AUTH_STATUS.signedIn);
    expect(hasSessionHint()).toBe(true);
    expect(postedTypes(hub)).toEqual([SIGNED_IN_MESSAGE]);
  });

  it("registers and signs in", async () => {
    const newUser = { ...user, email: "new@anchorly.local" };
    const api = createFakeApi({
      register: vi.fn(async () => session(newUser)),
    });
    const { auth, hub } = renderAuth({ api });

    await act(async () => {
      await auth().register({ email: newUser.email, password: "password1" });
    });

    expect(status()).toBe(AUTH_STATUS.signedIn);
    expect(screen.getByTestId("email")).toHaveTextContent(newUser.email);
    expect(hasSessionHint()).toBe(true);
    expect(postedTypes(hub)).toEqual([SIGNED_IN_MESSAGE]);
  });

  it("stays signed out when signing in fails", async () => {
    const api = createFakeApi({
      login: vi.fn(async () => {
        throw unauthorized("INVALID_CREDENTIALS");
      }),
    });
    const { auth, hub } = renderAuth({ api });

    await act(async () => {
      await expect(
        auth().login({ email: user.email, password: "wrong" }),
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    });

    expect(status()).toBe(AUTH_STATUS.signedOut);
    expect(hasSessionHint()).toBe(false);
    expect(postedTypes(hub)).toEqual([]);
  });

  it("signs out, forgets the hint and tells the other tabs", async () => {
    setSessionHint();
    const { api, auth, hub } = renderAuth();
    await waitFor(() => {
      expect(status()).toBe(AUTH_STATUS.signedIn);
    });

    let result;
    await act(async () => {
      result = await auth().logout();
    });

    expect(api.logout).toHaveBeenCalledTimes(1);
    expect(api.clearSession).toHaveBeenCalled();
    expect(result).toEqual({ serverSignedOut: true, error: null });
    expect(status()).toBe(AUTH_STATUS.signedOut);
    expect(hasSessionHint()).toBe(false);
    expect(postedTypes(hub)).toEqual([SIGNED_OUT_MESSAGE]);
  });

  it("signs out on this device even when the server cannot be reached", async () => {
    setSessionHint();
    const failure = networkError();
    const api = createFakeApi({
      logout: vi.fn(async () => {
        throw failure;
      }),
    });
    const { auth, hub } = renderAuth({ api });
    await waitFor(() => {
      expect(status()).toBe(AUTH_STATUS.signedIn);
    });

    let result;
    await act(async () => {
      result = await auth().logout();
    });

    expect(result).toEqual({ serverSignedOut: false, error: failure });
    expect(status()).toBe(AUTH_STATUS.signedOut);
    expect(api.clearSession).toHaveBeenCalled();
    expect(hasSessionHint()).toBe(false);
    expect(postedTypes(hub)).toEqual([SIGNED_OUT_MESSAGE]);
  });

  it("ends the session on request", async () => {
    setSessionHint();
    const { api, auth, hub } = renderAuth();
    await waitFor(() => {
      expect(status()).toBe(AUTH_STATUS.signedIn);
    });

    act(() => {
      auth().endSession();
    });

    expect(api.logout).not.toHaveBeenCalled();
    expect(api.clearSession).toHaveBeenCalled();
    expect(status()).toBe(AUTH_STATUS.signedOut);
    expect(hasSessionHint()).toBe(false);
    expect(postedTypes(hub)).toEqual([SIGNED_OUT_MESSAGE]);
  });

  it("signs out when the client reports an expired session", async () => {
    setSessionHint();
    const { expireSession, hub } = renderAuth();
    await waitFor(() => {
      expect(status()).toBe(AUTH_STATUS.signedIn);
    });

    expireSession();

    expect(status()).toBe(AUTH_STATUS.signedOut);
    expect(hasSessionHint()).toBe(false);
    expect(postedTypes(hub)).toEqual([SIGNED_OUT_MESSAGE]);
  });

  it("updates the signed in user", async () => {
    setSessionHint();
    const { auth } = renderAuth();
    await waitFor(() => {
      expect(status()).toBe(AUTH_STATUS.signedIn);
    });

    act(() => {
      auth().setUser({ ...user, email: "renamed@anchorly.local" });
    });

    expect(screen.getByTestId("email")).toHaveTextContent(
      "renamed@anchorly.local",
    );
  });

  it("does not set a user while signed out", () => {
    const { auth } = renderAuth();

    act(() => {
      auth().setUser(user);
    });

    expect(status()).toBe(AUTH_STATUS.signedOut);
    expect(screen.getByTestId("email")).toHaveTextContent("");
  });
});

describe("AuthProvider across tabs", () => {
  it("signs out when another tab signs out", async () => {
    setSessionHint();
    const { api, hub } = renderAuth();
    await waitFor(() => {
      expect(status()).toBe(AUTH_STATUS.signedIn);
    });

    act(() => {
      hub.sendFromAnotherTab({ type: SIGNED_OUT_MESSAGE });
    });

    expect(status()).toBe(AUTH_STATUS.signedOut);
    expect(api.clearSession).toHaveBeenCalled();
    expect(postedTypes(hub)).toEqual([]);
  });

  it("restores the session when another tab signs in", async () => {
    const { api, hub } = renderAuth();

    act(() => {
      setSessionHint();
      hub.sendFromAnotherTab({ type: SIGNED_IN_MESSAGE });
    });

    await waitFor(() => {
      expect(status()).toBe(AUTH_STATUS.signedIn);
    });
    expect(api.refreshSession).toHaveBeenCalledTimes(1);
    expect(postedTypes(hub)).toEqual([]);
  });

  it("stays signed out when restoring after another tab fails", async () => {
    const api = createFakeApi({
      refreshSession: vi.fn(async () => {
        throw unauthorized();
      }),
    });
    const { hub } = renderAuth({ api });

    await act(async () => {
      hub.sendFromAnotherTab({ type: SIGNED_IN_MESSAGE });
    });

    expect(api.refreshSession).toHaveBeenCalledTimes(1);
    expect(status()).toBe(AUTH_STATUS.signedOut);
  });

  it("ignores unknown messages", () => {
    const { api, hub } = renderAuth();

    act(() => {
      hub.sendFromAnotherTab({ type: "somethingElse" });
      hub.sendFromAnotherTab(null);
    });

    expect(status()).toBe(AUTH_STATUS.signedOut);
    expect(api.refreshSession).not.toHaveBeenCalled();
    expect(api.clearSession).not.toHaveBeenCalled();
  });

  it("keeps working when channels are not supported", async () => {
    const hub = { create: vi.fn(() => null), channels: new Set() };
    const { auth } = renderAuth({ hub });

    await act(async () => {
      await auth().login({ email: user.email, password: "devpassword" });
    });

    expect(status()).toBe(AUTH_STATUS.signedIn);
  });

  it("closes the channel when unmounted", () => {
    const { hub, unmount } = renderAuth();
    const [channel] = hub.channels;

    unmount();

    expect(channel.closed).toBe(true);
  });
});

describe("useAuth", () => {
  it("throws outside an AuthProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Probe latestRef={{ current: null }} />)).toThrow(
      "useAuth must be used within an AuthProvider",
    );
  });
});
