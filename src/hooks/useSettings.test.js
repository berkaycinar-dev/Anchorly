import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../constants/settings";
import DataProvider from "../data/DataProvider";
import { getSnapshot as getStorageIssues } from "../data/local/storageStatus";
import useSettings from "./useSettings";

function renderSettings() {
  return renderHook(() => useSettings(), { wrapper: DataProvider });
}

describe("useSettings", () => {
  it("starts with the default settings on the first launch", () => {
    const { result } = renderSettings();

    expect(result.current).toMatchObject(DEFAULT_SETTINGS);
  });

  it("writes the default settings to storage on the first launch", () => {
    renderSettings();

    expect(localStorage.getItem("theme")).toBe('"gray"');
    expect(localStorage.getItem("language")).toBe('"tr"');
    expect(localStorage.getItem("fontFamily")).toBe('"Inter"');
    expect(localStorage.getItem("weekStartDay")).toBe('"monday"');
  });

  it("reads the stored settings", () => {
    localStorage.setItem("theme", JSON.stringify("blue"));
    localStorage.setItem("language", JSON.stringify("en"));
    localStorage.setItem("fontFamily", JSON.stringify("Roboto"));
    localStorage.setItem("weekStartDay", JSON.stringify("sunday"));

    const { result } = renderSettings();

    expect(result.current).toMatchObject({
      theme: "blue",
      language: "en",
      fontFamily: "Roboto",
      weekStartDay: "sunday",
    });
  });

  it("falls back to the gray theme when the stored theme is unknown", () => {
    localStorage.setItem("theme", JSON.stringify("orange"));

    const { result } = renderSettings();

    expect(result.current.theme).toBe("gray");
  });

  it.each([
    ["setTheme", "theme", "green"],
    ["setLanguage", "language", "en"],
    ["setFontFamily", "fontFamily", "Roboto"],
    ["setWeekStartDay", "weekStartDay", "sunday"],
  ])("%s changes and saves only %s", (setterName, key, value) => {
    const { result } = renderSettings();

    act(() => {
      result.current[setterName](value);
    });

    expect(result.current).toMatchObject({ ...DEFAULT_SETTINGS, [key]: value });
    expect(localStorage.getItem(key)).toBe(JSON.stringify(value));
  });

  it("keeps the same setter functions between renders", () => {
    const { result, rerender } = renderSettings();
    const firstSetTheme = result.current.setTheme;

    rerender();

    expect(result.current.setTheme).toBe(firstSetTheme);
  });

  it("uses the default and reports a read issue for a corrupt setting", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem("language", "{broken");

    const { result } = renderSettings();

    expect(result.current.language).toBe("tr");
    expect(localStorage.getItem("language:corrupt")).toBe("{broken");
    expect(getStorageIssues()).toEqual([{ key: "language", kind: "read" }]);
  });
});