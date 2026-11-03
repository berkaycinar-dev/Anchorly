import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../data/api/ApiError";
import { strings } from "../../strings";
import { renderWithAuth, VERIFIED_USER } from "../../test/renderWithAuth";
import ProfileSection from "./ProfileSection";

const t = strings.en;

function renderProfile(options = {}) {
  return renderWithAuth(<ProfileSection t={t} />, options);
}

describe("ProfileSection", () => {
  it("shows the email with a verified badge", () => {
    renderProfile();

    expect(screen.getByText("dev@anchorly.local")).toBeInTheDocument();
    expect(screen.getByText(t.accountEmailVerified)).toBeInTheDocument();
    expect(screen.getByLabelText(t.accountDisplayNameLabel)).toHaveValue("Dev");
  });

  it("shows an unverified badge when the email is not verified", () => {
    renderProfile({ user: { ...VERIFIED_USER, emailVerifiedAt: null } });

    expect(screen.getByText(t.accountEmailUnverified)).toBeInTheDocument();
  });

  it("keeps save disabled until the name changes", async () => {
    const user = userEvent.setup();
    renderProfile();
    const save = screen.getByRole("button", { name: t.accountSave });

    expect(save).toBeDisabled();

    await user.type(screen.getByLabelText(t.accountDisplayNameLabel), "x");
    expect(save).toBeEnabled();

    await user.type(
      screen.getByLabelText(t.accountDisplayNameLabel),
      "{backspace}",
    );
    expect(save).toBeDisabled();
  });

  it("saves the trimmed name and updates the signed-in user", async () => {
    const user = userEvent.setup();
    const updated = { ...VERIFIED_USER, displayName: "Ada" };
    const updateMe = vi.fn().mockResolvedValue(updated);
    const { setUser } = renderProfile({ api: { updateMe } });

    const field = screen.getByLabelText(t.accountDisplayNameLabel);
    await user.clear(field);
    await user.type(field, "  Ada  ");
    await user.click(screen.getByRole("button", { name: t.accountSave }));

    expect(updateMe).toHaveBeenCalledWith({ displayName: "Ada" });
    expect(setUser).toHaveBeenCalledWith(updated);
    expect(await screen.findByText(t.accountProfileSaved)).toBeInTheDocument();
  });

  it("clears the name by sending null", async () => {
    const user = userEvent.setup();
    const updateMe = vi
      .fn()
      .mockResolvedValue({ ...VERIFIED_USER, displayName: null });
    renderProfile({ api: { updateMe } });

    await user.clear(screen.getByLabelText(t.accountDisplayNameLabel));
    await user.click(screen.getByRole("button", { name: t.accountSave }));

    expect(updateMe).toHaveBeenCalledWith({ displayName: null });
    expect(screen.getByLabelText(t.accountDisplayNameLabel)).toHaveValue("");
  });

  it("shows an alert when saving fails", async () => {
    const user = userEvent.setup();
    const updateMe = vi
      .fn()
      .mockRejectedValue(
        new ApiError({ status: 0, code: "NETWORK_ERROR", message: "x" }),
      );
    const { setUser } = renderProfile({ api: { updateMe } });

    await user.type(screen.getByLabelText(t.accountDisplayNameLabel), "x");
    await user.click(screen.getByRole("button", { name: t.accountSave }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t.authNetworkError,
    );
    expect(setUser).not.toHaveBeenCalled();
  });
});
