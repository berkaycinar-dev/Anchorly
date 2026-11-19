import { Link, NavLink } from "react-router";
import { ChevronRight, LogOut } from "lucide-react";
import Icon from "./Icon";
import useAuth from "../auth/useAuth";
import { AUTH_STATUS } from "../auth/authStatus";
import { accountRoute } from "../routes";
import { useToast } from "./toast/useToast";
import { getDisplayName, getInitials } from "./accountName";

function isAccountHidden(status) {
  return status === AUTH_STATUS.disabled || status === AUTH_STATUS.loading;
}

export function BottomNavAccountCard({ t, onNavigate }) {
  const { status, user } = useAuth();

  if (isAccountHidden(status)) {
    return null;
  }

  if (status === AUTH_STATUS.signedIn && user) {
    const name = getDisplayName(user);

    return (
      <NavLink
        to={accountRoute.path}
        className={({ isActive }) =>
          isActive
            ? "bottom-nav-account-card bottom-nav-account-card-active"
            : "bottom-nav-account-card"
        }
        aria-label={`${name}, ${t.accountPageLink}`}
        onClick={onNavigate}
      >
        <span className="bottom-nav-account-avatar" aria-hidden="true">
          {getInitials(name)}
        </span>
        <span className="bottom-nav-account-text">
          <span className="bottom-nav-account-name">{name}</span>
          <span className="bottom-nav-account-email">{user.email}</span>
        </span>
        <Icon
          icon={ChevronRight}
          size="md"
          className="bottom-nav-account-chevron"
        />
      </NavLink>
    );
  }

  return (
    <div className="bottom-nav-account-actions">
      <Link to="/login" className="btn btn-primary" onClick={onNavigate}>
        {t.signIn}
      </Link>
      <Link to="/register" className="btn btn-secondary" onClick={onNavigate}>
        {t.signUp}
      </Link>
    </div>
  );
}

export function BottomNavSignOut({ t, onNavigate }) {
  const { status, user, logout } = useAuth();
  const toast = useToast();

  if (isAccountHidden(status) || status !== AUTH_STATUS.signedIn || !user) {
    return null;
  }

  async function signOut() {
    onNavigate();
    const result = await logout();

    if (!result.serverSignedOut) {
      toast.info(t.signedOutLocally);
    }
  }

  return (
    <>
      <li className="bottom-nav-more-separator" role="separator" />
      <li>
        <button
          type="button"
          className="bottom-nav-more-item bottom-nav-more-danger"
          onClick={signOut}
        >
          <Icon icon={LogOut} size="lg" className="nav-icon" />
          <span className="nav-label">{t.signOut}</span>
        </button>
      </li>
    </>
  );
}
