import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import {
  ChevronsUpDown,
  LogIn,
  LogOut,
  SlidersHorizontal,
  User,
} from "lucide-react";
import Icon from "./Icon";
import useAuth from "../auth/useAuth";
import { AUTH_STATUS } from "../auth/authStatus";
import { useToast } from "./toast/useToast";
import { getDisplayName, getInitials } from "./accountName";

function AccountMenu({ t, user, name, onClose, onNavigate, onSignOut }) {
  const menuRef = useRef(null);

  useEffect(() => {
    menuRef.current.querySelector('[role="menuitem"]').focus();
  }, []);

  function handleKeyDown(event) {
    const items = [...menuRef.current.querySelectorAll('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement);

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      items[(index + step + items.length) % items.length].focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      items[event.key === "Home" ? 0 : items.length - 1].focus();
    } else if (event.key === "Tab") {
      onClose();
    }
  }

  function choose() {
    onClose();
    onNavigate?.();
  }

  return (
    <div
      ref={menuRef}
      className="account-menu"
      role="menu"
      aria-label={t.accountMenuLabel}
      onKeyDown={handleKeyDown}
    >
      <div className="account-menu-header">
        <span className="account-menu-name">{name}</span>
        <span className="account-menu-email">{user.email}</span>
      </div>
      <Link
        to="/account"
        role="menuitem"
        className="account-menu-item"
        onClick={choose}
      >
        <Icon icon={User} size="sm" />
        {t.accountPageLink}
      </Link>
      <Link
        to="/settings"
        role="menuitem"
        className="account-menu-item"
        onClick={choose}
      >
        <Icon icon={SlidersHorizontal} size="sm" />
        {t.settings}
      </Link>
      <div className="account-menu-separator" role="separator" />
      <button
        type="button"
        role="menuitem"
        className="account-menu-item account-menu-danger"
        onClick={onSignOut}
      >
        <Icon icon={LogOut} size="sm" />
        {t.signOut}
      </button>
    </div>
  );
}

function SignedInAccount({ t, user, logout, isExpanded, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuId = useId();
  const toast = useToast();
  const name = getDisplayName(user);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event) {
      if (!containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setIsOpen(false);
        triggerRef.current.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen]);

  async function signOut() {
    setIsOpen(false);
    onNavigate?.();
    const result = await logout();

    if (!result.serverSignedOut) {
      toast.info(t.signedOutLocally);
    }
  }

  return (
    <div
      ref={containerRef}
      className="sidebar-account"
      data-open={isOpen ? "true" : "false"}
    >
      <button
        ref={triggerRef}
        type="button"
        className="account-trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={`${name}, ${t.accountMenuLabel}`}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="account-avatar" aria-hidden="true">
          {getInitials(name)}
        </span>
        <span className="account-text">
          <span className="account-name">{name}</span>
          <span className="account-email">{user.email}</span>
        </span>
        <Icon icon={ChevronsUpDown} size="sm" className="account-chevron" />
        {!isExpanded && !isOpen && (
          <span className="nav-tooltip" aria-hidden="true">
            {`${name} · ${t.accountTooltipSuffix}`}
          </span>
        )}
      </button>

      {isOpen && (
        <div id={menuId} className="account-menu-anchor">
          <AccountMenu
            t={t}
            user={user}
            name={name}
            onClose={() => setIsOpen(false)}
            onNavigate={onNavigate}
            onSignOut={signOut}
          />
        </div>
      )}
    </div>
  );
}

function SidebarAccount({ t, isExpanded = true, onNavigate }) {
  const { status, user, logout } = useAuth();

  if (status === AUTH_STATUS.disabled) {
    return null;
  }

  if (status === AUTH_STATUS.loading) {
    return (
      <div
        className="sidebar-account sidebar-account-loading"
        aria-busy="true"
        aria-label={t.accountLoading}
        role="status"
      >
        <span className="account-avatar account-skeleton" />
        <span className="account-text">
          <span className="account-skeleton account-skeleton-line" />
          <span className="account-skeleton account-skeleton-line account-skeleton-short" />
        </span>
      </div>
    );
  }

  if (status === AUTH_STATUS.signedIn && user) {
    return (
      <SignedInAccount
        t={t}
        user={user}
        logout={logout}
        isExpanded={isExpanded}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="sidebar-account sidebar-account-guest">
      <Link
        to="/login"
        className="account-guest-button account-guest-primary"
        onClick={onNavigate}
      >
        <Icon icon={LogIn} size="md" className="account-guest-icon" />
        <span className="account-guest-label">{t.signIn}</span>
        {!isExpanded && (
          <span className="nav-tooltip" aria-hidden="true">
            {t.signIn}
          </span>
        )}
      </Link>
      <Link
        to="/register"
        className="account-guest-button account-guest-secondary"
        onClick={onNavigate}
      >
        {t.signUp}
      </Link>
    </div>
  );
}

export default SidebarAccount;
