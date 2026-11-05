import { useEffect, useRef, useState } from "react";
import { Check, CloudOff, RefreshCw } from "lucide-react";
import useOutboxStatus from "../../data/useOutboxStatus";
import Icon from "../Icon";

export const SYNCED_MESSAGE_MS = 3000;

function SyncStatusBar({ t }) {
  const { pending, offline } = useOutboxStatus();
  const [showSynced, setShowSynced] = useState(false);
  const previousPending = useRef(pending);

  useEffect(() => {
    const hadPending = previousPending.current > 0;

    previousPending.current = pending;

    if (!hadPending || pending > 0) {
      return undefined;
    }

    setShowSynced(true);

    const timer = setTimeout(() => setShowSynced(false), SYNCED_MESSAGE_MS);

    return () => clearTimeout(timer);
  }, [pending]);

  let icon = null;
  let message = null;

  if (pending > 0 && offline) {
    icon = CloudOff;
    message = t.syncOfflinePending(pending);
  } else if (pending > 0) {
    icon = RefreshCw;
    message = t.syncPending(pending);
  } else if (offline) {
    icon = CloudOff;
    message = t.syncOffline;
  } else if (showSynced) {
    icon = Check;
    message = t.syncDone;
  }

  if (!message) {
    return null;
  }

  return (
    <section
      className="verify-banner sync-status"
      role="status"
      aria-label={t.syncStatusLabel}
    >
      <Icon icon={icon} size="lg" className="verify-banner-icon" />
      <p className="verify-banner-text">{message}</p>
    </section>
  );
}

export default SyncStatusBar;
