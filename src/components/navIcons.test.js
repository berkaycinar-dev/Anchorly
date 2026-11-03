import { describe, expect, it } from "vitest";
import { routes } from "../routes";
import { NAV_ICONS } from "./navIcons";

describe("NAV_ICONS", () => {
  it("has an icon for every route and for the more menu", () => {
    const keys = [...routes.map((route) => route.key), "More"];

    for (const key of keys) {
      expect(NAV_ICONS[key], key).toBeDefined();
    }

    expect(Object.keys(NAV_ICONS).sort()).toEqual([...keys].sort());
  });

  it("uses a different icon for every entry", () => {
    const icons = Object.values(NAV_ICONS);

    expect(new Set(icons).size).toBe(icons.length);
  });
});
