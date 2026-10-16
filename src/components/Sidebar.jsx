import { Fragment, useLayoutEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router";
import NavIcon from "./NavIcon";
import { routes } from "../routes";

const INDICATOR_INSET = 11;

function getNavItemClassName({ isActive }) {
  return isActive ? "nav-item active-nav" : "nav-item";
}

function Sidebar({ t, badges = {} }) {
  const { pathname } = useLocation();
  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const previousTopRef = useRef(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    const activeItem = nav.querySelector(".active-nav");

    if (!activeItem) {
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
  }, [pathname]);

  return (
    <aside className="sidebar">
      <h2>Anchorly</h2>

      <nav ref={navRef}>
        <span ref={indicatorRef} className="nav-indicator" aria-hidden="true" />

        {routes.map((route) => {
          const badgeCount = badges[route.key] || 0;

          return (
            <Fragment key={route.key}>
              {route.key === "Settings" && <div className="nav-separator" />}

              <NavLink
                to={route.path}
                end={route.path === "/"}
                className={getNavItemClassName}
              >
                <NavIcon name={route.key} />
                <span className="nav-label">{t[route.titleKey]}</span>
                {badgeCount > 0 && (
                  <span key={badgeCount} className="nav-badge">
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            </Fragment>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;