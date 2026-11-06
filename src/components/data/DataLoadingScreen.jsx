import { useEffect, useState } from "react";
import { strings } from "../../strings";
import Logo from "../Logo";
import useFallbackPreferences from "./useFallbackPreferences";

export const SLOW_LOADING_MS = 6000;

function DataLoadingScreen() {
  const { language, theme, fontFamily } = useFallbackPreferences();
  const [slow, setSlow] = useState(false);
  const t = strings[language];

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_LOADING_MS);

    return () => clearTimeout(timer);
  }, []);

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
        {slow ? <p className="data-gate-text">{t.dataLoadingSlow}</p> : null}
      </main>
    </div>
  );
}

export default DataLoadingScreen;
