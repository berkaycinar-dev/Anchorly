import { NavLink } from "react-router";
import { LogIn, LogOut, User, UserPlus } from "lucide-react";
import Icon from "./Icon";
import useAuth from "../auth/useAuth";
import { AUTH_STATUS } from "../auth/authStatus";
import { accountRoute } from "../routes";
import { useToast } from "./toast/useToast";

function renderLink({ to, icon, label, getItemClassName, onNavigate }) {
  return (
    <li key={to}>
      <NavLink to={to} className={getItemClassName} onClick={onNavigate}>
        <Icon icon={icon} size="lg" className="nav-icon" />
        <span className="nav-label">{label}</span>
      </NavLink>
    </li>
  );
}

function BottomNavAccount({ t, getItemClassName, onNavigate }) {
  const { status, user, logout } = useAuth();
  const toast = useToast();

  if (status === AUTH_STATUS.disabled || status === AUTH_STATUS.loading) {
    return null;
  }

  async function signOut() {
    onNavigate();
    const result = await logout();

    if (!result.serverSignedOut) {
      toast.info(t.signedOutLocally);
    }
  }

  const isSignedIn = status === AUTH_STATUS.signedIn && user;

  return (
    <>
      <li className="bottom-nav-more-separator" role="separator" />
      {isSignedIn ? (
        <>
          {renderLink({
            to: accountRoute.path,
            icon: User,
            label: t.accountPageLink,
            getItemClassName,
            onNavigate,
          })}
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
      ) : (
        <>
          {renderLink({
            to: "/login",
            icon: LogIn,
            label: t.signIn,
            getItemClassName,
            onNavigate,
          })}
          {renderLink({
            to: "/register",
            icon: UserPlus,
            label: t.signUp,
            getItemClassName,
            onNavigate,
          })}
        </>
      )}
    </>
  );
}

export default BottomNavAccount;
