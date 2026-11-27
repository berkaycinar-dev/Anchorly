import { INSTALL_STATUS } from "../../pwa/installPrompt";
import useInstallPrompt from "../../pwa/useInstallPrompt";
import SettingsRow from "./SettingsRow";

// Settings > About: installs Anchorly as an app (PWA). Only browsers that
// hand over an install prompt get a button; the rest get instructions.
export default function InstallAppRow({ t, store }) {
  const { status, install } = useInstallPrompt(store);

  const descriptions = {
    [INSTALL_STATUS.available]: t.settingsInstallDescription,
    [INSTALL_STATUS.installed]: t.settingsInstallInstalled,
    [INSTALL_STATUS.ios]: t.settingsInstallIos,
    [INSTALL_STATUS.unavailable]: t.settingsInstallUnavailable,
  };

  return (
    <SettingsRow
      label={t.settingsInstallTitle}
      description={descriptions[status]}
    >
      {status === INSTALL_STATUS.available && (
        <button
          type="button"
          className="btn btn-primary settings-action"
          onClick={() => install()}
        >
          {t.settingsInstallButton}
        </button>
      )}
    </SettingsRow>
  );
}
