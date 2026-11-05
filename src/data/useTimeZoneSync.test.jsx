import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataContext } from "./DataContext";
import useTimeZoneSync from "./useTimeZoneSync";

function setup({ stored, enabled = true, update } = {}) {
  const settings = {
    getSnapshot: () => ({ timezone: stored }),
    update: update ?? vi.fn(() => Promise.resolve()),
  };
  const context = { repositories: { settings } };
  const wrapper = ({ children }) => (
    <DataContext.Provider value={context}>{children}</DataContext.Provider>
  );

  renderHook(() => useTimeZoneSync(enabled), { wrapper });

  return settings;
}

describe("useTimeZoneSync", () => {
  it("saves the device time zone when it differs from the stored one", () => {
    const settings = setup({ stored: "UTC" });

    expect(settings.update).toHaveBeenCalledWith({
      timezone: "Europe/Istanbul",
    });
  });

  it("saves nothing when the stored time zone already matches", () => {
    const settings = setup({ stored: "Europe/Istanbul" });

    expect(settings.update).not.toHaveBeenCalled();
  });

  it("waits until it is enabled", () => {
    const settings = setup({ stored: "UTC", enabled: false });

    expect(settings.update).not.toHaveBeenCalled();
  });

  it("does not throw when saving fails", async () => {
    const update = vi.fn(() => Promise.reject(new Error("offline")));

    expect(() => setup({ stored: "UTC", update })).not.toThrow();
    await Promise.resolve();
  });
});
