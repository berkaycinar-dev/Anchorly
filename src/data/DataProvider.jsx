import { useState } from "react";
import { getLocalDateString } from "../utils/dateHelpers";
import { DataContext } from "./DataContext";
import createLocalRepositories from "./local/createLocalRepositories";

function createDataContextValue(createRepositories) {
  const repositories = createRepositories({ today: getLocalDateString() });
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
}) {
  const [value] = useState(() => createDataContextValue(createRepositories));

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}