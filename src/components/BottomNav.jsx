import { useEffect, useId, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router";
import NavIcon from "./NavIcon";
import { routes, getRouteForPathname } from "../routes";

const PRIMARY_ROUTE_KEYS = ["Dashboard", "Today", "Daily Routine", "Calendar"];
const TAB_TITLE_KEYS = { "Daily Routine": "routineTab" };

const primaryRoutes = routes.filter((route) =>
  PRIMARY_ROUTE_KEYS.includes(route.key),
);
const moreRoutes = routes.filter(
  (route) => !PRIMARY_ROUTE_KEYS.includes(route.key),
);

function getTabClassName({ isActive }) {
  return isActive
    ? "bottom-nav-item bottom-nav-item-active"
    : "bottom-nav-item";
}

function getMoreItemClassName({ isActive }) {
  return isActive
    ? "bottom-nav-more-item bottom-nav-more-item-active"
    : "bottom-nav-more-item";
}

function BottomNav({ t, badges = {} }) {
  const { pathname } = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const navRef = useRef(null);
  const moreButtonRef = useRef(null);
  const morePanelId = useId();

  const currentRoute = getRouteForPathname(pathname);
  const isMoreActive = moreRoutes.some(
    (route) => route.key === currentRoute?.key,
  );

  useEffect(() => {
    if (!isMoreOpen) {
      return;
    }

    function handlePointerDown(event) {
      if (!navRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
        moreButtonRef.current.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMoreOpen]);

  function closeMore() {
    setIsMoreOpen(false);
  }

  function renderBadge(routeKey, className) {
    const badgeCount = badges[routeKey] || 0;

    if (badgeCount === 0) {
      return null;
    }

    return (
      <span key={badgeCount} className={className}>
        {badgeCount}
      </span>
    );
  }

  return (
    <nav
      ref={navRef}
      className="bottom-nav"
      aria-label={t.bottomNavigationLabel}
    >
      <ul
        id={morePanelId}
        className="bottom-nav-more-panel"
        hidden={!isMoreOpen}
      >
        {moreRoutes.map((route) => (
          <li key={route.key}>
            <NavLink
              to={route.path}
              className={getMoreItemClassName}
              onClick={closeMore}
            >
              <NavIcon name={route.key} />
              <span className="nav-label">{t[route.titleKey]}</span>
              {renderBadge(route.key, "nav-badge")}
            </NavLink>
          </li>
        ))}
      </ul>

      <ul className="bottom-nav-tabs">
        {primaryRoutes.map((route) => (
          <li key={route.key}>
            <NavLink
              to={route.path}
              end={route.path === "/"}
              className={getTabClassName}
              onClick={closeMore}
            >
              <span className="bottom-nav-icon">
                <NavIcon name={route.key} />
              </span>
              <span className="bottom-nav-label">
                {t[TAB_TITLE_KEYS[route.key] ?? route.titleKey]}
              </span>
              {renderBadge(route.key, "nav-badge bottom-nav-badge")}
            </NavLink>
          </li>
        ))}

        <li>
          <button
            ref={moreButtonRef}
            type="button"
            className={
              isMoreActive
                ? "bottom-nav-item bottom-nav-item-active"
                : "bottom-nav-item"
            }
            aria-expanded={isMoreOpen}
            aria-controls={morePanelId}
            onClick={() => setIsMoreOpen((open) => !open)}
          >
            <span className="bottom-nav-icon">
              <NavIcon name="More" />
            </span>
            <span className="bottom-nav-label">{t.moreMenu}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default BottomNav;
