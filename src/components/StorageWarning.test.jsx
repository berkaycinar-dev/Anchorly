import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import StorageWarning from "./StorageWarning";
import { strings } from "../strings";
import { reportStorageError } from "../lib/storageStatus";

const t = strings.en;

describe("StorageWarning", () => {
  it("renders nothing when there are no issues", () => {
    render(<StorageWarning t={t} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the quota message", () => {
    reportStorageError({ key: "tasks", kind: "quota" });

    render(<StorageWarning t={t} />);

    expect(screen.getByRole("alert")).toHaveTextContent(t.storageQuotaWarning);
  });

  it("shows the unavailable message", () => {
    reportStorageError({ key: "tasks", kind: "unavailable" });

    render(<StorageWarning t={t} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      t.storageUnavailableWarning,
    );
  });

  it("shows the read message", () => {
    reportStorageError({ key: "tasks", kind: "read" });

    render(<StorageWarning t={t} />);

    expect(screen.getByRole("alert")).toHaveTextContent(t.storageReadWarning);
  });

  it("shows only the most serious message when several issues exist", () => {
    reportStorageError({ key: "tasks", kind: "read" });
    reportStorageError({ key: "tasks", kind: "quota" });
    reportStorageError({ key: "projects", kind: "unavailable" });

    render(<StorageWarning t={t} />);

    const alert = screen.getByRole("alert");

    expect(alert).toHaveTextContent(t.storageUnavailableWarning);
    expect(alert).not.toHaveTextContent(t.storageQuotaWarning);
    expect(alert).not.toHaveTextContent(t.storageReadWarning);
  });

  it("appears when an issue is reported after the first render", () => {
    render(<StorageWarning t={t} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    act(() => {
      reportStorageError({ key: "tasks", kind: "quota" });
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("uses the translations it receives", () => {
    reportStorageError({ key: "tasks", kind: "quota" });

    render(<StorageWarning t={strings.tr} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      strings.tr.storageQuotaWarning,
    );
  });

  it("hides the warning after the close button is clicked", async () => {
    const user = userEvent.setup();
    reportStorageError({ key: "tasks", kind: "quota" });

    render(<StorageWarning t={t} />);

    await user.click(screen.getByRole("button", { name: t.closeButton }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});