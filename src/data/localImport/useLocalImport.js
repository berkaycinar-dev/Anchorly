import { useCallback, useContext, useState } from "react";
import { AUTH_STATUS } from "../../auth/authStatus";
import useAuth from "../../auth/useAuth";
import { getLocalDateString } from "../../utils/dateHelpers";
import { DataContext } from "../DataContext";
import buildImportPayload from "./buildImportPayload";
import {
  backUpAndClearLocalData,
  getImportDecision,
  setImportDecision,
} from "./importStorage";
import readLocalData from "./readLocalData";
import runLocalImport from "./runLocalImport";

export const IMPORT_PHASE = Object.freeze({
  idle: "idle",
  importing: "importing",
  done: "done",
  failed: "failed",
});

export default function useLocalImport() {
  const { api, user, status } = useAuth();
  const dataContext = useContext(DataContext);
  const client = status === AUTH_STATUS.signedIn ? (api?.client ?? null) : null;
  const userId = user?.id ?? null;
  const [local] = useState(() =>
    client ? buildImportPayload(readLocalData(getLocalDateString())) : null,
  );
  const [decision, setDecision] = useState(() =>
    userId ? getImportDecision(userId) : null,
  );
  const [phase, setPhase] = useState(IMPORT_PHASE.idle);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [backedUp, setBackedUp] = useState(true);

  const run = useCallback(async () => {
    setPhase(IMPORT_PHASE.importing);
    setError(null);

    try {
      const importResult = await runLocalImport({
        client,
        payload: local.payload,
      });
      const cleared = backUpAndClearLocalData();

      setImportDecision(userId, "imported");
      setBackedUp(cleared);
      setResult(importResult);
      setPhase(IMPORT_PHASE.done);
    } catch (caught) {
      setError(caught);
      setPhase(IMPORT_PHASE.failed);
    }
  }, [client, local, userId]);

  const decline = useCallback(() => {
    setImportDecision(userId, "declined");
    setDecision("declined");
  }, [userId]);

  const finish = useCallback(() => {
    dataContext?.reload?.();
  }, [dataContext]);

  return {
    hasData: local?.hasData ?? false,
    summary: local?.summary ?? null,
    decision,
    phase,
    result,
    error,
    backedUp,
    run,
    decline,
    finish,
  };
}
