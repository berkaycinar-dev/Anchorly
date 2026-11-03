import { render, screen } from "@testing-library/react";
import { Flame } from "lucide-react";
import { describe, expect, it } from "vitest";
import Icon from "./Icon";

function renderIcon(props) {
  const { container } = render(<Icon icon={Flame} {...props} />);
  return container.querySelector("svg");
}

describe("Icon", () => {
  it("is hidden from assistive technology by default", () => {
    const svg = renderIcon();

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).not.toHaveAttribute("role");
  });

  it("is announced as an image when it has a label", () => {
    renderIcon({ label: "Streak" });

    const svg = screen.getByRole("img", { name: "Streak" });
    expect(svg).not.toHaveAttribute("aria-hidden");
  });

  it("uses the medium size and the shared stroke width by default", () => {
    const svg = renderIcon();

    expect(svg).toHaveAttribute("width", "18");
    expect(svg).toHaveAttribute("height", "18");
    expect(svg).toHaveAttribute("stroke-width", "1.75");
  });

  it.each([
    ["sm", "16"],
    ["md", "18"],
    ["lg", "20"],
  ])("renders the %s size at %spx", (size, pixels) => {
    const svg = renderIcon({ size });

    expect(svg).toHaveAttribute("width", pixels);
    expect(svg).toHaveAttribute("height", pixels);
  });

  it("keeps the given class name next to the library classes", () => {
    const svg = renderIcon({ className: "nav-icon" });

    expect(svg).toHaveClass("nav-icon");
    expect(svg).toHaveClass("lucide");
  });

  it("draws with the current text color", () => {
    const svg = renderIcon();

    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("fill", "none");
  });
});
