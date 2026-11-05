import { useEffect, useId, useRef } from "react";
import describeAuthError from "../../auth/authErrors";
import { IMPORT_PHASE } from "../../data/localImport/useLocalImport";
import Alert from "../ui/Alert";
import Button from "../ui/Button";

function ImportSummary({ t, summary }) {
  const lines = [
    summary.tasks > 0 ? t.importCountTasks(summary.tasks) : null,
    summary.routines > 0 ? t.importCountRoutines(summary.routines) : null,
    summary.projects > 0 ? t.importCountProjects(summary.projects) : null,
  ].filter(Boolean);

  return (
    <ul className="import-counts">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

function ImportResult({ t, result, backedUp }) {
  const imported = {
    tasks: result.tasks.imported,
    routines: result.routines.imported,
    projects: result.projects.imported,
  };
  const skipped =
    result.tasks.skipped + result.routines.skipped + result.projects.skipped;

  return (
    <>
      <p className="account-muted">{t.importDoneBody}</p>
      <ImportSummary t={t} summary={imported} />
      {skipped > 0 ? (
        <p className="account-muted">{t.importSkippedNote(skipped)}</p>
      ) : null}
      {backedUp ? null : <p className="account-muted">{t.importKeptNote}</p>}
    </>
  );
}

function ImportDialog({ t, importer, mode, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const { phase } = importer;
  const importing = phase === IMPORT_PHASE.importing;
  const done = phase === IMPORT_PHASE.done;

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog.hasAttribute("open")) {
      dialog.showModal();
    }
  }, []);

  function handleClose() {
    if (done) {
      importer.finish();
      return;
    }

    onClose();
  }

  function handleCancel(event) {
    if (importing) {
      event.preventDefault();
    }
  }

  function handleDecline() {
    importer.decline();
    dialogRef.current.close();
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog account-dialog"
      aria-labelledby={titleId}
      onClose={handleClose}
      onCancel={handleCancel}
    >
      <div className="confirm-box account-form">
        <h3 id={titleId} className="account-section-title">
          {done ? t.importDoneTitle : t.importDialogTitle}
        </h3>
        {done ? (
          <ImportResult
            t={t}
            result={importer.result}
            backedUp={importer.backedUp}
          />
        ) : (
          <>
            <p className="account-muted">{t.importDialogBody}</p>
            <ImportSummary t={t} summary={importer.summary} />
            <p className="account-muted">{t.importDialogHint}</p>
            {phase === IMPORT_PHASE.failed ? (
              <Alert tone="danger">
                {describeAuthError(importer.error, t).alert.message}
              </Alert>
            ) : null}
          </>
        )}
        <div className="confirm-actions">
          {done ? (
            <Button onClick={() => dialogRef.current.close()}>
              {t.importDoneAction}
            </Button>
          ) : (
            <>
              {mode === "prompt" ? (
                <Button
                  variant="secondary"
                  disabled={importing}
                  onClick={handleDecline}
                >
                  {t.importDecline}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  disabled={importing}
                  onClick={() => dialogRef.current.close()}
                >
                  {t.cancelButton}
                </Button>
              )}
              <Button loading={importing} onClick={importer.run}>
                {phase === IMPORT_PHASE.failed
                  ? t.importRetry
                  : t.importConfirm}
              </Button>
            </>
          )}
        </div>
        {mode === "prompt" && !done ? (
          <p className="account-muted">{t.importDeclineHint}</p>
        ) : null}
      </div>
    </dialog>
  );
}

export default ImportDialog;
