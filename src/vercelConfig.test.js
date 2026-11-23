import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FONTS } from "./constants/settings";

const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8"));
const indexHtml = readFileSync("index.html", "utf8");
const fontsCss = readFileSync("src/styles/fonts.css", "utf8");

const FONT_WEIGHTS = [400, 500, 600, 700];

function findHeaderRule(path) {
  return vercelConfig.headers.find((rule) =>
    new RegExp(`^${rule.source}$`).test(path),
  );
}

function readHeader(path, name) {
  return findHeaderRule(path)?.headers.find(
    (header) => header.key.toLowerCase() === name.toLowerCase(),
  )?.value;
}

function readPolicy(path) {
  return Object.fromEntries(
    readHeader(path, "Content-Security-Policy")
      .split(";")
      .map((directive) => directive.trim().split(/\s+/))
      .map(([name, ...sources]) => [name, sources]),
  );
}

describe("vercel security headers", () => {
  it("applies the headers to app pages and assets", () => {
    for (const path of ["/", "/today", "/login", "/assets/index.js"]) {
      expect(readHeader(path, "Content-Security-Policy")).toBeDefined();
    }
  });

  it("leaves api responses to the api", () => {
    expect(findHeaderRule("/api/auth/login")).toBeUndefined();
  });

  it("only allows scripts, styles and connections from the site", () => {
    const policy = readPolicy("/");

    expect(policy["default-src"]).toEqual(["'self'"]);
    expect(policy["script-src"]).toEqual(["'self'"]);
    expect(policy["style-src"]).toEqual(["'self'"]);
    expect(policy["connect-src"]).toEqual(["'self'"]);
  });

  it("blocks plugins, base changes and framing", () => {
    const policy = readPolicy("/");

    expect(policy["object-src"]).toEqual(["'none'"]);
    expect(policy["base-uri"]).toEqual(["'self'"]);
    expect(policy["frame-ancestors"]).toEqual(["'none'"]);
    expect(readHeader("/", "X-Frame-Options")).toBe("DENY");
  });

  it("never allows inline or evaluated code", () => {
    const policy = readHeader("/", "Content-Security-Policy");

    expect(policy).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
  });

  it("sends the remaining browser hardening headers", () => {
    expect(readHeader("/", "X-Content-Type-Options")).toBe("nosniff");
    expect(readHeader("/", "Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(readHeader("/", "Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(readHeader("/", "Permissions-Policy")).toContain("camera=()");
  });

  it("keeps the api rewrite first and the app fallback last", () => {
    const sources = vercelConfig.rewrites.map((rewrite) => rewrite.source);

    expect(sources).toEqual([
      "/api/:path*",
      "/welcome/en",
      "/welcome/en/",
      "/welcome",
      "/welcome/",
      "/(.*)",
    ]);
  });

  it("serves the landing pages from their own files", () => {
    const destinations = Object.fromEntries(
      vercelConfig.rewrites.map((rewrite) => [
        rewrite.source,
        rewrite.destination,
      ]),
    );

    expect(destinations["/welcome"]).toBe("/welcome/index.html");
    expect(destinations["/welcome/"]).toBe("/welcome/index.html");
    expect(destinations["/welcome/en"]).toBe("/welcome/en/index.html");
    expect(destinations["/welcome/en/"]).toBe("/welcome/en/index.html");
  });

  // Vercel parses sources with path-to-regexp, which rejects a modifier
  // straight after a slash ("/welcome/?") and fails the whole deployment.
  it("uses no optional-segment modifiers after a slash", () => {
    vercelConfig.rewrites.forEach(({ source }) => {
      expect(source).not.toMatch(/\/[?*+]/);
    });
  });
});

describe("self-hosted fonts", () => {
  it("loads nothing from other sites in index.html", () => {
    expect(indexHtml).not.toMatch(/(href|src)="https?:\/\//);
  });

  it("bundles every selectable font in every weight", () => {
    for (const font of FONTS) {
      for (const weight of FONT_WEIGHTS) {
        expect(fontsCss).toContain(
          `@import "@fontsource/${font.toLowerCase()}/${weight}.css";`,
        );
      }
    }
  });
});
