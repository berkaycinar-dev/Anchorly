import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { THEMES } from "../constants/settings";

const css = readFileSync("src/styles/tokens.css", "utf8");

const MIN_CONTRAST = 4.5;
const STATUS_NAMES = ["success", "warning", "danger"];
const CATEGORY_NAMES = [
  "work",
  "personal",
  "growth",
  "health",
  "project",
  "other",
];

function readBlock(selector) {
  const start = css.indexOf(`${selector} {`);

  if (start === -1) {
    return null;
  }

  const end = css.indexOf("}", start);
  const body = css.slice(start + selector.length + 2, end);
  const tokens = {};

  for (const match of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim();
  }

  return tokens;
}

function parseColor(value) {
  const hex = value.match(/^#([0-9a-f]{6})$/i);

  if (hex) {
    const number = parseInt(hex[1], 16);
    return {
      r: (number >> 16) & 255,
      g: (number >> 8) & 255,
      b: number & 255,
      a: 1,
    };
  }

  const rgba = value.match(
    /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*(0(?:\.\d+)?|1)\)$/,
  );

  if (rgba) {
    return {
      r: Number(rgba[1]),
      g: Number(rgba[2]),
      b: Number(rgba[3]),
      a: Number(rgba[4]),
    };
  }

  throw new Error(`Unsupported color "${value}"`);
}

function flatten(color, backdrop) {
  return {
    r: color.a * color.r + (1 - color.a) * backdrop.r,
    g: color.a * color.g + (1 - color.a) * backdrop.g,
    b: color.a * color.b + (1 - color.a) * backdrop.b,
    a: 1,
  };
}

function luminance({ r, g, b }) {
  const [red, green, blue] = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground, background) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function contrastPairs(tokens) {
  const card = parseColor(tokens["color-bg-card"]);
  const color = (name) => flatten(parseColor(tokens[name]), card);
  const pairs = [];

  for (const text of [
    "color-text-primary",
    "color-text-secondary",
    "color-text-muted",
  ]) {
    for (const surface of [
      "color-bg-card",
      "color-bg-page",
      "color-bg-subtle",
    ]) {
      pairs.push([text, surface]);
    }
  }

  pairs.push(["color-accent-contrast", "color-accent"]);
  pairs.push(["color-accent-text", "color-bg-card"]);

  for (const name of STATUS_NAMES) {
    pairs.push([`color-${name}`, `color-${name}-bg`]);
    pairs.push([`color-${name}`, "color-bg-card"]);
  }

  for (const name of CATEGORY_NAMES) {
    pairs.push([`color-category-${name}`, `color-category-${name}-bg`]);
  }

  return pairs.map(([foreground, background]) => ({
    pair: `${foreground} on ${background}`,
    ratio: contrast(color(foreground), color(background)),
  }));
}

const REQUIRED_COLOR_TOKENS = [
  "color-accent",
  "color-bg-page",
  "color-bg-card",
  "color-bg-subtle",
  "color-bg-input",
  "color-text-primary",
  "color-text-secondary",
  "color-text-muted",
  "color-border",
  "color-accent-contrast",
  "color-accent-text",
  "color-surface-raised",
  "color-accent-tint",
  ...STATUS_NAMES.flatMap((name) => [`color-${name}`, `color-${name}-bg`]),
  ...CATEGORY_NAMES.flatMap((name) => [
    `color-category-${name}`,
    `color-category-${name}-bg`,
  ]),
  "shadow-pop",
  "shadow-modal",
];

describe("theme tokens", () => {
  it.each(THEMES)("defines every color token in the %s theme", (theme) => {
    const tokens = readBlock(`.theme-${theme}`);

    expect(tokens).not.toBeNull();
    expect(Object.keys(tokens).sort()).toEqual(
      [...REQUIRED_COLOR_TOKENS].sort(),
    );
  });

  it.each(THEMES)("keeps text readable in the %s theme (WCAG AA)", (theme) => {
    const failures = contrastPairs(readBlock(`.theme-${theme}`))
      .filter(({ ratio }) => ratio < MIN_CONTRAST)
      .map(({ pair, ratio }) => `${pair}: ${ratio.toFixed(2)}`);

    expect(failures).toEqual([]);
  });

  it("uses the gray theme colors as the defaults", () => {
    const root = readBlock(":root");
    const gray = readBlock(".theme-gray");

    for (const name of REQUIRED_COLOR_TOKENS) {
      expect(root[name], name).toBe(gray[name]);
    }
  });

  it("defines the shared scale tokens once", () => {
    const root = readBlock(":root");

    for (const name of [
      "text-xs",
      "text-sm",
      "text-md",
      "text-lg",
      "text-xl",
      "text-2xl",
      "radius-sm",
      "radius-md",
      "radius-lg",
      "radius-full",
      "space-1",
      "space-4",
      "space-10",
      "duration-fast",
      "duration-base",
    ]) {
      expect(root[name], name).toBeDefined();
    }

    expect(root["radius-lg"]).toBe("14px");
    expect(root["text-md"]).toBe("15px");
  });
});
