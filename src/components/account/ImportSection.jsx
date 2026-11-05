import { useState } from "react";
import useLocalImport from "../../data/localImport/useLocalImport";
import Button from "../ui/Button";
import AccountSection from "./AccountSection";
import ImportDialog from "./ImportDialog";

function ImportSection({ t }) {
  const importer = useLocalImport();
  const [open, setOpen] = useState(false);

  if (!importer.hasData) {
    return null;
  }

  return (
    <AccountSection
      title={t.importSectionTitle}
      description={t.importSectionDescription}
    >
      <div className="account-actions">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          {t.importOpen}
        </Button>
      </div>
      {open ? (
        <ImportDialog
          t={t}
          importer={importer}
          mode="manual"
          onClose={() => setOpen(false)}
        />
      ) : null}
    </AccountSection>
  );
}

export default ImportSection;
