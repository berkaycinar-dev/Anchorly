import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createId } from "../../lib/id";
import { ToastContext } from "./ToastContext";

const TOAST_DURATION_MS = 5000;
const MAX_VISIBLE_TOASTS = 3;

function limitToasts(list) {
  let result = list;

  while (result.length > MAX_VISIBLE_TOASTS) {
    const regularIndex = result.findIndex((toast) => !toast.persistent);
    const removeIndex = regularIndex === -1 ? 0 : regularIndex;

    result = result.filter((_, index) => index !== removeIndex);
  }

  return result;
}

function ToastItem({ toast, closeLabel, onDismiss, onUserClose }) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const isPaused = isHovered || hasFocus;

  useEffect(() => {
    if (isPaused || toast.persistent) {
      return undefined;
    }

    const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS);

    return () => clearTimeout(timer);
  }, [isPaused, toast.id, toast.persistent, onDismiss]);

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
        onClick={() => onUserClose(toast)}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}

function ToastProvider({ children, closeLabel }) {
  const [toasts, setToasts] = useState([]);
  const [host, setHost] = useState(null);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const userClose = useCallback(
    (toast) => {
      dismiss(toast.id);
      toast.onClose?.();
    },
    [dismiss],
  );

  const show = useCallback((kind, message, options = {}) => {
    const id = createId();
    const { persistent = false, onClose } = options;

    setToasts((current) =>
      limitToasts([...current, { id, kind, message, persistent, onClose }]),
    );

    return id;
  }, []);

  const api = useMemo(
    () => ({
      info: (message, options) => show("info", message, options),
      success: (message, options) => show("success", message, options),
      error: (message, options) => show("error", message, options),
      dismiss,
      setHost,
    }),
    [show, dismiss],
  );

  const region = (
    <div className="toast-region">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          closeLabel={closeLabel}
          onDismiss={dismiss}
          onUserClose={userClose}
        />
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {host ? createPortal(region, host) : region}
    </ToastContext.Provider>
  );
}

export default ToastProvider;