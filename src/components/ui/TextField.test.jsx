import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TextField from "./TextField";

const passwordLabels = {
  showPasswordLabel: "Show password",
  hidePasswordLabel: "Hide password",
};

describe("TextField", () => {
  it("connects the label to the input", () => {
    render(<TextField label="Email" type="email" />);

    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
  });

  it("uses the given id", () => {
    render(<TextField label="Email" id="login-email" />);

    expect(screen.getByLabelText("Email")).toHaveAttribute("id", "login-email");
  });

  it("shows the optional label next to the label", () => {
    render(<TextField label="Name" optionalLabel="(optional)" />);

    expect(screen.getByText("(optional)")).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
  });

  it("renders the label action", () => {
    render(
      <TextField
        label="Password"
        labelAction={<a href="/forgot-password">Forgot password</a>}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Forgot password" }),
    ).toBeInTheDocument();
  });

  it("reports an error and describes the input by it", () => {
    render(<TextField label="Email" error="Enter a valid email." />);

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a valid email.");
  });

  it("is not marked invalid without an error", () => {
    render(<TextField label="Email" />);

    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-invalid");
  });

  it("describes the input by the hint", () => {
    render(<TextField label="Password" hint="At least 8 characters" />);

    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "At least 8 characters",
    );
  });

  it("shows the error instead of the hint", () => {
    render(
      <TextField
        label="Password"
        hint="At least 8 characters"
        error="Too short."
      />,
    );

    expect(screen.getByText("Too short.")).toBeInTheDocument();
    expect(screen.queryByText("At least 8 characters")).toBeNull();
  });

  it("marks a completed hint", () => {
    const { rerender } = render(
      <TextField label="Password" hint="At least 8 characters" />,
    );

    expect(screen.getByText("At least 8 characters")).not.toHaveAttribute(
      "data-done",
    );

    rerender(
      <TextField label="Password" hint="At least 8 characters" hintDone />,
    );

    expect(screen.getByText("At least 8 characters")).toHaveAttribute(
      "data-done",
      "true",
    );
  });

  it("toggles password visibility", async () => {
    render(<TextField label="Password" type="password" {...passwordLabels} />);

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    await userEvent.click(
      screen.getByRole("button", { name: "Show password" }),
    );

    expect(input).toHaveAttribute("type", "text");

    await userEvent.click(
      screen.getByRole("button", { name: "Hide password" }),
    );

    expect(input).toHaveAttribute("type", "password");
  });

  it("keeps the typed value when the password is revealed", async () => {
    render(<TextField label="Password" type="password" {...passwordLabels} />);

    await userEvent.type(screen.getByLabelText("Password"), "secret123");
    await userEvent.click(
      screen.getByRole("button", { name: "Show password" }),
    );

    expect(screen.getByLabelText("Password")).toHaveValue("secret123");
  });

  it("has no visibility toggle for other field types", () => {
    render(<TextField label="Email" type="email" {...passwordLabels} />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("forwards the ref and input attributes", async () => {
    const ref = createRef();
    const onChange = vi.fn();
    render(
      <TextField
        label="Email"
        ref={ref}
        autoComplete="email"
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText("Email");
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute("autocomplete", "email");

    await userEvent.type(input, "a");

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
