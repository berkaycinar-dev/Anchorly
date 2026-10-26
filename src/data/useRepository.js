import { useContext, useEffect } from "react";
import { DataContext } from "./DataContext";

export default function useRepository(name) {
  const context = useContext(DataContext);

  useEffect(() => {
    context?.ensureStarted(name);
  }, [context, name]);

  if (context === null) {
    throw new Error("useRepository must be used within a DataProvider");
  }

  const repository = context.repositories[name];

  if (!repository) {
    throw new Error(`Unknown repository "${name}"`);
  }

  return repository;
}
