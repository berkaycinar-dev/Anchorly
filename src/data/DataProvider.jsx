import { useState } from "react";
import { getLocalDateString } from "../utils/dateHelpers";
import { DataContext } from "./DataContext";
import createLocalRepositories from "./local/createLocalRepositories";

function createDataContextValue(createRepositories, today) {
  const repositories = createRepositories({ today });
  const startedNames = new Set();

  function ensureStarted(name) {
    if (startedNames.has(name)) {
      return;
    }

    startedNames.add(name);
    repositories[name].start();
  }

  return { repositories, ensureStarted };
}

export default function DataProvider({
  children,
  createRepositories = createLocalRepositories,
  today,
}) {
  const [value] = useState(() =>
    createDataContextValue(createRepositories, today ?? getLocalDateString()),
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
