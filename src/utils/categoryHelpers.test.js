import { describe, it, expect } from "vitest";
import { getCategoryLabel } from "./categoryHelpers";
import { strings } from "../strings";

describe("getCategoryLabel", () => {
  it.each([
    ["Work", "İş"],
    ["Personal", "Kişisel"],
    ["Self Development", "Kişisel Gelişim"],
    ["Other", "Diğer"],
    ["Health", "Sağlık"],
    ["Project", "Proje"],
  ])("translates %s into Turkish", (category, expected) => {
    expect(getCategoryLabel(category, strings.tr)).toBe(expected);
  });

  it.each([
    ["Work", "Work"],
    ["Self Development", "Self Development"],
    ["Health", "Health"],
    ["Project", "Project"],
  ])("keeps %s in English", (category, expected) => {
    expect(getCategoryLabel(category, strings.en)).toBe(expected);
  });

  it("returns an unknown category unchanged", () => {
    expect(getCategoryLabel("Errands", strings.tr)).toBe("Errands");
  });
});