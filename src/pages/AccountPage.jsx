import { useState } from "react";
import { Navigate } from "react-router";
import DataSection from "../components/account/DataSection";
import DeleteAccountSection from "../components/account/DeleteAccountSection";
import PasswordSection from "../components/account/PasswordSection";
import ProfileSection from "../components/account/ProfileSection";
import SessionsSection from "../components/account/SessionsSection";
import { AUTH_STATUS } from "../auth/authStatus";
import { withNextPath } from "../auth/safeNextPath";
import useAuth from "../auth/useAuth";

function AccountPage({ t, language }) {
  const { status } = useAuth();
  const [sessionsRefreshKey, setSessionsRefreshKey] = useState(0);

  if (status === AUTH_STATUS.loading) {
    return (
      <p className="account-muted" role="status" aria-busy="true">
        {t.accountLoading}
      </p>
    );
  }

  if (status !== AUTH_STATUS.signedIn) {
    return <Navigate to={withNextPath("/login", "/account")} replace />;
  }

  return (
    <div className="account-page">
      <ProfileSection t={t} />
      <PasswordSection
        t={t}
        onChanged={() => setSessionsRefreshKey((key) => key + 1)}
      />
      <SessionsSection
        t={t}
        language={language}
        refreshKey={sessionsRefreshKey}
      />
      <DataSection t={t} />
      <DeleteAccountSection t={t} />
    </div>
  );
}

export default AccountPage;
