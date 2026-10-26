import { useEffect, useSyncExternalStore } from "react";
import {
  dismiss as dismissStorageIssues,
  getPrimaryIssueKind,
  getSnapshot,
  subscribe,
} from "../data/local/storageStatus";
import { useToast } from "./toast/useToast";

const MESSAGE_KEYS = {
  quota: "storageQuotaWarning",
  unavailable: "storageUnavailableWarning",
  read: "storageReadWarning",
};

function StorageToasts({ t }) {
  const issues = useSyncExternalStore(subscribe, getSnapshot);
  const kind = getPrimaryIssueKind(issues);
  const { error, dismiss } = useToast();

  useEffect(() => {
    if (kind === null) {
      return undefined;
    }

    const id = error(t[MESSAGE_KEYS[kind]], {
      persistent: true,
      onClose: dismissStorageIssues,
    });

    return () => dismiss(id);
  }, [kind, t, error, dismiss]);

  return null;
}

export default StorageToasts;
