import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";
import { runMigrations } from "./data/local/migrations";

// public/first-visit.js sets this when it sends a first-time visitor to the
// landing page. Starting the app then would write demo data to storage, and
// the visitor would never see the landing page again.
if (!window.__ANCHORLY_REDIRECTING__) {
  runMigrations();

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <BrowserRouter useTransitions={false}>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}
