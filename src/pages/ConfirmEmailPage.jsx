import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { CircleCheck, Loader, TriangleAlert } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import AuthStatus from "../components/auth/AuthStatus";
import Button from "../components/ui/Button";
import describeAuthError from "../auth/authErrors";
import { AUTH_STATUS } from "../auth/authStatus";
import useAuth from "../auth/useAuth";

function readToken(hash) {
  return new URLSearchParams(hash.replace(/^#/, "")).get("token") ?? "";
}

function ConfirmEmailPage({ t }) {
  const { api, status, user, setUser } = useAuth();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [token] = useState(() => readToken(hash));
  const [state, setState] = useState(
    token === "" ? { kind: "invalid" } : { kind: "loading" },
  );
  const [changedUser, setChangedUser] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const startedAttemptRef = useRef(-1);

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

    api.confirmEmailChange(token).then(
      (updated) => {
        setChangedUser(updated);
        setState({ kind: "success" });
      },
      (error) => {
        if (error?.code === "EMAIL_TAKEN") {
          setState({ kind: "taken" });
          return;
        }

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
      changedUser &&
      status === AUTH_STATUS.signedIn &&
      user?.id === changedUser.id &&
      user.email !== changedUser.email
    ) {
      setUser(changedUser);
    }
  }, [changedUser, status, user, setUser]);

  const signedIn = status === AUTH_STATUS.signedIn;
  const nextLink = signedIn ? (
    <Link to="/account" className="btn btn-primary btn-lg">
      {t.accountGoToAccount}
    </Link>
  ) : (
    <Link to="/login" className="btn btn-primary btn-lg">
      {t.signIn}
    </Link>
  );

  function handleRetry() {
    setState({ kind: "loading" });
    setAttempt((current) => current + 1);
  }

  let content;

  if (state.kind === "loading") {
    content = (
      <AuthStatus icon={Loader} spinning title={t.confirmEmailLoadingTitle}>
        {t.verifyLoadingBody}
      </AuthStatus>
    );
  } else if (state.kind === "success") {
    content = (
      <AuthStatus
        icon={CircleCheck}
        tone="success"
        title={t.confirmEmailSuccessTitle}
        actions={nextLink}
      >
        {t.confirmEmailSuccessBody(changedUser.email)}
      </AuthStatus>
    );
  } else if (state.kind === "taken") {
    content = (
      <AuthStatus
        icon={TriangleAlert}
        tone="warning"
        title={t.confirmEmailTakenTitle}
        actions={nextLink}
      >
        {t.confirmEmailTakenBody}
      </AuthStatus>
    );
  } else if (state.kind === "failed") {
    content = (
      <AuthStatus
        icon={TriangleAlert}
        tone="warning"
        title={t.confirmEmailFailedTitle}
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
        actions={nextLink}
      >
        {t.authLinkInvalidBody}
      </AuthStatus>
    );
  }

  return <AuthLayout t={t}>{content}</AuthLayout>;
}

export default ConfirmEmailPage;
