function Header({ theme, setTheme }) {
  const themes = ["light", "dark", "ocean"];

  const cycleTheme = () => {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <header className="header">
      <div></div>

      <button onClick={cycleTheme}>Tema: {theme}</button>
    </header>
  );
}

export default Header;