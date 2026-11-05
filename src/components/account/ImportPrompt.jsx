import { useState } from "react";
import useLocalImport from "../../data/localImport/useLocalImport";
import ImportDialog from "./ImportDialog";

function ImportPrompt({ t }) {
  const importer = useLocalImport();
  const [dismissed, setDismissed] = useState(false);
  const shouldAsk =
    importer.hasData && importer.decision === null && !dismissed;

  if (!shouldAsk) {
    return null;
  }

  return (
    <ImportDialog
      t={t}
      importer={importer}
      mode="prompt"
      onClose={() => setDismissed(true)}
    />
  );
}

export default ImportPrompt;
