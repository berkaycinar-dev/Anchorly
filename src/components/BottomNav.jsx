import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router";
import Icon from "./Icon";
import { NAV_ICONS } from "./navIcons";
import { routes, getRouteForPathname } from "../routes";
import BottomNavAccount from "./BottomNavAccount";

const PRIMARY_ROUTE_KEYS = ["Dashboard", "Today", "Daily Routine", "Calendar"];
const TAB_TITLE_KEYS = { "Daily Routine": "routineTab" };
const INDICATOR_WIDTH = 28;

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
  const tabsRef = useRef(null);
  const indicatorRef = useRef(null);
  const previousLeftRef = useRef(null);
  const moreButtonRef = useRef(null);
  const morePanelId = useId();

  const currentRoute = getRouteForPathname(pathname);
  const isMoreActive =
    currentRoute?.key === "Account" ||
    moreRoutes.some((route) => route.key === currentRoute?.key);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;

    function positionIndicator() {
      const target = isMoreOpen
        ? moreButtonRef.current
        : tabsRef.current.querySelector(".bottom-nav-item-active");

      if (!target || nav.offsetWidth === 0) {
        indicator.hidden = true;
        return;
      }

      const left =
        target.offsetLeft + (target.offsetWidth - INDICATOR_WIDTH) / 2;
      const right = nav.offsetWidth - left - INDICATOR_WIDTH;

      if (
        previousLeftRef.current !== null &&
        previousLeftRef.current !== left
      ) {
        indicator.dataset.direction =
          left > previousLeftRef.current ? "right" : "left";
      }

      indicator.hidden = false;
      indicator.style.left = `${left}px`;
      indicator.style.right = `${right}px`;
      previousLeftRef.current = left;
    }

    positionIndicator();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(positionIndicator);
    observer.observe(nav);

    return () => observer.disconnect();
  }, [pathname, isMoreOpen]);

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
      <span
        ref={indicatorRef}
        className="bottom-nav-indicator"
        aria-hidden="true"
        hidden
      />

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
              <Icon
                icon={NAV_ICONS[route.key]}
                size="lg"
                className="nav-icon"
              />
              <span className="nav-label">{t[route.titleKey]}</span>
              {renderBadge(route.key, "nav-badge")}
            </NavLink>
          </li>
        ))}
        <BottomNavAccount
          t={t}
          getItemClassName={getMoreItemClassName}
          onNavigate={closeMore}
        />
      </ul>

      <ul ref={tabsRef} className="bottom-nav-tabs">
        {primaryRoutes.map((route) => (
          <li key={route.key}>
            <NavLink
              to={route.path}
              end={route.path === "/"}
              className={getTabClassName}
              onClick={closeMore}
            >
              <span className="bottom-nav-icon">
                <Icon
                  icon={NAV_ICONS[route.key]}
                  size="lg"
                  className="nav-icon"
                />
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
              <Icon icon={NAV_ICONS.More} size="lg" className="nav-icon" />
            </span>
            <span className="bottom-nav-label">{t.moreMenu}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default BottomNav;
