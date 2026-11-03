import { useState } from "react";
import { Mail, X } from "lucide-react";
import Icon from "../Icon";
import { useToast } from "../toast/useToast";
import { AUTH_STATUS } from "../../auth/authStatus";
import useAuth from "../../auth/useAuth";
import useResendVerification from "../../auth/useResendVerification";

const DISMISS_KEY_PREFIX = "anchorly.verifyBannerDismissed.";

function readDismissed(key) {
  try {
    return sessionStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeDismissed(key) {
  try {
    sessionStorage.setItem(key, "true");
  } catch {
    return;
  }
}

function BannerContent({ t, user, onDismiss }) {
  const toast = useToast();
  const { resend, sending, remaining } = useResendVerification(t);

  async function handleResend() {
    const result = await resend();

    if (result.status === "sent") {
      toast.success(t.verifyLinkSent);
    } else if (result.status === "already-verified") {
      toast.info(t.verifyAlreadyVerified);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <section className="verify-banner" aria-label={t.verifyBannerLabel}>
      <Icon icon={Mail} size="lg" className="verify-banner-icon" />
      <p className="verify-banner-text">
        <strong>{t.verifyBannerTitle}</strong>{" "}
        <span>{t.verifyBannerBody(user.email)}</span>
      </p>
      <button
        type="button"
        className="verify-banner-action"
        disabled={sending || remaining > 0}
        onClick={handleResend}
      >
        {remaining > 0 ? t.authResendIn(remaining) : t.authResend}
      </button>
      <button
        type="button"
        className="verify-banner-close"
        aria-label={t.closeButton}
        onClick={onDismiss}
      >
        <Icon icon={X} size="md" />
      </button>
    </section>
  );
}

function VerificationBanner({ t }) {
  const { status, user } = useAuth();
  const [dismissedKeys, setDismissedKeys] = useState(() => new Set());

  if (status !== AUTH_STATUS.signedIn || user.emailVerifiedAt) {
    return null;
  }

  const key = `${DISMISS_KEY_PREFIX}${user.id}`;

  if (dismissedKeys.has(key) || readDismissed(key)) {
    return null;
  }

  function dismiss() {
    writeDismissed(key);
    setDismissedKeys((current) => new Set(current).add(key));
  }

  return <BannerContent t={t} user={user} onDismiss={dismiss} />;
}

export default VerificationBanner;
