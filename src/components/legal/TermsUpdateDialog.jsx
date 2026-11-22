import { useEffect, useId, useRef, useState } from "react";
import describeAuthError from "../../auth/authErrors";
import useAuth from "../../auth/useAuth";
import useTermsPending from "./useTermsPending";
import Alert from "../ui/Alert";
import Button from "../ui/Button";

function NewTabLink({ t, href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${children} ${t.legalOpensInNewTab}`}
    >
      {children}
    </a>
  );
}

function TermsDialog({ t, api, setUser, logout }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const bodyId = useId();
  const [pending, setPending] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog.hasAttribute("open")) {
      dialog.showModal();
    }
  }, []);

  async function handleAccept() {
    setPending("accept");
    setErrorMessage(null);

    try {
      setUser(await api.acceptTerms());
    } catch (error) {
      setErrorMessage(describeAuthError(error, t).alert.message);
      setPending(null);
    }
  }

  async function handleSignOut() {
    setPending("signOut");
    await logout();
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog account-dialog"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onCancel={(event) => event.preventDefault()}
    >
      <div className="confirm-box account-form">
        <h3 id={titleId} className="account-section-title">
          {t.termsUpdateTitle}
        </h3>
        <p id={bodyId} className="account-muted">
          {t.termsUpdateBody}
        </p>
        <p className="terms-dialog-links">
          <NewTabLink t={t} href="/terms">
            {t.legalTermsTitle}
          </NewTabLink>
          <NewTabLink t={t} href="/privacy">
            {t.legalPrivacyTitle}
          </NewTabLink>
        </p>
        {errorMessage ? <Alert tone="danger">{errorMessage}</Alert> : null}
        <div className="confirm-actions">
          <Button
            variant="secondary"
            disabled={pending !== null}
            loading={pending === "signOut"}
            onClick={handleSignOut}
          >
            {t.signOut}
          </Button>
          <Button
            disabled={pending !== null}
            loading={pending === "accept"}
            onClick={handleAccept}
          >
            {t.termsUpdateAccept}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

function TermsUpdateDialog({ t }) {
  const { api, setUser, logout } = useAuth();
  const pending = useTermsPending();

  if (!pending) {
    return null;
  }

  return <TermsDialog t={t} api={api} setUser={setUser} logout={logout} />;
}

export default TermsUpdateDialog;
