import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAuthEnabled } from "../config";
import { ApiError } from "../data/api/ApiError";
import createAuthApi from "../data/api/authApi";
import createApiClient from "../data/api/createApiClient";
import {
  clearSessionHint,
  hasSessionHint,
  setSessionHint,
} from "../data/local/sessionHint";
import { AuthContext } from "./AuthContext";
import {
  createAuthChannel,
  SIGNED_IN_MESSAGE,
  SIGNED_OUT_MESSAGE,
} from "./authChannel";
import { AUTH_STATUS } from "./authStatus";

const SESSION_EXPIRED_EVENT = "sessionExpired";

export const STARTUP_REFRESH_TIMEOUT_MS = 90000;
export const STARTUP_REFRESH_ATTEMPTS = 3;
export const STARTUP_RETRY_DELAY_MS = 2000;

function createDefaultAuthApi({ onSessionExpired }) {
  return createAuthApi(createApiClient({ onSessionExpired }));
}

function isUnauthorized(error) {
  return error instanceof ApiError && error.status === 401;
}

function isTransient(error) {
  return (
    error instanceof ApiError && (error.status === 0 || error.status >= 500)
  );
}

function signedOutState(startupError = null) {
  return { status: AUTH_STATUS.signedOut, user: null, startupError };
}

function rejectDisabled() {
  return Promise.reject(new Error("Authentication is disabled"));
}

function ignore() {}

export default function AuthProvider({
  children,
  enabled = isAuthEnabled(),
  createApi = createDefaultAuthApi,
  createChannel = createAuthChannel,
}) {
  const channelRef = useRef(null);
  const [shouldRestore] = useState(() => enabled && hasSessionHint());
  const [sessionEvents] = useState(() => new EventTarget());
  const [api] = useState(() =>
    enabled
      ? createApi({
          onSessionExpired: () => {
            sessionEvents.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
          },
        })
      : null,
  );
  const [state, setState] = useState(() => {
    if (!enabled) {
      return { status: AUTH_STATUS.disabled, user: null, startupError: null };
    }

    return shouldRestore
      ? { status: AUTH_STATUS.loading, user: null, startupError: null }
      : signedOutState();
  });

  const showSignedIn = useCallback((user) => {
    setState({ status: AUTH_STATUS.signedIn, user, startupError: null });
  }, []);

  const showSignedOut = useCallback((startupError) => {
    setState(signedOutState(startupError));
  }, []);

  const broadcast = useCallback((type) => {
    try {
      channelRef.current?.postMessage({ type });
    } catch {
      return;
    }
  }, []);

  const endSession = useCallback(() => {
    api?.clearSession();
    clearSessionHint();
    showSignedOut();
    broadcast(SIGNED_OUT_MESSAGE);
  }, [api, broadcast, showSignedOut]);

  useEffect(() => {
    function handleSessionExpired() {
      clearSessionHint();
      showSignedOut();
      broadcast(SIGNED_OUT_MESSAGE);
    }

    sessionEvents.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      sessionEvents.removeEventListener(
        SESSION_EXPIRED_EVENT,
        handleSessionExpired,
      );
    };
  }, [broadcast, sessionEvents, showSignedOut]);

  useEffect(() => {
    if (!shouldRestore) {
      return undefined;
    }

    let cancelled = false;
    let retryTimer = null;

    function attempt(number) {
      api.refreshSession({ timeoutMs: STARTUP_REFRESH_TIMEOUT_MS }).then(
        (session) => {
          if (!cancelled) {
            showSignedIn(session.user);
          }
        },
        (error) => {
          if (cancelled) {
            return;
          }

          if (isUnauthorized(error)) {
            clearSessionHint();
            showSignedOut();
            return;
          }

          if (isTransient(error) && number < STARTUP_REFRESH_ATTEMPTS) {
            retryTimer = setTimeout(
              () => attempt(number + 1),
              STARTUP_RETRY_DELAY_MS,
            );
            return;
          }

          showSignedOut(error);
        },
      );
    }

    attempt(1);

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [api, shouldRestore, showSignedIn, showSignedOut]);

  useEffect(() => {
    if (!api) {
      return undefined;
    }

    const channel = createChannel();

    if (!channel) {
      return undefined;
    }

    channelRef.current = channel;

    function handleMessage(event) {
      const type = event.data?.type;

      if (type === SIGNED_OUT_MESSAGE) {
        api.clearSession();
        showSignedOut();
        return;
      }

      if (type === SIGNED_IN_MESSAGE) {
        api.refreshSession().then((session) => {
          showSignedIn(session.user);
        }, ignore);
      }
    }

    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();

      if (channelRef.current === channel) {
        channelRef.current = null;
      }
    };
  }, [api, createChannel, showSignedIn, showSignedOut]);

  const completeSignIn = useCallback(
    (session) => {
      setSessionHint();
      showSignedIn(session.user);
      broadcast(SIGNED_IN_MESSAGE);
      return session.user;
    },
    [broadcast, showSignedIn],
  );

  const login = useCallback(
    async (input) => completeSignIn(await api.login(input)),
    [api, completeSignIn],
  );

  const register = useCallback(
    async (input) => completeSignIn(await api.register(input)),
    [api, completeSignIn],
  );

  const logout = useCallback(async () => {
    let error = null;

    try {
      await api.logout();
    } catch (caught) {
      error = caught;
    }

    endSession();
    return { serverSignedOut: error === null, error };
  }, [api, endSession]);

  const setUser = useCallback((user) => {
    setState((current) =>
      current.status === AUTH_STATUS.signedIn ? { ...current, user } : current,
    );
  }, []);

  const value = useMemo(() => {
    if (!enabled) {
      return {
        ...state,
        enabled: false,
        api: null,
        login: rejectDisabled,
        register: rejectDisabled,
        logout: rejectDisabled,
        setUser: ignore,
        endSession: ignore,
      };
    }

    return {
      ...state,
      enabled: true,
      api,
      login,
      register,
      logout,
      setUser,
      endSession,
    };
  }, [api, enabled, endSession, login, logout, register, setUser, state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
