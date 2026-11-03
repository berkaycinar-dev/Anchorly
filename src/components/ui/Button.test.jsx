import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Button from "./Button";

describe("Button", () => {
  it("renders a non-submitting primary button by default", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("btn", "btn-primary");
    expect(button).not.toHaveClass("btn-lg", "btn-block", "btn-loading");
  });

  it("applies the variant, size and block classes", () => {
    render(
      <Button variant="secondary" size="lg" block>
        Cancel
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass(
      "btn-secondary",
      "btn-lg",
      "btn-block",
    );
  });

  it("keeps a custom class name next to the built-in classes", () => {
    render(<Button className="auth-submit">Go</Button>);

    expect(screen.getByRole("button", { name: "Go" })).toHaveClass(
      "btn",
      "auth-submit",
    );
  });

  it("can be a submit button", () => {
    render(<Button type="submit">Send</Button>);

    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("calls the click handler", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Click" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call the click handler when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Click
      </Button>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Click" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("is disabled and busy while loading", async () => {
    const onClick = vi.fn();
    const { container } = render(
      <Button loading onClick={onClick}>
        Sign in
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Sign in" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveClass("btn-loading");
    expect(container.querySelector(".btn-spinner")).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    await userEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows no spinner and is not busy when idle", () => {
    const { container } = render(<Button>Sign in</Button>);

    expect(container.querySelector(".btn-spinner")).toBeNull();
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-busy");
  });

  it("forwards other attributes to the button element", () => {
    render(<Button aria-label="Close dialog">x</Button>);

    expect(
      screen.getByRole("button", { name: "Close dialog" }),
    ).toBeInTheDocument();
  });
});
