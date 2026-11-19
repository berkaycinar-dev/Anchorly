import { Link } from "react-router";
import Logo from "./Logo";
import useAuth from "../auth/useAuth";
import { AUTH_STATUS } from "../auth/authStatus";
import { accountRoute } from "../routes";
import { getDisplayName, getInitials } from "./accountName";

function MobileBrandBar({ t }) {
  const { status, user } = useAuth();
  const isSignedIn = status === AUTH_STATUS.signedIn && user;
  const name = isSignedIn ? getDisplayName(user) : null;

  return (
    <header className="mobile-brand-bar">
      <Link to="/" className="mobile-brand-link" aria-label={t.homeLinkLabel}>
        <Logo size={24} />
        <span className="mobile-brand-name" aria-hidden="true">
          Anchorly
        </span>
      </Link>

      {isSignedIn && (
        <Link
          to={accountRoute.path}
          className="mobile-brand-account"
          aria-label={`${name}, ${t.accountPageLink}`}
        >
          <span className="mobile-brand-avatar" aria-hidden="true">
            {getInitials(name)}
          </span>
        </Link>
      )}
    </header>
  );
}

export default MobileBrandBar;
