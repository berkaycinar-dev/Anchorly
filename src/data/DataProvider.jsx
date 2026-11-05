import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/AuthContext";
import { AUTH_STATUS } from "../auth/authStatus";
import DataGate from "../components/data/DataGate";
import DataLoadingScreen from "../components/data/DataLoadingScreen";
import { getLocalDateString } from "../utils/dateHelpers";
import defaultCreateApiRepositories from "./api/createApiRepositories";
import { reportDataError } from "./api/dataErrorStatus";
import withErrorReporting from "./api/withErrorReporting";
import { DataContext } from "./DataContext";
import createOutbox from "./outbox/createOutbox";
import createLocalRepositories from "./local/createLocalRepositories";

function createDataContextValue({
  client,
  userId,
  createRepositories,
  createApiRepositories,
  today,
  reload,
}) {
  const outbox = client
    ? createOutbox({
        client,
        userId,
        onSynced: () => refresh(),
        onDropped: reportDataError,
      })
    : null;
  const repositories = client
    ? Object.fromEntries(
        Object.entries(
          createApiRepositories({ client: outbox.client, today }),
        ).map(([name, repository]) => [
          name,
          withErrorReporting(repository, reportDataError),
        ]),
      )
    : createRepositories({ today });
  const startedNames = new Set();

  function ensureStarted(name) {
    if (startedNames.has(name)) {
      return;
    }

    startedNames.add(name);
    repositories[name].start();
  }

  function startAll() {
    if (outbox && outbox.getSnapshot().pending > 0) {
      outbox
        .flush()
        .then(() => Object.keys(repositories).forEach(ensureStarted));
      return;
    }

    Object.keys(repositories).forEach(ensureStarted);
  }

  function retry() {
    Object.values(repositories).forEach((repository) => {
      if (repository.getStatus() === "error") {
        repository.start();
      }
    });
  }

  function refresh() {
    if (outbox && outbox.getSnapshot().pending > 0) {
      return outbox.flush();
    }

    return Promise.all(
      Object.values(repositories).map((repository) => repository.refresh?.()),
    );
  }

  return {
    repositories,
    outbox,
    ensureStarted,
    startAll,
    retry,
    refresh,
    reload,
  };
}

function DataSession({
  client,
  userId,
  onSignOut,
  onReload,
  createRepositories,
  createApiRepositories,
  today,
  children,
}) {
  const [value] = useState(() =>
    createDataContextValue({
      client,
      userId,
      createRepositories,
      createApiRepositories,
      today,
      reload: onReload,
    }),
  );

  useEffect(() => {
    value.outbox?.activate();

    return () => value.outbox?.deactivate();
  }, [value]);

  return (
    <DataContext.Provider value={value}>
      {client ? (
        <DataGate onSignOut={onSignOut}>{children}</DataGate>
      ) : (
        children
      )}
    </DataContext.Provider>
  );
}

export default function DataProvider({
  children,
  createRepositories = createLocalRepositories,
  createApiRepositories = defaultCreateApiRepositories,
  today,
}) {
  const auth = useContext(AuthContext);
  const [generation, setGeneration] = useState(0);
  const reload = useCallback(() => setGeneration((count) => count + 1), []);
  const status = auth?.status ?? AUTH_STATUS.disabled;

  if (status === AUTH_STATUS.loading) {
    return <DataLoadingScreen />;
  }

  const client =
    status === AUTH_STATUS.signedIn ? (auth.api?.client ?? null) : null;
  const sessionKey = client ? `api:${auth.user?.id ?? ""}` : "local";

  return (
    <DataSession
      key={`${sessionKey}:${generation}`}
      client={client}
      userId={auth?.user?.id ?? ""}
      onSignOut={auth?.logout}
      onReload={reload}
      createRepositories={createRepositories}
      createApiRepositories={createApiRepositories}
      today={today ?? getLocalDateString()}
    >
      {children}
    </DataSession>
  );
}
