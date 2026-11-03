import { useState } from "react";
import describeAuthError from "../../auth/authErrors";
import useAuth from "../../auth/useAuth";
import downloadJson from "../../utils/downloadJson";
import { getLocalDateString } from "../../utils/dateHelpers";
import { useToast } from "../toast/useToast";
import Button from "../ui/Button";
import AccountSection from "./AccountSection";

function DataSection({ t }) {
  const { api, user } = useAuth();
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const verified = Boolean(user.emailVerifiedAt);

  async function handleExport() {
    setExporting(true);

    try {
      const data = await api.exportData();
      downloadJson(
        data,
        `anchorly-export-${getLocalDateString(new Date())}.json`,
      );
      toast.success(t.accountExported);
    } catch (error) {
      toast.error(describeAuthError(error, t).alert.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <AccountSection
      title={t.accountDataTitle}
      description={t.accountExportDescription}
    >
      <div className="account-actions">
        <Button
          variant="secondary"
          loading={exporting}
          disabled={!verified}
          onClick={handleExport}
        >
          {t.accountExport}
        </Button>
      </div>
      {verified ? null : (
        <p className="account-muted">{t.accountExportNeedsVerification}</p>
      )}
    </AccountSection>
  );
}

export default DataSection;
