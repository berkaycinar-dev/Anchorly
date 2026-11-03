import { useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import AuthAlert from "../components/auth/AuthAlert";
import AuthLayout from "../components/auth/AuthLayout";
import Button from "../components/ui/Button";
import TextField from "../components/ui/TextField";
import describeAuthError from "../auth/authErrors";
import { AUTH_STATUS } from "../auth/authStatus";
import getSafeNextPath, { withNextPath } from "../auth/safeNextPath";
import useAuth from "../auth/useAuth";
import useCountdown, { formatCountdown } from "../auth/useCountdown";
import { validateEmail, validatePassword } from "../auth/validateAuthForm";

function LoginPage({ t }) {
  const { status, login } = useAuth();
  const [searchParams] = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [remaining, startCountdown] = useCountdown();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  if (status === AUTH_STATUS.signedIn) {
    return <Navigate to={nextPath} replace />;
  }

  if (status === AUTH_STATUS.loading) {
    return (
      <AuthLayout t={t}>
        <p className="auth-loading" role="status" aria-busy="true">
          {t.accountLoading}
        </p>
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

    const errors = {};
    const emailError = validateEmail(email, t);
    const passwordError = validatePassword(password, t);

    if (emailError) {
      errors.email = emailError;
    }

    if (passwordError) {
      errors.password = passwordError;
    }

    setFieldErrors(errors);
    setAlert(null);

    if (errors.email) {
      emailRef.current.focus();
      return;
    }

    if (errors.password) {
      passwordRef.current.focus();
      return;
    }

    setSubmitting(true);

    try {
      await login({ email: email.trim(), password });
    } catch (error) {
      const described = describeAuthError(error, t);
      setFieldErrors(described.fields);
      setAlert(described.alert);

      if (described.retryAfterSeconds > 0) {
        startCountdown(described.retryAfterSeconds);
      }

      setSubmitting(false);
    }
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);
    setFieldErrors((current) => ({ ...current, email: undefined }));
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);
    setFieldErrors((current) => ({ ...current, password: undefined }));
  }

  return (
    <AuthLayout
      t={t}
      title={t.signIn}
      subtitle={t.authLoginSubtitle}
      footer={
        <>
          {t.authNoAccount}{" "}
          <Link to={withNextPath("/register", nextPath)}>{t.signUp}</Link>
        </>
      }
    >
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <AuthAlert t={t} alert={visibleAlert} />
        <TextField
          ref={emailRef}
          label={t.authEmailLabel}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t.authEmailPlaceholder}
          value={email}
          onChange={handleEmailChange}
          error={fieldErrors.email}
        />
        <TextField
          ref={passwordRef}
          label={t.authPasswordLabel}
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder={t.authPasswordPlaceholder}
          showPasswordLabel={t.authShowPassword}
          hidePasswordLabel={t.authHidePassword}
          value={password}
          onChange={handlePasswordChange}
          error={fieldErrors.password}
        />
        <Button
          type="submit"
          size="lg"
          block
          loading={submitting}
          disabled={remaining > 0}
        >
          {remaining > 0
            ? `${t.signIn} (${formatCountdown(remaining)})`
            : t.signIn}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
