import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const apiProxy = {
  "/api": {
    target: "http://localhost:3000",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api(?=\/|$)/, ""),
  },
};

// The landing page lives in public/welcome. Vite would answer /welcome/ with
// the app's index.html, so map the page URLs to their files (vercel.json does
// the same in production).
const WELCOME_PAGES = {
  "/welcome": "/welcome/index.html",
  "/welcome/": "/welcome/index.html",
  "/welcome/en": "/welcome/en/index.html",
  "/welcome/en/": "/welcome/en/index.html",
};

function welcomePages() {
  function rewrite(req, _res, next) {
    const [path, query] = req.url.split("?");
    const target = WELCOME_PAGES[path];

    if (target) {
      req.url = query ? `${target}?${query}` : target;
    }

    next();
  }

  return {
    name: "welcome-pages",
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

// Makes the app installable ("Install app" / "Add to Home Screen") and lets it
// open offline: the service worker precaches the built app shell. API calls
// are never cached; the data layer already copes with an unreachable server.
const BG_COLOR = "#f4f6fb"; // --color-bg-page of the default theme

const pwa = VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["anchorly-svg.svg", "apple-touch-icon-180x180.png"],
  manifest: {
    id: "/",
    name: "Anchorly",
    short_name: "Anchorly",
    description:
      "A task and habit dashboard: daily tasks, routines, calendar and projects.",
    start_url: "/",
    scope: "/",
    // Chromium desktop browsers drop the title bar (with its URL and browser
    // icons) and leave only the window buttons; src/styles/components/
    // titlebar.css adds the drag strip and spacing.
    // Other browsers fall back to "standalone".
    display_override: ["window-controls-overlay"],
    display: "standalone",
    background_color: BG_COLOR,
    theme_color: BG_COLOR,
    icons: [
      { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
      { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
      {
        src: "maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
    globIgnores: [
      // The landing page is a separate site section, not part of the app shell.
      "welcome/**",
      // The UI is Turkish/English, so only latin and latin-ext fonts are
      // precached. Other subsets still load (and are cached) when needed.
      "assets/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese,devanagari}-*.woff2",
    ],
    runtimeCaching: [
      {
        urlPattern: ({ url }) =>
          url.origin === self.location.origin &&
          url.pathname.endsWith(".woff2"),
        handler: "CacheFirst",
        options: {
          cacheName: "fonts",
          expiration: { maxEntries: 60 },
        },
      },
    ],
    navigateFallback: "/index.html",
    navigateFallbackDenylist: [/^\/api(\/|$)/, /^\/welcome(\/|$)/],
    cleanupOutdatedCaches: true,
  },
});

export default defineConfig({
  plugins: [react(), welcomePages(), pwa],
  server: {
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
  test: {
    environment: "jsdom",
    globalSetup: "./src/test/globalSetup.js",
    setupFiles: "./src/test/setup.js",
    testTimeout: 15000,
    env: { VITE_AUTH_ENABLED: "false" },
  },
});
