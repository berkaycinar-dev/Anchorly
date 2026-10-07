import { Fragment, useLayoutEffect, useRef } from "react";
import NavIcon from "./NavIcon";

const INDICATOR_INSET = 11;

function Sidebar({ activePage, setActivePage, t, badges = {} }) {
  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const previousTopRef = useRef(null);

  const pages = [
    { key: "Dashboard", label: t.dashboard },
    { key: "Today", label: t.today },
    { key: "Daily Routine", label: t.dailyRoutine },
    { key: "Calendar", label: t.calendar },
    { key: "Archive", label: t.archive },
    { key: "Projects", label: t.projects },
    { key: "Settings", label: t.settings, hasSeparator: true },
  ];

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
  }, [activePage]);

  return (
    <aside className="sidebar">
      <h2>Anchorly</h2>

      <nav ref={navRef}>
        <span ref={indicatorRef} className="nav-indicator" aria-hidden="true" />

        {pages.map((page) => {
          const isActive = activePage === page.key;
          const badgeCount = badges[page.key] || 0;

          return (
            <Fragment key={page.key}>
              {page.hasSeparator && <div className="nav-separator" />}

              <button
                className={isActive ? "nav-item active-nav" : "nav-item"}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActivePage(page.key)}
              >
                <NavIcon name={page.key} />
                <span className="nav-label">{page.label}</span>
                {badgeCount > 0 && (
                  <span key={badgeCount} className="nav-badge">
                    {badgeCount}
                  </span>
                )}
              </button>
            </Fragment>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;