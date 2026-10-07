import { Fragment } from "react";
import NavIcon from "./NavIcon";

function Sidebar({ activePage, setActivePage, t, badges = {} }) {
  const pages = [
    { key: "Dashboard", label: t.dashboard },
    { key: "Today", label: t.today },
    { key: "Daily Routine", label: t.dailyRoutine },
    { key: "Calendar", label: t.calendar },
    { key: "Archive", label: t.archive },
    { key: "Projects", label: t.projects },
    { key: "Settings", label: t.settings, hasSeparator: true },
  ];

  return (
    <aside className="sidebar">
      <h2>Anchorly</h2>

      <nav>
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
                  <span className="nav-badge">{badgeCount}</span>
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