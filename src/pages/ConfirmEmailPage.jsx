import { useEffect } from "react";
import { Link } from "react-router";
import { CircleCheck, Loader, TriangleAlert } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import AuthStatus from "../components/auth/AuthStatus";
import Button from "../components/ui/Button";
import { AUTH_STATUS } from "../auth/authStatus";
import useAuth from "../auth/useAuth";
import useTokenRequest from "../auth/useTokenRequest";

function classifyError(error) {
  return error?.code === "EMAIL_TAKEN" ? "taken" : null;
}

function ConfirmEmailPage({ t }) {
  const { api, status, user, setUser } = useAuth();
  const {
    state,
    result: changedUser,
    retry,
  } = useTokenRequest({
    request: (token) => api.confirmEmailChange(token),
    classifyError,
    t,
  });

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
  const nextLink = (
    <Link
      to={signedIn ? "/account" : "/login"}
      className="btn btn-primary btn-lg"
    >
      {signedIn ? t.accountGoToAccount : t.signIn}
    </Link>
  );

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
        actions={nextLink}
      >
        {t.authLinkInvalidBody}
      </AuthStatus>
    );
  }

  return <AuthLayout t={t}>{content}</AuthLayout>;
}

export default ConfirmEmailPage;
