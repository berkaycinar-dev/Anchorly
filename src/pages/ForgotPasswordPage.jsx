import { useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, Mail } from "lucide-react";
import AuthAlert from "../components/auth/AuthAlert";
import AuthLayout from "../components/auth/AuthLayout";
import AuthStatus from "../components/auth/AuthStatus";
import Icon from "../components/Icon";
import Button from "../components/ui/Button";
import TextField from "../components/ui/TextField";
import describeAuthError from "../auth/authErrors";
import useAuth from "../auth/useAuth";
import useCountdown from "../auth/useCountdown";
import { validateEmail } from "../auth/validateAuthForm";

const RESEND_DELAY_SECONDS = 60;

function ForgotPasswordPage({ t }) {
  const { api } = useAuth();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState(null);
  const [remaining, startCountdown] = useCountdown();
  const emailRef = useRef(null);

  const backLink = (
    <Link to="/login" className="auth-back-link">
      <Icon icon={ChevronLeft} size="sm" />
      {t.authBackToSignIn}
    </Link>
  );

  async function send(address) {
    setSubmitting(true);
    setAlert(null);

    try {
      await api.forgotPassword(address);
      setSentTo(address);
      startCountdown(RESEND_DELAY_SECONDS);
    } catch (error) {
      const described = describeAuthError(error, t);
      setFieldError(described.fields.email ?? "");
      setAlert(described.alert);

      if (described.retryAfterSeconds > 0) {
        startCountdown(described.retryAfterSeconds);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const error = validateEmail(email, t);
    setFieldError(error);

    if (error) {
      emailRef.current.focus();
      return;
    }

    send(email.trim());
  }

  if (sentTo !== null) {
    return (
      <AuthLayout t={t} footer={backLink}>
        <AuthAlert t={t} alert={alert} />
        <AuthStatus
          icon={Mail}
          title={t.authSentTitle}
          actions={
            <Button
              variant="secondary"
              loading={submitting}
              disabled={remaining > 0}
              onClick={() => send(sentTo)}
            >
              {remaining > 0 ? t.authResendIn(remaining) : t.authResend}
            </Button>
          }
        >
          {t.authSentBody(sentTo)}
        </AuthStatus>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      t={t}
      title={t.authForgotTitle}
      subtitle={t.authForgotSubtitle}
      footer={backLink}
    >
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <AuthAlert t={t} alert={alert} />
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
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldError("");
          }}
          error={fieldError}
        />
        <Button
          type="submit"
          size="lg"
          block
          loading={submitting}
          disabled={remaining > 0}
        >
          {t.authForgotSubmit}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
