import { strings } from "../../strings";
import Logo from "../Logo";
import Card from "../ui/Card";
import useFallbackPreferences from "./useFallbackPreferences";

function DataErrorScreen({ onRetry, onSignOut }) {
  const { language, theme, fontFamily } = useFallbackPreferences();
  const t = strings[language];

  return (
    <div
      className={`auth-shell theme-${theme}`}
      style={{ "--font-main": `'${fontFamily}', system-ui, sans-serif` }}
    >
      <main className="data-gate">
        <Logo size={48} />
        <Card className="data-gate-card" role="alert">
          <h1 className="data-gate-title">{t.dataLoadErrorTitle}</h1>
          <p className="data-gate-text">{t.dataLoadErrorBody}</p>
          <div className="data-gate-actions">
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              {t.dataRetry}
            </button>
            {onSignOut ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onSignOut}
              >
                {t.signOut}
              </button>
            ) : null}
          </div>
        </Card>
      </main>
    </div>
  );
}

export default DataErrorScreen;
