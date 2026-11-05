import { useState } from "react";
import { Link } from "react-router";
import { HardDrive, X } from "lucide-react";
import Icon from "../Icon";
import { AUTH_STATUS } from "../../auth/authStatus";
import useAuth from "../../auth/useAuth";

const DISMISS_KEY = "anchorly.guestBannerDismissed";

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    sessionStorage.setItem(DISMISS_KEY, "true");
  } catch {
    return;
  }
}

function GuestBanner({ t }) {
  const { status } = useAuth();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (status !== AUTH_STATUS.signedOut || dismissed) {
    return null;
  }

  function dismiss() {
    writeDismissed();
    setDismissed(true);
  }

  return (
    <section className="verify-banner" aria-label={t.guestBannerLabel}>
      <Icon icon={HardDrive} size="lg" className="verify-banner-icon" />
      <p className="verify-banner-text">
        <strong>{t.guestBannerTitle}</strong> <span>{t.guestBannerBody}</span>
      </p>
      <Link to="/register" className="verify-banner-action">
        {t.guestBannerAction}
      </Link>
      <button
        type="button"
        className="verify-banner-close"
        aria-label={t.closeButton}
        onClick={dismiss}
      >
        <Icon icon={X} size="md" />
      </button>
    </section>
  );
}

export default GuestBanner;
