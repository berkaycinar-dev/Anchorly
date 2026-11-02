import { Link } from "react-router";
import SettingsRow from "./SettingsRow";
import { useToast } from "../toast/useToast";
import { getDisplayName, getInitials } from "../accountName";

export default function AccountPanel({ t, user, logout }) {
  const toast = useToast();
  const name = getDisplayName(user);

  async function signOut() {
    const result = await logout();

    if (!result.serverSignedOut) {
      toast.info(t.signedOutLocally);
    }
  }

  return (
    <>
      <div className="settings-row">
        <span className="settings-avatar" aria-hidden="true">
          {getInitials(name)}
        </span>
        <div className="settings-row-text">
          <span className="settings-account-name">{name}</span>
          <span className="settings-row-description">{user.email}</span>
        </div>
        <Link to="/account" className="btn btn-secondary settings-action">
          {t.manageAccount}
        </Link>
      </div>

      <SettingsRow label={t.sessionLabel} description={t.sessionDescription}>
        <button
          type="button"
          className="btn btn-secondary settings-action settings-signout"
          onClick={signOut}
        >
          {t.signOut}
        </button>
      </SettingsRow>
    </>
  );
}
