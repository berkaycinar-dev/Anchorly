import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../data/api/ApiError";
import { strings } from "../../strings";
import { renderWithAuth } from "../../test/renderWithAuth";
import { getCurrentPath } from "../../test/renderApp";
import DeleteAccountSection from "./DeleteAccountSection";

const t = strings.en;

async function openDialog(user) {
  await user.click(screen.getByRole("button", { name: t.accountDelete }));
  return screen.findByRole("dialog");
}

describe("DeleteAccountSection", () => {
  it("states that local data stays on the device", () => {
    renderWithAuth(<DeleteAccountSection t={t} />);

    expect(screen.getByText(t.accountDeleteDescription)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens a modal that needs the password before confirming", async () => {
    const user = userEvent.setup();
    renderWithAuth(<DeleteAccountSection t={t} />);

    const dialog = await openDialog(user);

    expect(dialog).toHaveAttribute("open");
    expect(
      screen.getByRole("heading", { name: t.accountDeleteDialogTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t.accountDeleteConfirm }),
    ).toBeDisabled();

    await user.type(screen.getByLabelText(t.authPasswordLabel), "secret123");
    expect(
      screen.getByRole("button", { name: t.accountDeleteConfirm }),
    ).toBeEnabled();
  });

  it("cancels without calling the API", async () => {
    const user = userEvent.setup();
    const deleteAccount = vi.fn();
    renderWithAuth(<DeleteAccountSection t={t} />, { api: { deleteAccount } });

    await openDialog(user);
    await user.click(screen.getByRole("button", { name: t.cancelButton }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(deleteAccount).not.toHaveBeenCalled();
  });

  it("deletes the account, ends the session and goes home", async () => {
    const user = userEvent.setup();
    const deleteAccount = vi.fn().mockResolvedValue(undefined);
    const { endSession } = renderWithAuth(<DeleteAccountSection t={t} />, {
      api: { deleteAccount },
    });

    await openDialog(user);
    await user.type(screen.getByLabelText(t.authPasswordLabel), "secret123");
    await user.click(
      screen.getByRole("button", { name: t.accountDeleteConfirm }),
    );

    expect(deleteAccount).toHaveBeenCalledWith("secret123");
    await waitFor(() => {
      expect(getCurrentPath()).toBe("/");
    });
    expect(endSession).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(t.accountDeleted)).toBeInTheDocument();
  });

  it("marks a wrong password and keeps the account", async () => {
    const user = userEvent.setup();
    const deleteAccount = vi.fn().mockRejectedValue(
      new ApiError({
        status: 400,
        code: "INVALID_CURRENT_PASSWORD",
        message: "x",
      }),
    );
    const { endSession } = renderWithAuth(<DeleteAccountSection t={t} />, {
      api: { deleteAccount },
    });

    await openDialog(user);
    await user.type(screen.getByLabelText(t.authPasswordLabel), "wrong");
    await user.click(
      screen.getByRole("button", { name: t.accountDeleteConfirm }),
    );

    expect(
      await screen.findByText(t.accountCurrentPasswordWrong),
    ).toBeInTheDocument();
    expect(endSession).not.toHaveBeenCalled();
    expect(getCurrentPath()).toBe("/account");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows an alert for other failures", async () => {
    const user = userEvent.setup();
    const deleteAccount = vi
      .fn()
      .mockRejectedValue(
        new ApiError({ status: 0, code: "NETWORK_ERROR", message: "x" }),
      );
    renderWithAuth(<DeleteAccountSection t={t} />, { api: { deleteAccount } });

    await openDialog(user);
    await user.type(screen.getByLabelText(t.authPasswordLabel), "secret123");
    await user.click(
      screen.getByRole("button", { name: t.accountDeleteConfirm }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t.authNetworkError,
    );
  });
});
