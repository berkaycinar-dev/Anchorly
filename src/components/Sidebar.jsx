function Sidebar({activePage, setActivePage}) {
  return (
    <aside className="sidebar">
      <h2>Anchorly</h2>

      <nav>
        {["Dashboard","Today", "Daily Routine", "Calendar", "Archive", "Projects", "Settings"].map(
        (page) => (
          <button
           key={page}
           className={activePage === page ? "active-nav" : ""}
           onClick= {() => setActivePage(page)}
          >
            {page}
          </button>
        )
      )}
      </nav>
    </aside>
  );
}

export default Sidebar;
