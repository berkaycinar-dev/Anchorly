import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthContext } from "../../auth/AuthContext";
import { AUTH_STATUS } from "../../auth/authStatus";
import { ApiError, NETWORK_ERROR } from "../../data/api/ApiError";
import { DataContext } from "../../data/DataContext";
import { strings } from "../../strings";
import ImportPrompt from "./ImportPrompt";

const t = strings.en;
const TASK_ID = "aaaaaaaa-0000-4000-8000-000000000001";

function seedLocalData() {
  localStorage.setItem(
    "tasks",
    JSON.stringify([{ id: TASK_ID, title: "Real task", order: 0 }]),
  );
  localStorage.setItem("projects", JSON.stringify([]));
  localStorage.setItem("routines", JSON.stringify([]));
}

function importResult(overrides = {}) {
  return {
    projects: { imported: 0, skipped: 0 },
    routines: { imported: 0, skipped: 0 },
    routineChecks: { imported: 0, skipped: 0 },
    tasks: { imported: 1, skipped: 0 },
    ...overrides,
  };
}

function renderPrompt({ request = vi.fn(), client = { request } } = {}) {
  const reload = vi.fn();
  const auth = {
    status: AUTH_STATUS.signedIn,
    user: { id: "user-1" },
    api: { client },
  };
  const tree = (
    <AuthContext.Provider value={auth}>
      <DataContext.Provider value={{ reload }}>
        <ImportPrompt t={t} />
      </DataContext.Provider>
    </AuthContext.Provider>
  );
  const view = render(tree);

  return { ...view, reload, request, remount: () => view.rerender(<div />) };
}

describe("ImportPrompt", () => {
  it("asks nothing when only the demo data is on the device", () => {
    renderPrompt();

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("asks nothing when there is no API client", () => {
    seedLocalData();

    render(
      <AuthContext.Provider
        value={{
          status: AUTH_STATUS.signedIn,
          user: { id: "user-1" },
          api: {},
        }}
      >
        <ImportPrompt t={t} />
      </AuthContext.Provider>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("asks nothing while signed out even though the client exists", () => {
    seedLocalData();

    render(
      <AuthContext.Provider
        value={{
          status: AUTH_STATUS.signedOut,
          user: null,
          api: { client: { request: vi.fn() } },
        }}
      >
        <ImportPrompt t={t} />
      </AuthContext.Provider>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("asks and shows what is on the device", () => {
    seedLocalData();

    renderPrompt();

    expect(
      screen.getByRole("heading", { name: t.importDialogTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 task")).toBeInTheDocument();
    expect(screen.queryByText(/routine/)).toBeNull();
  });

  it("asks nothing again after the answer was no", async () => {
    seedLocalData();
    const user = userEvent.setup();
    const first = renderPrompt();

    await user.click(screen.getByRole("button", { name: t.importDecline }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem("importDecision:user-1")).toBe("declined");
    expect(first.request).not.toHaveBeenCalled();
    expect(localStorage.getItem("tasks")).not.toBeNull();

    first.unmount();
    renderPrompt();

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("asks again next time when the dialog was only closed", () => {
    seedLocalData();
    const first = renderPrompt();

    screen.getByRole("dialog").close();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem("importDecision:user-1")).toBeNull();

    first.unmount();
    renderPrompt();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("sends the local data, backs it up, clears it and shows the result", async () => {
    seedLocalData();
    const user = userEvent.setup();
    const request = vi.fn().mockResolvedValue(importResult());
    renderPrompt({ request });

    await user.click(screen.getByRole("button", { name: t.importConfirm }));

    expect(
      await screen.findByRole("heading", { name: t.importDoneTitle }),
    ).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith(
      "POST",
      "/import",
      expect.objectContaining({
        body: expect.objectContaining({
          tasks: [expect.objectContaining({ id: TASK_ID, title: "Real task" })],
        }),
      }),
    );
    expect(localStorage.getItem("tasks")).toBeNull();
    expect(localStorage.getItem("importDecision:user-1")).toBe("imported");
    expect(
      Object.keys(localStorage).some((key) => key.startsWith("importBackup:")),
    ).toBe(true);
  });

  it("mentions the records that were skipped", async () => {
    seedLocalData();
    const user = userEvent.setup();
    const request = vi
      .fn()
      .mockResolvedValue(importResult({ tasks: { imported: 0, skipped: 2 } }));
    renderPrompt({ request });

    await user.click(screen.getByRole("button", { name: t.importConfirm }));

    expect(await screen.findByText(t.importSkippedNote(2))).toBeInTheDocument();
  });

  it("reloads the data when the result is closed", async () => {
    seedLocalData();
    const user = userEvent.setup();
    const { reload } = renderPrompt({
      request: vi.fn().mockResolvedValue(importResult()),
    });

    await user.click(screen.getByRole("button", { name: t.importConfirm }));
    await user.click(
      await screen.findByRole("button", { name: t.importDoneAction }),
    );

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("keeps the local data and offers a retry when the import fails", async () => {
    seedLocalData();
    const user = userEvent.setup();
    const request = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({ status: 0, code: NETWORK_ERROR, message: "offline" }),
      )
      .mockResolvedValueOnce(importResult());
    renderPrompt({ request });

    await user.click(screen.getByRole("button", { name: t.importConfirm }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(localStorage.getItem("tasks")).not.toBeNull();
    expect(localStorage.getItem("importDecision:user-1")).toBeNull();

    await user.click(screen.getByRole("button", { name: t.importRetry }));

    expect(
      await screen.findByRole("heading", { name: t.importDoneTitle }),
    ).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("cannot be closed or declined while the import runs", async () => {
    seedLocalData();
    const user = userEvent.setup();
    let finish;
    const request = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = () => resolve(importResult());
        }),
    );
    renderPrompt({ request });

    await user.click(screen.getByRole("button", { name: t.importConfirm }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: t.importDecline }),
      ).toBeDisabled(),
    );
    expect(
      screen.getByRole("button", { name: t.importConfirm }),
    ).toBeDisabled();

    finish();
    expect(
      await screen.findByRole("heading", { name: t.importDoneTitle }),
    ).toBeInTheDocument();
  });

  it("says so when the local copy could not be cleared", async () => {
    seedLocalData();
    const user = userEvent.setup();
    const realSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(
      function (key, value) {
        if (String(key).startsWith("importBackup:")) {
          throw new Error("quota");
        }

        return realSetItem.call(this, key, value);
      },
    );
    renderPrompt({ request: vi.fn().mockResolvedValue(importResult()) });

    await user.click(screen.getByRole("button", { name: t.importConfirm }));

    expect(await screen.findByText(t.importKeptNote)).toBeInTheDocument();
    expect(localStorage.getItem("tasks")).not.toBeNull();
  });
});
