import { useCallback, useEffect, useMemo, useState } from "react";
import { createId } from "../../lib/id";
import { ToastContext } from "./ToastContext";

const TOAST_DURATION_MS = 5000;
const MAX_VISIBLE_TOASTS = 3;

function ToastItem({ toast, closeLabel, onDismiss }) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const isPaused = isHovered || hasFocus;

  useEffect(() => {
    if (isPaused) {
      return undefined;
    }

    const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS);

    return () => clearTimeout(timer);
  }, [isPaused, toast.id, onDismiss]);

  return (
    <div
      className={`toast toast-${toast.kind}`}
      role={toast.kind === "error" ? "alert" : "status"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setHasFocus(true)}
      onBlur={() => setHasFocus(false)}
    >
      <p className="toast-message">{toast.message}</p>
      <button
        type="button"
        className="toast-close"
        aria-label={closeLabel}
        onClick={() => onDismiss(toast.id)}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}

function ToastProvider({ children, closeLabel }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((kind, message) => {
    const id = createId();

    setToasts((current) =>
      [...current, { id, kind, message }].slice(-MAX_VISIBLE_TOASTS),
    );

    return id;
  }, []);

  const api = useMemo(
    () => ({
      info: (message) => show("info", message),
      success: (message) => show("success", message),
      error: (message) => show("error", message),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            closeLabel={closeLabel}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;