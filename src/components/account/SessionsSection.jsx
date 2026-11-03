import { useCallback, useEffect, useState } from "react";
import { Monitor } from "lucide-react";
import describeAuthError from "../../auth/authErrors";
import useAuth from "../../auth/useAuth";
import Icon from "../Icon";
import { useToast } from "../toast/useToast";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import AccountSection from "./AccountSection";

function formatDate(value, language) {
  return new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function SessionsSection({ t, language, refreshKey }) {
  const { api } = useAuth();
  const toast = useToast();
  const [state, setState] = useState({ kind: "loading" });
  const [busyId, setBusyId] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    api.listSessions().then(
      (sessions) => {
        if (!cancelled) {
          setState({ kind: "ready", sessions });
        }
      },
      () => {
        if (!cancelled) {
          setState({ kind: "error" });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [api, attempt, refreshKey]);

  const reload = useCallback(() => {
    setState({ kind: "loading" });
    setAttempt((current) => current + 1);
  }, []);

  async function revoke(session) {
    setBusyId(session.id);

    try {
      await api.revokeSession(session.id);
      setState((current) => ({
        ...current,
        sessions: current.sessions.filter((item) => item.id !== session.id),
      }));
      toast.success(t.accountSessionRevoked);
    } catch (error) {
      toast.error(describeAuthError(error, t).alert.message);
    } finally {
      setBusyId(null);
    }
  }

  async function revokeOthers() {
    setBusyId("others");

    try {
      await api.revokeOtherSessions();
      setState((current) => ({
        ...current,
        sessions: current.sessions.filter((item) => item.current),
      }));
      toast.success(t.accountOthersRevoked);
    } catch (error) {
      toast.error(describeAuthError(error, t).alert.message);
    } finally {
      setBusyId(null);
    }
  }

  let content;

  if (state.kind === "loading") {
    content = (
      <p className="account-muted" role="status" aria-busy="true">
        {t.accountSessionsLoading}
      </p>
    );
  } else if (state.kind === "error") {
    content = (
      <div className="account-form">
        <Alert tone="danger">{t.accountSessionsLoadError}</Alert>
        <div className="account-actions">
          <Button variant="secondary" onClick={reload}>
            {t.accountRetry}
          </Button>
        </div>
      </div>
    );
  } else {
    const others = state.sessions.filter((session) => !session.current);

    content = (
      <>
        <ul className="account-session-list">
          {state.sessions.map((session) => {
            const name = session.deviceName ?? t.accountUnknownDevice;

            return (
              <li key={session.id} className="account-session">
                <Icon
                  icon={Monitor}
                  size="lg"
                  className="account-session-icon"
                />
                <div className="account-session-text">
                  <span className="account-session-name">
                    {name}
                    {session.current ? (
                      <span className="account-badge" data-state="current">
                        {t.accountCurrentDevice}
                      </span>
                    ) : null}
                  </span>
                  <span className="account-muted">
                    {t.accountLastUsed(
                      formatDate(session.lastUsedAt, language),
                    )}
                  </span>
                </div>
                {session.current ? null : (
                  <Button
                    variant="secondary"
                    loading={busyId === session.id}
                    disabled={busyId !== null}
                    aria-label={t.accountSignOutSessionLabel(name)}
                    onClick={() => revoke(session)}
                  >
                    {t.accountSignOutSession}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        {others.length > 0 ? (
          <div className="account-actions">
            <Button
              variant="secondary"
              loading={busyId === "others"}
              disabled={busyId !== null}
              onClick={revokeOthers}
            >
              {t.accountSignOutOthers}
            </Button>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <AccountSection
      title={t.accountSessionsTitle}
      description={t.accountSessionsDescription}
    >
      {content}
    </AccountSection>
  );
}

export default SessionsSection;
