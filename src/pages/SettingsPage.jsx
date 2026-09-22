export default function SettingsPage({
  t,
  theme,
  setTheme,
  language,
  setLanguage,
  fontFamily,
  setFontFamily,
}) {
  return (
    <section className="settings-page">
      <div className="dashboard-welcome">
        <h2>{t.settingsTitle}</h2>
        <p>{t.settingsDescription}</p>
      </div>

      <div className="settings-section">
        <h3>{t.themeLabel}</h3>

        <div className="theme-options">
          
            {["gray", "purple", "blue", "red", "green", "pink"].map((themeOption) => (

            <button
              key={themeOption}
              className={
                theme === themeOption
                  ? "theme-option active-theme"
                  : "theme-option"
              }
              onClick={() => setTheme(themeOption)}
            >
              {themeOption}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3>{t.languageLabel}</h3>

        <div className="theme-options">
          {["tr", "en"].map((languageOption) => (
            <button
              key={languageOption}
              className={
                language === languageOption
                  ? "theme-option active-theme"
                  : "theme-option"
              }
              onClick={() => setLanguage(languageOption)}
            >
              {languageOption.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3>Font</h3>

        <div className="theme-options">
          {["Inter", "Poppins", "Manrope"].map((fontOption) => (
            <button
              key={fontOption}
              className={
                fontFamily === fontOption
                  ? "theme-option active-theme"
                  : "theme-option"
              }
              style={{ fontFamily: `'${fontOption}', sans-serif` }}
              onClick={() => setFontFamily(fontOption)}
            >
              {fontOption}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
