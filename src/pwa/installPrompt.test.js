import { describe, expect, it, vi } from "vitest";
import { createInstallPromptStore, INSTALL_STATUS } from "./installPrompt";

function fakeWindow({
  standalone = false,
  userAgent = "Chrome",
  platform = "Win32",
  maxTouchPoints = 0,
} = {}) {
  const target = new EventTarget();
  return {
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
    matchMedia: () => ({ matches: standalone }),
    navigator: { userAgent, platform, maxTouchPoints },
  };
}

function promptEvent(outcome = "accepted") {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  event.prompt = vi.fn(() => Promise.resolve());
  event.userChoice = Promise.resolve({ outcome });
  return event;
}

describe("createInstallPromptStore", () => {
  it("starts unavailable and becomes available when the browser offers a prompt", () => {
    const win = fakeWindow();
    const store = createInstallPromptStore(win);
    const listener = vi.fn();
    store.subscribe(listener);

    expect(store.getStatus()).toBe(INSTALL_STATUS.unavailable);

    const event = promptEvent();
    win.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(store.getStatus()).toBe(INSTALL_STATUS.available);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("shows the prompt once and reports installed when accepted", async () => {
    const win = fakeWindow();
    const store = createInstallPromptStore(win);
    const event = promptEvent("accepted");
    win.dispatchEvent(event);

    await expect(store.install()).resolves.toBe("accepted");
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(store.getStatus()).toBe(INSTALL_STATUS.installed);

    // The same prompt cannot be shown twice.
    await expect(store.install()).resolves.toBe("unavailable");
  });

  it("drops the used prompt when the person dismisses it", async () => {
    const win = fakeWindow();
    const store = createInstallPromptStore(win);
    win.dispatchEvent(promptEvent("dismissed"));

    await expect(store.install()).resolves.toBe("dismissed");
    expect(store.getStatus()).toBe(INSTALL_STATUS.unavailable);
  });

  it("reports installed when running standalone or after appinstalled", () => {
    expect(
      createInstallPromptStore(fakeWindow({ standalone: true })).getStatus(),
    ).toBe(INSTALL_STATUS.installed);

    const win = fakeWindow();
    const store = createInstallPromptStore(win);
    win.dispatchEvent(promptEvent());
    win.dispatchEvent(new Event("appinstalled"));
    expect(store.getStatus()).toBe(INSTALL_STATUS.installed);
  });

  it("recognises iPhone and iPadOS", () => {
    expect(
      createInstallPromptStore(
        fakeWindow({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)" }),
      ).getStatus(),
    ).toBe(INSTALL_STATUS.ios);
    expect(
      createInstallPromptStore(
        fakeWindow({
          userAgent: "Macintosh",
          platform: "MacIntel",
          maxTouchPoints: 5,
        }),
      ).getStatus(),
    ).toBe(INSTALL_STATUS.ios);
  });
});
