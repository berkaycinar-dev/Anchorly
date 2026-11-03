import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../data/api/ApiError";
import { strings } from "../../strings";
import { renderWithAuth } from "../../test/renderWithAuth";
import PasswordSection from "./PasswordSection";

const t = strings.en;

function renderPassword({ changePassword, onChanged = vi.fn() } = {}) {
  renderWithAuth(<PasswordSection t={t} onChanged={onChanged} />, {
    api: { changePassword },
  });
  return { onChanged };
}

async function fill(user, current = "oldpassword", next = "newpassword1") {
  if (current) {
    await user.type(
      screen.getByLabelText(t.accountCurrentPasswordLabel),
      current,
    );
  }
  if (next) {
    await user.type(screen.getByLabelText(t.authNewPasswordLabel), next);
  }
  await user.click(
    screen.getByRole("button", { name: t.accountChangePassword }),
  );
}

describe("PasswordSection", () => {
  it("validates both fields before calling the API", async () => {
    const user = userEvent.setup();
    const changePassword = vi.fn();
    renderPassword({ changePassword });

    await fill(user, "", "");
    expect(screen.getAllByText(t.authPasswordRequired)).toHaveLength(2);
    expect(screen.getByLabelText(t.accountCurrentPasswordLabel)).toHaveFocus();

    await user.type(
      screen.getByLabelText(t.accountCurrentPasswordLabel),
      "oldpassword",
    );
    await user.click(
      screen.getByRole("button", { name: t.accountChangePassword }),
    );
    expect(screen.getByLabelText(t.authNewPasswordLabel)).toHaveFocus();

    await user.type(screen.getByLabelText(t.authNewPasswordLabel), "short");
    await user.click(
      screen.getByRole("button", { name: t.accountChangePassword }),
    );
    expect(screen.getByText(t.authPasswordTooShort)).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("changes the password, clears the fields and asks to refresh sessions", async () => {
    const user = userEvent.setup();
    const changePassword = vi.fn().mockResolvedValue(undefined);
    const { onChanged } = renderPassword({ changePassword });

    await fill(user);

    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: "oldpassword",
      newPassword: "newpassword1",
    });
    expect(
      await screen.findByText(t.accountPasswordChanged),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(t.accountCurrentPasswordLabel)).toHaveValue(
      "",
    );
    expect(screen.getByLabelText(t.authNewPasswordLabel)).toHaveValue("");
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it("marks a wrong current password on its field", async () => {
    const user = userEvent.setup();
    const changePassword = vi.fn().mockRejectedValue(
      new ApiError({
        status: 400,
        code: "INVALID_CURRENT_PASSWORD",
        message: "x",
      }),
    );
    const { onChanged } = renderPassword({ changePassword });

    await fill(user);

    expect(
      await screen.findByText(t.accountCurrentPasswordWrong),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(t.accountCurrentPasswordLabel)).toHaveFocus();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("locks the button after rate limiting", async () => {
    const user = userEvent.setup();
    const changePassword = vi.fn().mockRejectedValue(
      new ApiError({
        status: 429,
        code: "TOO_MANY_REQUESTS",
        message: "x",
        retryAfterSeconds: 45,
      }),
    );
    renderPassword({ changePassword });

    await fill(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t.authTooManyRequests(0, 45),
    );
    expect(screen.getByRole("button", { name: /00:45/ })).toBeDisabled();
  });
});
