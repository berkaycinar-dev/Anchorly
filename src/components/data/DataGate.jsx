import { useContext, useEffect } from "react";
import { DataContext } from "../../data/DataContext";
import useDataStatus from "../../data/useDataStatus";
import DataErrorScreen from "./DataErrorScreen";
import DataLoadingScreen from "./DataLoadingScreen";

function DataGate({ onSignOut, children }) {
  const context = useContext(DataContext);
  const status = useDataStatus();

  useEffect(() => {
    context.startAll();
  }, [context]);

  if (status === "error") {
    return <DataErrorScreen onRetry={context.retry} onSignOut={onSignOut} />;
  }

  if (status === "loading") {
    return <DataLoadingScreen />;
  }

  return children;
}

export default DataGate;
