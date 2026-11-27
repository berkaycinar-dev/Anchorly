import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import useThemeColor from "./useThemeColor";

function Shell({ theme }) {
  useThemeColor(theme);
  return null;
}

function setup() {
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = "#f4f6fb";
  document.head.append(meta);

  const style = document.createElement("style");
  style.textContent =
    ".theme-gray { --color-bg-page: #f4f6fb; } .theme-blue { --color-bg-page: #0f172a; }";
  document.head.append(style);

  const root = document.createElement("div");
  document.body.append(root);

  return { meta, root, style };
}

describe("useThemeColor", () => {
  let cleanupNodes = [];

  afterEach(() => {
    cleanupNodes.forEach((node) => node.remove());
    cleanupNodes = [];
  });

  it("copies the theme's page colour into the theme-color meta tag", () => {
    const { meta, root, style } = setup();
    cleanupNodes.push(meta, root, style);

    root.className = "app theme-blue";
    const { rerender } = render(<Shell theme="blue" />);
    expect(meta.getAttribute("content")).toBe("#0f172a");

    root.className = "app theme-gray";
    rerender(<Shell theme="gray" />);
    expect(meta.getAttribute("content")).toBe("#f4f6fb");
  });
});
