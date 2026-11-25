import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { TriangleAlert } from "lucide-react";
import AuthAlert from "../components/auth/AuthAlert";
import { AuthSubmitButton } from "../components/auth/AuthFormParts";
import AuthLayout from "../components/auth/AuthLayout";
import AuthStatus from "../components/auth/AuthStatus";
import TextField from "../components/ui/TextField";
import describeAuthError from "../auth/authErrors";
import useAuth from "../auth/useAuth";
import useCountdown from "../auth/useCountdown";
import useHashToken from "../auth/useHashToken";
import {
  PASSWORD_MIN_LENGTH,
  validatePassword,
} from "../auth/validateAuthForm";

function ResetPasswordPage({ t }) {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useHashToken();
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [remaining, startCountdown] = useCountdown();
  const passwordRef = useRef(null);

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
        <AuthSubmitButton submitting={submitting} remaining={remaining}>
          {t.authResetSubmit}
        </AuthSubmitButton>
      </form>
    </AuthLayout>
  );
}

export default ResetPasswordPage;
