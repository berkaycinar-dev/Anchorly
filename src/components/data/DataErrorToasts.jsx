import { useEffect, useRef, useSyncExternalStore } from "react";
import { getSnapshot, subscribe } from "../../data/api/dataErrorStatus";
import { useToast } from "../toast/useToast";

const MESSAGE_KEYS = {
  network: "dataSaveFailedNetwork",
  other: "dataSaveFailedOther",
};

function DataErrorToasts({ t }) {
  const latest = useSyncExternalStore(subscribe, getSnapshot);
  const seenId = useRef(latest.id);
  const { error } = useToast();

  useEffect(() => {
    if (latest.id === seenId.current) {
      return;
    }

    seenId.current = latest.id;
    error(t[MESSAGE_KEYS[latest.kind]]);
  }, [latest, t, error]);

  return null;
}

export default DataErrorToasts;
