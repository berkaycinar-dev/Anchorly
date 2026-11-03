import { render, screen } from "@testing-library/react";
import { Mail } from "lucide-react";
import { describe, expect, it } from "vitest";
import AuthStatus from "./AuthStatus";

describe("AuthStatus", () => {
  it("renders the title, the body and the actions", () => {
    render(
      <AuthStatus
        icon={Mail}
        title="Check your email"
        actions={<button type="button">Resend</button>}
      >
        We sent a link.
      </AuthStatus>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Check your email" }),
    ).toBeInTheDocument();
    expect(screen.getByText("We sent a link.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resend" })).toBeInTheDocument();
  });

  it("exposes the tone and omits an empty action row", () => {
    const { container } = render(
      <AuthStatus icon={Mail} tone="warning" title="Oops">
        Body
      </AuthStatus>,
    );

    expect(container.querySelector(".auth-status-icon")).toHaveAttribute(
      "data-tone",
      "warning",
    );
    expect(container.querySelector(".auth-status-actions")).toBeNull();
  });

  it("marks the icon as spinning while loading", () => {
    const { container } = render(
      <AuthStatus icon={Mail} spinning title="Wait">
        Body
      </AuthStatus>,
    );

    expect(container.querySelector(".auth-status-icon")).toHaveAttribute(
      "data-spinning",
      "true",
    );
  });
});
