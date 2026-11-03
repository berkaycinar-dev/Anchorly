import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Card from "./Card";

describe("Card", () => {
  it("renders its children inside the card surface", () => {
    render(<Card data-testid="card">Content</Card>);

    const card = screen.getByTestId("card");
    expect(card).toHaveClass("ui-card");
    expect(card).toHaveTextContent("Content");
  });

  it("keeps a custom class name next to the card class", () => {
    render(
      <Card className="auth-card" data-testid="card">
        Content
      </Card>,
    );

    expect(screen.getByTestId("card")).toHaveClass("ui-card", "auth-card");
  });

  it("forwards other attributes", () => {
    render(
      <Card aria-label="Sign in" role="group">
        Content
      </Card>,
    );

    expect(screen.getByRole("group", { name: "Sign in" })).toBeInTheDocument();
  });
});
