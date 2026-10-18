import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, it, expect, vi } from "vitest";
import StorageToasts from "./StorageToasts";
import ToastProvider from "./toast/ToastProvider";
import { strings } from "../strings";
import {
  dismiss,
  getSnapshot,
  reportStorageError,
} from "../lib/storageStatus";

const t = strings.en;

function renderStorageToasts(translations = t) {
  const tree = (currentT) => (
    <ToastProvider closeLabel={currentT.closeButton}>
      <StorageToasts t={currentT} />
    </ToastProvider>
  );
  const view = render(tree(translations));

  return {
    ...view,
    rerenderWith: (nextT) => view.rerender(tree(nextT)),
  };
}

describe("StorageToasts", () => {
  it("renders nothing when there are no issues", () => {
    renderStorageToasts();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the quota message", () => {
    reportStorageError({ key: "tasks", kind: "quota" });

    renderStorageToasts();

    expect(screen.getByRole("alert")).toHaveTextContent(t.storageQuotaWarning);
  });

  it("shows the unavailable message", () => {
    reportStorageError({ key: "tasks", kind: "unavailable" });

    renderStorageToasts();

    expect(screen.getByRole("alert")).toHaveTextContent(
      t.storageUnavailableWarning,
    );
  });

  it("shows the read message", () => {
    reportStorageError({ key: "tasks", kind: "read" });

    renderStorageToasts();

    expect(screen.getByRole("alert")).toHaveTextContent(t.storageReadWarning);
  });

  it("shows only the most serious message when several issues exist", () => {
    reportStorageError({ key: "tasks", kind: "read" });
    reportStorageError({ key: "tasks", kind: "quota" });
    reportStorageError({ key: "projects", kind: "unavailable" });

    renderStorageToasts();

    const alerts = screen.getAllByRole("alert");

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent(t.storageUnavailableWarning);
  });

  it("appears when an issue is reported after the first render", () => {
    renderStorageToasts();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    act(() => {
      reportStorageError({ key: "tasks", kind: "quota" });
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("replaces the message when a more serious issue appears", () => {
    reportStorageError({ key: "tasks", kind: "read" });

    renderStorageToasts();

    act(() => {
      reportStorageError({ key: "tasks", kind: "unavailable" });
    });

    const alerts = screen.getAllByRole("alert");

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent(t.storageUnavailableWarning);
  });

  it("uses the translations it receives", () => {
    reportStorageError({ key: "tasks", kind: "quota" });

    renderStorageToasts(strings.tr);

    expect(screen.getByRole("alert")).toHaveTextContent(
      strings.tr.storageQuotaWarning,
    );
  });

  it("switches to the new language without duplicating the toast", () => {
    reportStorageError({ key: "tasks", kind: "quota" });

    const { rerenderWith } = renderStorageToasts();

    rerenderWith(strings.tr);

    const alerts = screen.getAllByRole("alert");

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent(strings.tr.storageQuotaWarning);
  });

  it("hides the toast and clears the issues when it is closed", async () => {
    const user = userEvent.setup();
    reportStorageError({ key: "tasks", kind: "quota" });

    renderStorageToasts();

    await user.click(screen.getByRole("button", { name: t.closeButton }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(getSnapshot()).toEqual([]);
  });

  it("removes the toast when the issues are cleared elsewhere", () => {
    reportStorageError({ key: "tasks", kind: "quota" });

    renderStorageToasts();

    act(() => {
      dismiss();
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  describe("with fake timers", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("stays on screen until it is closed", () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      reportStorageError({ key: "tasks", kind: "quota" });

      renderStorageToasts();

      act(() => {
        vi.advanceTimersByTime(600000);
      });

      expect(screen.getByRole("alert")).toHaveTextContent(
        t.storageQuotaWarning,
      );
    });
  });
});