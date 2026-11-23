import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { JSDOM, VirtualConsole } from "jsdom";
import { describe, expect, it } from "vitest";

// Vitest runs from the project root.
const SCRIPT = readFileSync(
  resolve(process.cwd(), "public/first-visit.js"),
  "utf8",
);

// Loads public/first-visit.js in a fresh window at the given URL.
function visit(url, { storage = {}, languages = ["tr-TR"] } = {}) {
  const virtualConsole = new VirtualConsole();
  const errors = [];
  // jsdom does not implement navigation; record it instead of failing.
  virtualConsole.on("jsdomError", (error) => errors.push(error.message));

  const dom = new JSDOM("<!doctype html><html><head></head></html>", {
    url,
    runScripts: "outside-only",
    virtualConsole,
  });
  const { window } = dom;

  Object.entries(storage).forEach(([key, value]) =>
    window.localStorage.setItem(key, value),
  );
  Object.defineProperty(window.navigator, "languages", { value: languages });

  window.eval(SCRIPT);

  return { window, errors };
}

function memoryStorage(entries = {}) {
  const map = new Map(Object.entries(entries));
  return { getItem: (key) => (map.has(key) ? map.get(key) : null) };
}

describe("first-visit decide", () => {
  const { window } = visit("https://anchorly.test/today");
  const { decide } = window.__anchorlyFirstVisit;

  it("sends a new visitor on the root to the Turkish landing page", () => {
    expect(
      decide({
        pathname: "/",
        search: "",
        storage: memoryStorage(),
        languages: ["tr-TR", "en"],
      }),
    ).toEqual({ action: "redirect", to: "/welcome/" });
  });

  it("sends a new visitor with a non-Turkish browser to the English page", () => {
    expect(
      decide({
        pathname: "/",
        search: "",
        storage: memoryStorage(),
        languages: ["de-DE", "tr"],
      }),
    ).toEqual({ action: "redirect", to: "/welcome/en/" });
  });

  it.each([
    ["has started before", { anchorlyStarted: "1" }],
    ["is signed in", { authSessionHint: "1" }],
    ["has guest data", { tasks: "[]" }],
  ])("opens the app for someone who %s", (_label, entries) => {
    expect(
      decide({
        pathname: "/",
        search: "",
        storage: memoryStorage(entries),
        languages: ["tr"],
      }).action,
    ).toBe("enter");
  });

  it.each(["/today", "/login", "/reset-password", "/privacy"])(
    "never redirects a deep link like %s",
    (pathname) => {
      expect(
        decide({
          pathname,
          search: "",
          storage: memoryStorage(),
          languages: ["tr"],
        }).action,
      ).toBe("enter");
    },
  );

  it("treats a missing or blocked storage as a new visitor", () => {
    const blocked = {
      getItem() {
        throw new Error("blocked");
      },
    };

    expect(
      decide({ pathname: "/", search: "", storage: blocked, languages: [] }),
    ).toEqual({ action: "redirect", to: "/welcome/en/" });
    expect(
      decide({ pathname: "/", search: "", storage: null, languages: ["tr"] }),
    ).toEqual({ action: "redirect", to: "/welcome/" });
  });

  it("lets the landing page buttons in and keeps other query params", () => {
    expect(
      decide({
        pathname: "/",
        search: "?welcome=en&ref=x",
        storage: memoryStorage(),
        languages: ["tr"],
      }),
    ).toEqual({ action: "enter", language: "en", search: "?ref=x" });
  });

  it("ignores an unknown welcome language", () => {
    expect(
      decide({
        pathname: "/",
        search: "?welcome=fr",
        storage: memoryStorage(),
        languages: ["tr"],
      }),
    ).toEqual({ action: "enter", language: null, search: "" });
  });
});

describe("first-visit run", () => {
  it("flags the redirect and leaves storage alone for a new visitor", () => {
    const { window, errors } = visit("https://anchorly.test/");

    expect(window.__ANCHORLY_REDIRECTING__).toBe(true);
    expect(errors.some((message) => /navigation/i.test(message))).toBe(true);
    expect(window.localStorage.getItem("anchorlyStarted")).toBeNull();
  });

  it("marks the visitor as started when the app opens on a deep link", () => {
    const { window } = visit("https://anchorly.test/today");

    expect(window.__ANCHORLY_REDIRECTING__).toBeUndefined();
    expect(window.localStorage.getItem("anchorlyStarted")).toBe("1");
  });

  it("enters from the English landing page in English and cleans the URL", () => {
    const { window } = visit("https://anchorly.test/?welcome=en#top");

    expect(window.__ANCHORLY_REDIRECTING__).toBeUndefined();
    expect(window.localStorage.getItem("anchorlyStarted")).toBe("1");
    expect(window.localStorage.getItem("language")).toBe('"en"');
    expect(window.location.pathname + window.location.search).toBe("/");
    expect(window.location.hash).toBe("#top");
  });

  it("keeps a language the visitor already chose", () => {
    const { window } = visit("https://anchorly.test/?welcome=en", {
      storage: { language: '"tr"' },
    });

    expect(window.localStorage.getItem("language")).toBe('"tr"');
  });

  it("opens the app for a returning visitor on the root", () => {
    const { window } = visit("https://anchorly.test/", {
      storage: { tasks: "[]" },
    });

    expect(window.__ANCHORLY_REDIRECTING__).toBeUndefined();
    expect(window.localStorage.getItem("anchorlyStarted")).toBe("1");
  });
});
