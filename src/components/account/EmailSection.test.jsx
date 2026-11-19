import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../data/api/ApiError";
import { strings } from "../../strings";
import { renderWithAuth, VERIFIED_USER } from "../../test/renderWithAuth";
import EmailSection from "./EmailSection";

const t = strings.en;

function renderEmail({ requestEmailChange } = {}) {
  renderWithAuth(<EmailSection t={t} />, { api: { requestEmailChange } });
}

async function fill(user, email = "new@example.com", password = "devpassword") {
  if (email) {
    await user.type(screen.getByLabelText(t.accountNewEmailLabel), email);
  }
  if (password) {
    await user.type(
      screen.getByLabelText(t.accountCurrentPasswordLabel),
      password,
    );
  }
  await user.click(
    screen.getByRole("button", { name: t.accountSendEmailLink }),
  );
}

function rejectWith(code, extra = {}) {
  return vi
    .fn()
    .mockRejectedValue(
      new ApiError({ status: 400, code, message: "x", ...extra }),
    );
}

describe("EmailSection", () => {
  it("shows the current address in the description", () => {
    renderEmail();

    expect(
      screen.getByRole("region", { name: t.accountEmailTitle }),
    ).toHaveTextContent(t.accountEmailNote(VERIFIED_USER.email));
  });

  it("checks both fields before calling the API", async () => {
    const user = userEvent.setup();
    const requestEmailChange = vi.fn();
    renderEmail({ requestEmailChange });

    await fill(user, "not-an-email", "");

    expect(screen.getByText(t.authEmailInvalid)).toBeInTheDocument();
    expect(screen.getByText(t.authPasswordRequired)).toBeInTheDocument();
    expect(screen.getByLabelText(t.accountNewEmailLabel)).toHaveFocus();
    expect(requestEmailChange).not.toHaveBeenCalled();
  });

  it("sends the link, clears the form and says where it went", async () => {
    const user = userEvent.setup();
    const requestEmailChange = vi.fn().mockResolvedValue("new@example.com");
    renderEmail({ requestEmailChange });

    await fill(user, "  new@example.com ");

    expect(requestEmailChange).toHaveBeenCalledWith({
      newEmail: "new@example.com",
      password: "devpassword",
    });
    expect(
      await screen.findByText(t.accountEmailLinkSent("new@example.com")),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(t.accountNewEmailLabel)).toHaveValue("");
    expect(screen.getByLabelText(t.accountCurrentPasswordLabel)).toHaveValue(
      "",
    );
  });

  it("marks a wrong password on the password field", async () => {
    const user = userEvent.setup();
    renderEmail({ requestEmailChange: rejectWith("INVALID_CURRENT_PASSWORD") });

    await fill(user);

    expect(
      await screen.findByText(t.accountCurrentPasswordWrong),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(t.accountCurrentPasswordLabel)).toHaveFocus();
  });

  it("marks the current address on the email field", async () => {
    const user = userEvent.setup();
    renderEmail({ requestEmailChange: rejectWith("EMAIL_UNCHANGED") });

    await fill(user);

    expect(
      await screen.findByText(t.accountEmailUnchanged),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(t.accountNewEmailLabel)).toHaveFocus();
  });

  it("marks a taken address on the email field without offering to sign in", async () => {
    const user = userEvent.setup();
    renderEmail({
      requestEmailChange: rejectWith("EMAIL_TAKEN", { status: 409 }),
    });

    await fill(user);

    expect(await screen.findByText(t.accountEmailTaken)).toBeInTheDocument();
    expect(screen.queryByText(t.authEmailTaken)).not.toBeInTheDocument();
  });

  it("says when the email could not be sent", async () => {
    const user = userEvent.setup();
    renderEmail({
      requestEmailChange: rejectWith("EMAIL_NOT_SENT", { status: 503 }),
    });

    await fill(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t.accountEmailNotSent,
    );
  });

  it("locks the button after rate limiting", async () => {
    const user = userEvent.setup();
    renderEmail({
      requestEmailChange: rejectWith("TOO_MANY_REQUESTS", {
        status: 429,
        retryAfterSeconds: 90,
      }),
    });

    await fill(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t.authTooManyRequests(1, 30),
    );
    expect(screen.getByRole("button", { name: /01:30/ })).toBeDisabled();
  });
});
