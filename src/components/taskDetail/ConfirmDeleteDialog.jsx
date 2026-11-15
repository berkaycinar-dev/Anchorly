import { useEffect, useId, useRef } from "react";
import { useBackdropClose } from "./useBackdropClose";

function ConfirmDeleteDialog({
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}) {
  const dialogRef = useRef(null);
  const messageId = useId();
  const backdropClose = useBackdropClose(dialogRef);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog.hasAttribute("open")) {
      dialog.showModal();
    }
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      role="alertdialog"
      aria-labelledby={messageId}
      onClose={onCancel}
      onMouseDown={backdropClose.onMouseDown}
      onClick={backdropClose.onClick}
    >
      <div className="confirm-box">
        <p id={messageId} className="confirm-message">
          {message}
        </p>

        <div className="confirm-actions">
          <button
            className="btn btn-secondary"
            onClick={() => dialogRef.current.close()}
          >
            {cancelLabel}
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default ConfirmDeleteDialog;
