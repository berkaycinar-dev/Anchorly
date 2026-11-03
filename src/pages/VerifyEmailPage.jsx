import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { CircleCheck, Loader, TriangleAlert } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import AuthStatus from "../components/auth/AuthStatus";
import Button from "../components/ui/Button";
import describeAuthError from "../auth/authErrors";
import { AUTH_STATUS } from "../auth/authStatus";
import useAuth from "../auth/useAuth";
import useResendVerification from "../auth/useResendVerification";

function readToken(hash) {
  return new URLSearchParams(hash.replace(/^#/, "")).get("token") ?? "";
}

function VerifyEmailPage({ t }) {
  const { api, status, user, setUser } = useAuth();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [token] = useState(() => readToken(hash));
  const [state, setState] = useState(
    token === "" ? { kind: "invalid" } : { kind: "loading" },
  );
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const startedAttemptRef = useRef(-1);
  const [linkSent, setLinkSent] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);
  const { resend, sending, remaining } = useResendVerification(t);

  useEffect(() => {
    if (hash !== "") {
      navigate({ hash: "" }, { replace: true });
    }
  }, [hash, navigate]);

  useEffect(() => {
    if (token === "" || startedAttemptRef.current === attempt) {
      return;
    }

    startedAttemptRef.current = attempt;

    api.verifyEmail(token).then(
      (verified) => {
        setVerifiedUser(verified);
        setState({ kind: "success" });
      },
      (error) => {
        const described = describeAuthError(error, t);

        if (described.tokenInvalid) {
          setState({ kind: "invalid" });
        } else {
          setState({ kind: "failed", message: described.alert.message });
        }
      },
    );
  }, [api, attempt, t, token]);

  useEffect(() => {
    if (
      verifiedUser &&
      status === AUTH_STATUS.signedIn &&
      user &&
      !user.emailVerifiedAt
    ) {
      setUser(verifiedUser);
    }
  }, [verifiedUser, status, user, setUser]);

  const signedIn = status === AUTH_STATUS.signedIn;

  async function handleRequestNewLink() {
    const result = await resend();

    if (result.status === "sent") {
      setLinkSent(true);
      setResendMessage(null);
    } else if (result.status === "already-verified") {
      setState({ kind: "success" });
    } else {
      setResendMessage(result.message);
    }
  }

  function handleRetry() {
    setState({ kind: "loading" });
    setAttempt((current) => current + 1);
  }

  let content;

  if (state.kind === "loading") {
    content = (
      <AuthStatus icon={Loader} spinning title={t.verifyLoadingTitle}>
        {t.verifyLoadingBody}
      </AuthStatus>
    );
  } else if (state.kind === "success") {
    content = (
      <AuthStatus
        icon={CircleCheck}
        tone="success"
        title={t.verifySuccessTitle}
        actions={
          <Link
            to={signedIn ? "/" : "/login"}
            className="btn btn-primary btn-lg"
          >
            {signedIn ? t.verifyGoToApp : t.signIn}
          </Link>
        }
      >
        {t.verifySuccessBody}
      </AuthStatus>
    );
  } else if (state.kind === "failed") {
    content = (
      <AuthStatus
        icon={TriangleAlert}
        tone="warning"
        title={t.verifyFailedTitle}
        actions={
          <Button size="lg" onClick={handleRetry}>
            {t.verifyRetry}
          </Button>
        }
      >
        {state.message}
      </AuthStatus>
    );
  } else {
    content = (
      <AuthStatus
        icon={TriangleAlert}
        tone="warning"
        title={t.authLinkInvalidTitle}
        actions={
          signedIn ? (
            <>
              <Button
                size="lg"
                loading={sending}
                disabled={linkSent || remaining > 0}
                onClick={handleRequestNewLink}
              >
                {linkSent ? t.verifyLinkSent : t.authRequestNewLink}
              </Button>
              <Link to="/" className="auth-inline-link">
                {t.verifyGoToApp}
              </Link>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-lg">
              {t.signIn}
            </Link>
          )
        }
      >
        {resendMessage ?? t.authLinkInvalidBody}
      </AuthStatus>
    );
  }

  return <AuthLayout t={t}>{content}</AuthLayout>;
}

export default VerifyEmailPage;
