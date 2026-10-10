import { useSyncExternalStore } from "react";
import {
  dismiss,
  getPrimaryIssueKind,
  getSnapshot,
  subscribe,
} from "../lib/storageStatus";

const MESSAGE_KEYS = {
  quota: "storageQuotaWarning",
  unavailable: "storageUnavailableWarning",
  read: "storageReadWarning",
};

function StorageWarning({ t }) {
  const issues = useSyncExternalStore(subscribe, getSnapshot);
  const kind = getPrimaryIssueKind(issues);

  if (kind === null) {
    return null;
  }

  return (
    <div className="storage-warning" role="alert">
      <p className="storage-warning-message">{t[MESSAGE_KEYS[kind]]}</p>
      <button type="button" className="storage-warning-close" onClick={dismiss}>
        {t.closeButton}
      </button>
    </div>
  );
}

export default StorageWarning;