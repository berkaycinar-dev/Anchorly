import { useId, useRef, useState } from "react";
import { CircleAlert } from "lucide-react";
import { Link, Navigate, useSearchParams } from "react-router";
import AuthAlert from "../components/auth/AuthAlert";
import AuthLayout from "../components/auth/AuthLayout";
import Icon from "../components/Icon";
import Button from "../components/ui/Button";
import TextField from "../components/ui/TextField";
import describeAuthError from "../auth/authErrors";
import { AUTH_STATUS } from "../auth/authStatus";
import getSafeNextPath, { withNextPath } from "../auth/safeNextPath";
import useAuth from "../auth/useAuth";
import getDeviceName from "../auth/deviceName";
import useCountdown, { formatCountdown } from "../auth/useCountdown";
import {
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validatePassword,
} from "../auth/validateAuthForm";

function NewTabLink({ t, to, children }) {
  return (
    <Link
      to={to}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${children} ${t.legalOpensInNewTab}`}
    >
      {children}
    </Link>
  );
}

function RegisterPage({ t, language }) {
  const { status, register } = useAuth();
  const [searchParams] = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [remaining, startCountdown] = useCountdown();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const termsRef = useRef(null);
  const termsId = useId();

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
    const passwordError = validatePassword(password, t, { checkLength: true });

    if (emailError) {
      errors.email = emailError;
    }

    if (passwordError) {
      errors.password = passwordError;
    }

    if (!acceptedTerms) {
      errors.terms = t.authAcceptTermsRequired;
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

    if (errors.terms) {
      termsRef.current.focus();
      return;
    }

    const input = {
      email: email.trim(),
      password,
      language,
      acceptTerms: true,
    };
    const displayName = name.trim();

    if (displayName !== "") {
      input.displayName = displayName;
    }

    const deviceName = getDeviceName();

    if (deviceName) {
      input.deviceName = deviceName;
    }

    setSubmitting(true);

    try {
      await register(input);
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

  function handleTermsChange(event) {
    setAcceptedTerms(event.target.checked);
    setFieldErrors((current) => ({ ...current, terms: undefined }));
  }

  return (
    <AuthLayout
      t={t}
      title={t.authRegisterTitle}
      subtitle={t.authRegisterSubtitle}
      footer={
        <>
          {t.authHaveAccount}{" "}
          <Link to={withNextPath("/login", nextPath)}>{t.signIn}</Link>
        </>
      }
    >
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <AuthAlert
          t={t}
          alert={visibleAlert}
          signInPath={withNextPath("/login", nextPath)}
        />
        <TextField
          label={t.authNameLabel}
          optionalLabel={t.authOptionalLabel}
          type="text"
          name="name"
          autoComplete="name"
          maxLength={100}
          placeholder={t.authNamePlaceholder}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
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
          autoComplete="new-password"
          placeholder={t.authPasswordPlaceholder}
          showPasswordLabel={t.authShowPassword}
          hidePasswordLabel={t.authHidePassword}
          value={password}
          onChange={handlePasswordChange}
          error={fieldErrors.password}
          hint={t.authPasswordHint}
          hintDone={password.length >= PASSWORD_MIN_LENGTH}
        />
        <div className="auth-consent">
          <div className="auth-consent-row">
            <input
              ref={termsRef}
              id={termsId}
              type="checkbox"
              name="acceptTerms"
              className="themed-checkbox"
              checked={acceptedTerms}
              onChange={handleTermsChange}
              aria-invalid={fieldErrors.terms ? true : undefined}
              aria-describedby={
                fieldErrors.terms ? `${termsId}-error` : undefined
              }
            />
            <label htmlFor={termsId} className="auth-consent-label">
              {t.authAcceptTermsBefore}
              <NewTabLink t={t} to="/terms">
                {t.authAcceptTermsTermsLink}
              </NewTabLink>
              {t.authAcceptTermsMiddle}
              <NewTabLink t={t} to="/privacy">
                {t.authAcceptTermsPrivacyLink}
              </NewTabLink>
              {t.authAcceptTermsAfter}
            </label>
          </div>
          {fieldErrors.terms ? (
            <p
              id={`${termsId}-error`}
              className="text-field-message text-field-error"
            >
              <Icon icon={CircleAlert} size="sm" />
              {fieldErrors.terms}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          size="lg"
          block
          loading={submitting}
          disabled={remaining > 0}
        >
          {remaining > 0
            ? `${t.authRegisterTitle} (${formatCountdown(remaining)})`
            : t.authRegisterTitle}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
