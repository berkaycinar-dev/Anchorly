import { useState } from "react";
import describeAuthError from "../../auth/authErrors";
import useAuth from "../../auth/useAuth";
import { getDisplayName, getInitials } from "../accountName";
import { useToast } from "../toast/useToast";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import AccountSection from "./AccountSection";

const DISPLAY_NAME_MAX_LENGTH = 100;

function ProfileSection({ t }) {
  const { api, user, setUser } = useAuth();
  const toast = useToast();
  const savedName = user.displayName ?? "";
  const [name, setName] = useState(savedName);
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);
  const trimmed = name.trim();
  const unchanged = trimmed === savedName.trim();
  const preview = getDisplayName({
    ...user,
    displayName: trimmed,
  });

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || unchanged) {
      return;
    }

    setSaving(true);
    setAlert(null);

    try {
      const updated = await api.updateMe({ displayName: trimmed || null });
      setUser(updated);
      setName(updated.displayName ?? "");
      toast.success(t.accountProfileSaved);
    } catch (error) {
      setAlert(describeAuthError(error, t).alert);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AccountSection title={t.accountProfileTitle}>
      <div className="account-identity">
        <span className="account-avatar-large" aria-hidden="true">
          {getInitials(preview)}
        </span>
        <div className="account-identity-text">
          <span className="account-identity-email">{user.email}</span>
          <span
            className="account-badge"
            data-state={user.emailVerifiedAt ? "verified" : "unverified"}
          >
            {user.emailVerifiedAt
              ? t.accountEmailVerified
              : t.accountEmailUnverified}
          </span>
        </div>
      </div>
      <form className="account-form" noValidate onSubmit={handleSubmit}>
        {alert ? <Alert tone={alert.tone}>{alert.message}</Alert> : null}
        <TextField
          label={t.accountDisplayNameLabel}
          name="displayName"
          autoComplete="name"
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          hint={t.accountDisplayNameHint}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="account-actions">
          <Button type="submit" loading={saving} disabled={unchanged}>
            {t.accountSave}
          </Button>
        </div>
      </form>
    </AccountSection>
  );
}

export default ProfileSection;
