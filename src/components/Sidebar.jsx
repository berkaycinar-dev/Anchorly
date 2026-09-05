function Sidebar({ activePage, setActivePage, t }) {
  const pages = [
    { key: "Dashboard", label: t.dashboard },
    { key: "Today", label: t.today },
    { key: "Daily Routine", label: t.dailyRoutine },
    { key: "Calendar", label: t.calendar },
    { key: "Archive", label: t.archive },
    { key: "Projects", label: t.projects },
    { key: "Settings", label: t.settings },
  ];

  return (
    <aside className="sidebar">
      <h2>Anchorly</h2>

      <nav>
        {pages.map((page) => (
          <button
            key={page.key}
            className={activePage === page.key ? "active-nav" : ""}
            onClick={() => setActivePage(page.key)}
          >
            {page.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
