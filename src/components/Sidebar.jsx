import { Fragment, useLayoutEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router";
import Icon from "./Icon";
import { NAV_ICONS } from "./navIcons";
import { routes } from "../routes";
import Logo from "./Logo";

const INDICATOR_INSET = 11;

function getNavItemClassName({ isActive }) {
  return isActive ? "nav-item active-nav" : "nav-item";
}

function Sidebar({
  t,
  badges = {},
  isExpanded = true,
  isOverlayOpen = false,
  onToggle,
  onNavigate,
}) {
  const { pathname } = useLocation();
  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const previousTopRef = useRef(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;

    function positionIndicator() {
      const activeItem = nav.querySelector(".active-nav");

      if (!activeItem || nav.offsetParent === null) {
        return;
      }

      const top = activeItem.offsetTop + INDICATOR_INSET;
      const bottom =
        nav.offsetHeight -
        activeItem.offsetTop -
        activeItem.offsetHeight +
        INDICATOR_INSET;

      if (previousTopRef.current !== null && previousTopRef.current !== top) {
        indicator.dataset.direction =
          top > previousTopRef.current ? "down" : "up";
      }

      indicator.style.top = `${top}px`;
      indicator.style.bottom = `${bottom}px`;
      previousTopRef.current = top;
    }

    positionIndicator();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(positionIndicator);
    observer.observe(nav);

    return () => observer.disconnect();
  }, [pathname]);

  const toggleLabel = isExpanded ? t.sidebarCollapse : t.sidebarExpand;

  return (
    <>
      {isOverlayOpen && (
        <div
          className="sidebar-backdrop"
          aria-hidden="true"
          onClick={onNavigate}
        />
      )}

      <aside
        className="sidebar"
        data-expanded={isExpanded ? "true" : "false"}
        data-overlay={isOverlayOpen ? "true" : "false"}
      >
        <div className="sidebar-panel">
          <button
            type="button"
            className="sidebar-brand"
            aria-expanded={isExpanded}
            aria-label={toggleLabel}
            title={toggleLabel}
            onClick={onToggle}
          >
            <Logo />
            <span className="sidebar-brand-name">Anchorly</span>
          </button>

          <nav ref={navRef} aria-label={t.mainNavigationLabel}>
            <span
              ref={indicatorRef}
              className="nav-indicator"
              aria-hidden="true"
            />

            {routes.map((route) => {
              const badgeCount = badges[route.key] || 0;
              const label = t[route.titleKey];

              return (
                <Fragment key={route.key}>
                  {route.key === "Settings" && (
                    <div className="nav-separator" />
                  )}

                  <NavLink
                    to={route.path}
                    end={route.path === "/"}
                    className={getNavItemClassName}
                    onClick={onNavigate}
                  >
                    <Icon
                      icon={NAV_ICONS[route.key]}
                      size="md"
                      className="nav-icon"
                    />
                    <span className="nav-label">{label}</span>
                    {badgeCount > 0 && (
                      <span key={badgeCount} className="nav-badge">
                        {badgeCount}
                      </span>
                    )}
                    <span className="nav-tooltip" aria-hidden="true">
                      {badgeCount > 0 ? `${label} · ${badgeCount}` : label}
                    </span>
                  </NavLink>
                </Fragment>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
