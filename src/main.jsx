import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.jsx";
import { runMigrations } from "./data/local/migrations";

runMigrations();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter useTransitions={false}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
