import { formatCountdown } from "../../auth/useCountdown";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import AuthLayout from "./AuthLayout";

export function AuthLoading({ t }) {
  return (
    <AuthLayout t={t}>
      <p className="auth-loading" role="status" aria-busy="true">
        {t.accountLoading}
      </p>
    </AuthLayout>
  );
}

export function EmailField({ t, ...props }) {
  return (
    <TextField
      label={t.authEmailLabel}
      type="email"
      name="email"
      autoComplete="email"
      inputMode="email"
      autoCapitalize="none"
      spellCheck={false}
      placeholder={t.authEmailPlaceholder}
      {...props}
    />
  );
}

// While rate limited the label shows the time left, e.g. "Sign in (0:42)".
export function AuthSubmitButton({ submitting, remaining, children }) {
  return (
    <Button
      type="submit"
      size="lg"
      block
      loading={submitting}
      disabled={remaining > 0}
    >
      {remaining > 0 ? `${children} (${formatCountdown(remaining)})` : children}
    </Button>
  );
}
