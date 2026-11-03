import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { TriangleAlert } from "lucide-react";
import AuthAlert from "../components/auth/AuthAlert";
import AuthLayout from "../components/auth/AuthLayout";
import AuthStatus from "../components/auth/AuthStatus";
import Button from "../components/ui/Button";
import TextField from "../components/ui/TextField";
import describeAuthError from "../auth/authErrors";
import useAuth from "../auth/useAuth";
import useCountdown, { formatCountdown } from "../auth/useCountdown";
import {
  PASSWORD_MIN_LENGTH,
  validatePassword,
} from "../auth/validateAuthForm";

function readToken(hash) {
  return new URLSearchParams(hash.replace(/^#/, "")).get("token") ?? "";
}

function ResetPasswordPage({ t }) {
  const { api } = useAuth();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(() => readToken(hash));
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [remaining, startCountdown] = useCountdown();
  const passwordRef = useRef(null);

  useEffect(() => {
    if (hash !== "") {
      navigate({ hash: "" }, { replace: true });
    }
  }, [hash, navigate]);

  if (token === "") {
    return (
      <AuthLayout t={t}>
        <AuthStatus
          icon={TriangleAlert}
          tone="warning"
          title={t.authLinkInvalidTitle}
          actions={
            <>
              <Link to="/forgot-password" className="btn btn-primary btn-lg">
                {t.authRequestNewLink}
              </Link>
              <Link to="/login" className="auth-inline-link">
                {t.signIn}
              </Link>
            </>
          }
        >
          {t.authLinkInvalidBody}
        </AuthStatus>
      </AuthLayout>
    );
  }

  const visibleAlert =
    alert && !(alert.rateLimited && remaining === 0) ? alert : null;

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting || remaining > 0) {
      return;
    }

    const error = validatePassword(password, t, { checkLength: true });
    setFieldError(error);
    setAlert(null);

    if (error) {
      passwordRef.current.focus();
      return;
    }

    setSubmitting(true);

    try {
      await api.resetPassword({ token, password });
      navigate("/login", { replace: true, state: { passwordReset: true } });
    } catch (caught) {
      const described = describeAuthError(caught, t);

      if (described.tokenInvalid) {
        setToken("");
        return;
      }

      setFieldError(described.fields.password ?? "");
      setAlert(described.alert);

      if (described.retryAfterSeconds > 0) {
        startCountdown(described.retryAfterSeconds);
      }

      setSubmitting(false);
    }
  }

  return (
    <AuthLayout t={t} title={t.authResetTitle} subtitle={t.authResetSubtitle}>
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <AuthAlert t={t} alert={visibleAlert} />
        <TextField
          ref={passwordRef}
          label={t.authNewPasswordLabel}
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder={t.authPasswordPlaceholder}
          showPasswordLabel={t.authShowPassword}
          hidePasswordLabel={t.authHidePassword}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldError("");
          }}
          error={fieldError}
          hint={t.authPasswordHint}
          hintDone={password.length >= PASSWORD_MIN_LENGTH}
        />
        <Button
          type="submit"
          size="lg"
          block
          loading={submitting}
          disabled={remaining > 0}
        >
          {remaining > 0
            ? `${t.authResetSubmit} (${formatCountdown(remaining)})`
            : t.authResetSubmit}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default ResetPasswordPage;
