import { strings } from "../../strings";
import Logo from "../Logo";
import useFallbackPreferences from "./useFallbackPreferences";

function DataLoadingScreen() {
  const { language, theme, fontFamily } = useFallbackPreferences();
  const t = strings[language];

  return (
    <div
      className={`auth-shell theme-${theme}`}
      style={{ "--font-main": `'${fontFamily}', system-ui, sans-serif` }}
    >
      <main className="data-gate" role="status" aria-live="polite">
        <div className="data-gate-logo">
          <Logo size={56} />
        </div>
        <p className="data-gate-text">{t.dataLoading}</p>
      </main>
    </div>
  );
}

export default DataLoadingScreen;
