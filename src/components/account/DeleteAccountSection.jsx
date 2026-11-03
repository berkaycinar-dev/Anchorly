import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";
import describeAuthError from "../../auth/authErrors";
import useAuth from "../../auth/useAuth";
import { useToast } from "../toast/useToast";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import AccountSection from "./AccountSection";

function DeleteAccountDialog({ t, onCancel }) {
  const { api, endSession } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const dialogRef = useRef(null);
  const titleId = useId();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog.hasAttribute("open")) {
      dialog.showModal();
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (deleting || password === "") {
      return;
    }

    setDeleting(true);
    setError("");
    setAlert(null);

    try {
      await api.deleteAccount(password);
      navigate("/", { replace: true });
      endSession();
      toast.success(t.accountDeleted);
    } catch (caught) {
      if (caught?.code === "INVALID_CURRENT_PASSWORD") {
        setError(t.accountCurrentPasswordWrong);
      } else {
        setAlert(describeAuthError(caught, t).alert);
      }

      setDeleting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog account-dialog"
      aria-labelledby={titleId}
      onClose={onCancel}
    >
      <form
        className="confirm-box account-form"
        noValidate
        onSubmit={handleSubmit}
      >
        <h3 id={titleId} className="account-section-title">
          {t.accountDeleteDialogTitle}
        </h3>
        <p className="account-muted">{t.accountDeleteDialogBody}</p>
        {alert ? <Alert tone={alert.tone}>{alert.message}</Alert> : null}
        <TextField
          label={t.authPasswordLabel}
          type="password"
          name="password"
          autoComplete="current-password"
          showPasswordLabel={t.authShowPassword}
          hidePasswordLabel={t.authHidePassword}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError("");
          }}
          error={error}
        />
        <div className="confirm-actions">
          <Button
            variant="secondary"
            disabled={deleting}
            onClick={() => dialogRef.current.close()}
          >
            {t.cancelButton}
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={deleting}
            disabled={password === ""}
          >
            {t.accountDeleteConfirm}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

function DeleteAccountSection({ t }) {
  const [open, setOpen] = useState(false);

  return (
    <AccountSection
      title={t.accountDangerTitle}
      description={t.accountDeleteDescription}
      tone="danger"
    >
      <div className="account-actions">
        <Button variant="danger" onClick={() => setOpen(true)}>
          {t.accountDelete}
        </Button>
      </div>
      {open ? (
        <DeleteAccountDialog t={t} onCancel={() => setOpen(false)} />
      ) : null}
    </AccountSection>
  );
}

export default DeleteAccountSection;
