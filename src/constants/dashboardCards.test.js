import { describe, expect, it } from "vitest";
import {
  DASHBOARD_CARDS,
  DEFAULT_DASHBOARD_LAYOUT,
  getCardDefinition,
  getLayoutSlots,
  normalizeDashboardLayout,
} from "./dashboardCards";

const small = (id) => ({ id, size: "small" });
const wide = (id) => ({ id, size: "wide" });

describe("dashboard cards", () => {
  it("offers ten cards with a page each", () => {
    expect(DASHBOARD_CARDS).toHaveLength(10);
    expect(new Set(DASHBOARD_CARDS.map((card) => card.id)).size).toBe(10);
    DASHBOARD_CARDS.forEach((card) => {
      expect(card.path).toMatch(/^\//);
      expect(["small", "wide"]).toContain(card.size);
    });
  });

  it("starts with progress, weekly routine and a wide upcoming card", () => {
    expect(DEFAULT_DASHBOARD_LAYOUT).toEqual([
      small("todayRing"),
      small("weeklyRoutine"),
      wide("upcoming"),
    ]);
  });

  it("finds card definitions by id", () => {
    expect(getCardDefinition("projects").path).toBe("/projects");
    expect(getCardDefinition("nope")).toBeNull();
  });

  it("uses the default layout when the value is not a list", () => {
    expect(normalizeDashboardLayout(null)).toBe(DEFAULT_DASHBOARD_LAYOUT);
    expect(normalizeDashboardLayout({})).toBe(DEFAULT_DASHBOARD_LAYOUT);
  });

  it("keeps an empty layout empty", () => {
    expect(normalizeDashboardLayout([])).toEqual([]);
  });
});

describe("empty slots in the layout", () => {
  it("has no slot when small cards come in pairs", () => {
    expect(getLayoutSlots(DEFAULT_DASHBOARD_LAYOUT)).toEqual([]);
    expect(
      getLayoutSlots([small("a"), small("b"), small("c"), small("d")]),
    ).toEqual([]);
  });

  it("puts a slot before a wide card that follows a lone small card", () => {
    expect(
      getLayoutSlots([small("a"), wide("b"), small("c"), small("d")]),
    ).toEqual([1]);
  });

  it("puts a slot at the end after a lone small card", () => {
    expect(getLayoutSlots([wide("a"), small("b")])).toEqual([2]);
    expect(getLayoutSlots([small("a"), small("b"), small("c")])).toEqual([3]);
  });

  it("finds several slots", () => {
    expect(
      getLayoutSlots([
        small("a"),
        wide("b"),
        small("c"),
        wide("d"),
        small("e"),
      ]),
    ).toEqual([1, 3, 5]);
  });

  it("has no slot for wide cards only or an empty layout", () => {
    expect(getLayoutSlots([wide("a"), wide("b")])).toEqual([]);
    expect(getLayoutSlots([])).toEqual([]);
  });
});
