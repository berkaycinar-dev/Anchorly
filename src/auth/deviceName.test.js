import { describe, expect, it } from "vitest";
import getDeviceName from "./deviceName";

const AGENTS = {
  chromeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  edgeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
  firefoxLinux:
    "Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0",
  safariMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  chromeIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1",
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
};

describe("getDeviceName", () => {
  it("names common desktop browsers", () => {
    expect(getDeviceName(AGENTS.chromeWindows)).toBe("Chrome · Windows");
    expect(getDeviceName(AGENTS.edgeWindows)).toBe("Edge · Windows");
    expect(getDeviceName(AGENTS.firefoxLinux)).toBe("Firefox · Linux");
    expect(getDeviceName(AGENTS.safariMac)).toBe("Safari · macOS");
  });

  it("names mobile browsers by their real system", () => {
    expect(getDeviceName(AGENTS.safariIphone)).toBe("Safari · iOS");
    expect(getDeviceName(AGENTS.chromeIphone)).toBe("Chrome · iOS");
    expect(getDeviceName(AGENTS.chromeAndroid)).toBe("Chrome · Android");
  });

  it("returns null when nothing is recognised", () => {
    expect(getDeviceName("")).toBeNull();
    expect(getDeviceName("curl/8.0")).toBeNull();
  });

  it("keeps a partial name when only one part is recognised", () => {
    expect(getDeviceName("Firefox/130.0")).toBe("Firefox");
  });
});
