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

  it("keeps the api rewrite before the app fallback", () => {
    const sources = vercelConfig.rewrites.map((rewrite) => rewrite.source);

    expect(sources).toEqual(["/api/:path*", "/(.*)"]);
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
