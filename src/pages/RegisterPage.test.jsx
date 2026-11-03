import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AUTH_STATUS } from "../auth/authStatus";
import { ApiError } from "../data/api/ApiError";
import { strings } from "../strings";
import { getCurrentPath } from "../test/renderApp";
import { renderAuthPage } from "../test/authPageHelpers";
import RegisterPage from "./RegisterPage";

const t = strings.en;

function renderRegister(options) {
  return renderAuthPage(<RegisterPage t={t} language="en" />, {
    path: "/register",
    ...options,
  });
}

function submit(user) {
  return user.click(screen.getByRole("button", { name: t.authRegisterTitle }));
}

describe("RegisterPage", () => {
  it("renders name, email and password with the optional marker and hint", () => {
    renderRegister();

    expect(
      screen.getByRole("heading", { level: 1, name: t.authRegisterTitle }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(t.authNameLabel))).toBeVisible();
    expect(screen.getByText(t.authOptionalLabel)).toBeInTheDocument();
    expect(screen.getByText(t.authPasswordHint)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: t.signIn })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("marks the hint done once the password is long enough", async () => {
    const user = userEvent.setup();
    renderRegister();
    const hint = screen.getByText(t.authPasswordHint);

    await user.type(screen.getByLabelText(t.authPasswordLabel), "1234567");
    expect(hint).not.toHaveAttribute("data-done");

    await user.type(screen.getByLabelText(t.authPasswordLabel), "8");
    expect(hint).toHaveAttribute("data-done", "true");
  });

  it("validates email and password length before calling the API", async () => {
    const user = userEvent.setup();
    const { auth } = renderRegister();

    await user.type(screen.getByLabelText(t.authEmailLabel), "berkay@");
    await user.type(screen.getByLabelText(t.authPasswordLabel), "1234");
    await submit(user);

    expect(screen.getByText(t.authEmailInvalid)).toBeInTheDocument();
    expect(auth.register).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText(t.authEmailLabel));
    await user.type(screen.getByLabelText(t.authEmailLabel), "a@b.co");
    await submit(user);

    expect(screen.getByText(t.authPasswordTooShort)).toBeInTheDocument();
    expect(screen.getByLabelText(t.authPasswordLabel)).toHaveFocus();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it("sends the language and the trimmed name", async () => {
    const user = userEvent.setup();
    const register = vi.fn(() => new Promise(() => {}));
    renderRegister({ register });

    await user.type(
      screen.getByLabelText(new RegExp(t.authNameLabel)),
      " Ada ",
    );
    await user.type(screen.getByLabelText(t.authEmailLabel), "ada@b.co");
    await user.type(screen.getByLabelText(t.authPasswordLabel), "password1");
    await submit(user);

    expect(register).toHaveBeenCalledWith({
      email: "ada@b.co",
      password: "password1",
      language: "en",
      displayName: "Ada",
    });
  });

  it("sends the derived device name", async () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    );
    const user = userEvent.setup();
    const register = vi.fn(() => new Promise(() => {}));
    renderRegister({ register });

    await user.type(screen.getByLabelText(t.authEmailLabel), "ada@b.co");
    await user.type(screen.getByLabelText(t.authPasswordLabel), "password1");
    await submit(user);

    expect(register).toHaveBeenCalledWith({
      email: "ada@b.co",
      password: "password1",
      language: "en",
      deviceName: "Chrome · Windows",
    });
    vi.restoreAllMocks();
  });

  it("omits the display name when it is left empty", async () => {
    const user = userEvent.setup();
    const register = vi.fn(() => new Promise(() => {}));
    renderRegister({ register });

    await user.type(screen.getByLabelText(t.authEmailLabel), "ada@b.co");
    await user.type(screen.getByLabelText(t.authPasswordLabel), "password1");
    await submit(user);

    expect(register.mock.calls[0][0]).toEqual({
      email: "ada@b.co",
      password: "password1",
      language: "en",
    });
  });

  it("explains a taken email and links to sign in", async () => {
    const user = userEvent.setup();
    const register = vi
      .fn()
      .mockRejectedValue(
        new ApiError({ status: 409, code: "EMAIL_TAKEN", message: "x" }),
      );
    renderRegister({ register, path: "/register?next=%2Ftoday" });

    await user.type(screen.getByLabelText(t.authEmailLabel), "ada@b.co");
    await user.type(screen.getByLabelText(t.authPasswordLabel), "password1");
    await submit(user);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(t.authEmailTaken);
    expect(
      alert.querySelector(`a[href="/login?next=%2Ftoday"]`),
    ).not.toBeNull();
    expect(alert.querySelector('a[href="/forgot-password"]')).not.toBeNull();
  });

  it("maps server validation details onto fields", async () => {
    const user = userEvent.setup();
    const register = vi.fn().mockRejectedValue(
      new ApiError({
        status: 400,
        code: "VALIDATION_ERROR",
        message: "x",
        details: [{ path: "body.email", message: "bad" }],
      }),
    );
    renderRegister({ register });

    await user.type(screen.getByLabelText(t.authEmailLabel), "ada@b.co");
    await user.type(screen.getByLabelText(t.authPasswordLabel), "password1");
    await submit(user);

    expect(await screen.findByText(t.authEmailInvalid)).toBeInTheDocument();
    expect(screen.getByLabelText(t.authEmailLabel)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("redirects signed-in users to the panel", () => {
    renderRegister({ status: AUTH_STATUS.signedIn });

    expect(getCurrentPath()).toBe("/");
  });
});
