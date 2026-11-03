import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Alert from "./Alert";

describe("Alert", () => {
  it("announces danger alerts assertively", () => {
    render(<Alert tone="danger">Wrong email or password.</Alert>);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Wrong email or password.");
    expect(alert).toHaveClass("alert", "alert-danger");
  });

  it.each(["success", "warning", "info"])(
    "announces %s alerts politely",
    (tone) => {
      render(<Alert tone={tone}>Message</Alert>);

      expect(screen.getByRole("status")).toHaveClass(`alert-${tone}`);
      expect(screen.queryByRole("alert")).toBeNull();
    },
  );

  it("is an informational status by default", () => {
    render(<Alert>Message</Alert>);

    expect(screen.getByRole("status")).toHaveClass("alert-info");
  });

  it("renders the actions below the message", () => {
    render(
      <Alert
        tone="danger"
        actions={
          <>
            <a href="/login">Sign in</a>
            <a href="/forgot-password">Forgot password</a>
          </>
        }
      >
        This email is already registered.
      </Alert>,
    );

    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Forgot password" }),
    ).toBeInTheDocument();
  });

  it("renders no actions area without actions", () => {
    const { container } = render(<Alert>Message</Alert>);

    expect(container.querySelector(".alert-actions")).toBeNull();
  });

  it("hides the icon from assistive technology", () => {
    const { container } = render(<Alert tone="success">Done</Alert>);

    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("keeps a custom class name", () => {
    render(<Alert className="auth-alert">Message</Alert>);

    expect(screen.getByRole("status")).toHaveClass("alert", "auth-alert");
  });
});
