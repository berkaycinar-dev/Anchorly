import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CircleCheck, Loader, TriangleAlert } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import AuthStatus from "../components/auth/AuthStatus";
import Button from "../components/ui/Button";
import { AUTH_STATUS } from "../auth/authStatus";
import useAuth from "../auth/useAuth";
import useResendVerification from "../auth/useResendVerification";
import useTokenRequest from "../auth/useTokenRequest";

function VerifyEmailPage({ t }) {
  const { api, status, user, setUser } = useAuth();
  const {
    state,
    setState,
    result: verifiedUser,
    retry,
  } = useTokenRequest({ request: (token) => api.verifyEmail(token), t });
  const [linkSent, setLinkSent] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);
  const { resend, sending, remaining } = useResendVerification(t);

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
          <Button size="lg" onClick={retry}>
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
