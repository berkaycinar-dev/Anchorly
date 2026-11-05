import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataContext } from "../../data/DataContext";
import { strings } from "../../strings";
import SyncStatusBar, { SYNCED_MESSAGE_MS } from "./SyncStatusBar";

const t = strings.en;

function createOutboxStub(initial) {
  let snapshot = initial;
  const listeners = new Set();

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    set(next) {
      snapshot = next;
      listeners.forEach((listener) => listener());
    },
  };
}

function renderBar(outbox) {
  return render(
    <DataContext.Provider value={{ outbox }}>
      <SyncStatusBar t={t} />
    </DataContext.Provider>,
  );
}

describe("SyncStatusBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows nothing while everything is in sync", () => {
    renderBar(createOutboxStub({ pending: 0, offline: false }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows nothing without an outbox, as with local data", () => {
    renderBar(null);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("says how many changes wait while offline", () => {
    renderBar(createOutboxStub({ pending: 3, offline: true }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "You are offline. 3 changes will be sent when you are back online.",
    );
  });

  it("uses the singular for one change", () => {
    renderBar(createOutboxStub({ pending: 1, offline: true }));

    expect(screen.getByRole("status")).toHaveTextContent("1 change will be");
  });

  it("says changes are being sent while online", () => {
    renderBar(createOutboxStub({ pending: 2, offline: false }));

    expect(screen.getByRole("status")).toHaveTextContent("Sending 2 changes…");
  });

  it("says it is offline even when nothing waits", () => {
    renderBar(createOutboxStub({ pending: 0, offline: true }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "You are offline. Changes will be sent when you are back online.",
    );
  });

  it("follows the outbox when the numbers change", () => {
    const outbox = createOutboxStub({ pending: 1, offline: true });
    renderBar(outbox);

    act(() => outbox.set({ pending: 2, offline: true }));

    expect(screen.getByRole("status")).toHaveTextContent("2 changes");
  });

  it("shows a short confirmation after the last change was sent, then hides it", () => {
    const outbox = createOutboxStub({ pending: 2, offline: false });
    renderBar(outbox);

    act(() => outbox.set({ pending: 0, offline: false }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "All changes are synced.",
    );

    act(() => vi.advanceTimersByTime(SYNCED_MESSAGE_MS));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("hides the confirmation when new changes start waiting", () => {
    const outbox = createOutboxStub({ pending: 1, offline: false });
    renderBar(outbox);

    act(() => outbox.set({ pending: 0, offline: false }));
    act(() => outbox.set({ pending: 1, offline: true }));

    expect(screen.getByRole("status")).not.toHaveTextContent("synced");
  });

  it("shows no confirmation when nothing was ever waiting", () => {
    const outbox = createOutboxStub({ pending: 0, offline: false });
    renderBar(outbox);

    act(() => outbox.set({ pending: 0, offline: false }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
