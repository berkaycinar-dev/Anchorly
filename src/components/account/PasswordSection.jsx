import { useRef, useState } from "react";
import describeAuthError from "../../auth/authErrors";
import useAuth from "../../auth/useAuth";
import useCountdown, { formatCountdown } from "../../auth/useCountdown";
import {
  PASSWORD_MIN_LENGTH,
  validatePassword,
} from "../../auth/validateAuthForm";
import { useToast } from "../toast/useToast";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import AccountSection from "./AccountSection";

function PasswordSection({ t, onChanged }) {
  const { api } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);
  const [remaining, startCountdown] = useCountdown();
  const currentRef = useRef(null);
  const nextRef = useRef(null);

  const visibleAlert =
    alert && !(alert.rateLimited && remaining === 0) ? alert : null;

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || remaining > 0) {
      return;
    }

    const found = {};
    const currentError = validatePassword(current, t);
    const nextError = validatePassword(next, t, { checkLength: true });

    if (currentError) {
      found.current = currentError;
    }

    if (nextError) {
      found.next = nextError;
    }

    setErrors(found);
    setAlert(null);

    if (found.current) {
      currentRef.current.focus();
      return;
    }

    if (found.next) {
      nextRef.current.focus();
      return;
    }

    setSaving(true);

    try {
      await api.changePassword({ currentPassword: current, newPassword: next });
      setCurrent("");
      setNext("");
      toast.success(t.accountPasswordChanged);
      onChanged();
    } catch (error) {
      if (error?.code === "INVALID_CURRENT_PASSWORD") {
        setErrors({ current: t.accountCurrentPasswordWrong });
        currentRef.current.focus();
      } else {
        const described = describeAuthError(error, t);
        setErrors(
          described.fields.password ? { next: described.fields.password } : {},
        );
        setAlert(described.alert);

        if (described.retryAfterSeconds > 0) {
          startCountdown(described.retryAfterSeconds);
        }
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <AccountSection
      title={t.accountPasswordTitle}
      description={t.accountPasswordNote}
    >
      <form className="account-form" noValidate onSubmit={handleSubmit}>
        {visibleAlert ? (
          <Alert tone={visibleAlert.tone}>{visibleAlert.message}</Alert>
        ) : null}
        <TextField
          ref={currentRef}
          label={t.accountCurrentPasswordLabel}
          type="password"
          name="currentPassword"
          autoComplete="current-password"
          showPasswordLabel={t.authShowPassword}
          hidePasswordLabel={t.authHidePassword}
          value={current}
          onChange={(event) => {
            setCurrent(event.target.value);
            setErrors((existing) => ({ ...existing, current: undefined }));
          }}
          error={errors.current}
        />
        <TextField
          ref={nextRef}
          label={t.authNewPasswordLabel}
          type="password"
          name="newPassword"
          autoComplete="new-password"
          showPasswordLabel={t.authShowPassword}
          hidePasswordLabel={t.authHidePassword}
          value={next}
          onChange={(event) => {
            setNext(event.target.value);
            setErrors((existing) => ({ ...existing, next: undefined }));
          }}
          error={errors.next}
          hint={t.authPasswordHint}
          hintDone={next.length >= PASSWORD_MIN_LENGTH}
        />
        <div className="account-actions">
          <Button type="submit" loading={saving} disabled={remaining > 0}>
            {remaining > 0
              ? `${t.accountChangePassword} (${formatCountdown(remaining)})`
              : t.accountChangePassword}
          </Button>
        </div>
      </form>
    </AccountSection>
  );
}

export default PasswordSection;
