import { useRef, useState } from "react";
import describeAuthError from "../../auth/authErrors";
import useAuth from "../../auth/useAuth";
import useCountdown, { formatCountdown } from "../../auth/useCountdown";
import { validateEmail, validatePassword } from "../../auth/validateAuthForm";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import AccountSection from "./AccountSection";

const EMAIL_FIELD_ERRORS = {
  EMAIL_UNCHANGED: "accountEmailUnchanged",
  EMAIL_TAKEN: "accountEmailTaken",
};

function EmailSection({ t }) {
  const { api, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);
  const [remaining, startCountdown] = useCountdown();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const visibleAlert =
    alert && !(alert.rateLimited && remaining === 0) ? alert : null;

  function showError(error) {
    if (error?.code === "INVALID_CURRENT_PASSWORD") {
      setErrors({ password: t.accountCurrentPasswordWrong });
      passwordRef.current.focus();
      return;
    }

    if (EMAIL_FIELD_ERRORS[error?.code]) {
      setErrors({ email: t[EMAIL_FIELD_ERRORS[error.code]] });
      emailRef.current.focus();
      return;
    }

    if (error?.code === "EMAIL_NOT_SENT") {
      setAlert({ tone: "danger", message: t.accountEmailNotSent });
      return;
    }

    const described = describeAuthError(error, t);
    setErrors(described.fields.email ? { email: described.fields.email } : {});
    setAlert(described.fields.email ? null : described.alert);

    if (described.retryAfterSeconds > 0) {
      startCountdown(described.retryAfterSeconds);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || remaining > 0) {
      return;
    }

    const found = {};
    const emailError = validateEmail(email, t);
    const passwordError = validatePassword(password, t);

    if (emailError) {
      found.email = emailError;
    }

    if (passwordError) {
      found.password = passwordError;
    }

    setErrors(found);
    setAlert(null);

    if (found.email) {
      emailRef.current.focus();
      return;
    }

    if (found.password) {
      passwordRef.current.focus();
      return;
    }

    setSaving(true);

    try {
      const pendingEmail = await api.requestEmailChange({
        newEmail: email,
        password,
      });
      setEmail("");
      setPassword("");
      setAlert({
        tone: "success",
        message: t.accountEmailLinkSent(pendingEmail),
      });
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AccountSection
      title={t.accountEmailTitle}
      description={t.accountEmailNote(user.email)}
    >
      <form className="account-form" noValidate onSubmit={handleSubmit}>
        {visibleAlert ? (
          <Alert tone={visibleAlert.tone}>{visibleAlert.message}</Alert>
        ) : null}
        <TextField
          ref={emailRef}
          label={t.accountNewEmailLabel}
          type="email"
          name="newEmail"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((existing) => ({ ...existing, email: undefined }));
          }}
          error={errors.email}
        />
        <TextField
          ref={passwordRef}
          label={t.accountCurrentPasswordLabel}
          type="password"
          name="currentPassword"
          autoComplete="current-password"
          showPasswordLabel={t.authShowPassword}
          hidePasswordLabel={t.authHidePassword}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((existing) => ({ ...existing, password: undefined }));
          }}
          error={errors.password}
        />
        <div className="account-actions">
          <Button type="submit" loading={saving} disabled={remaining > 0}>
            {remaining > 0
              ? `${t.accountSendEmailLink} (${formatCountdown(remaining)})`
              : t.accountSendEmailLink}
          </Button>
        </div>
      </form>
    </AccountSection>
  );
}

export default EmailSection;
