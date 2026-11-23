import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

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

export default defineConfig({
  plugins: [react(), welcomePages()],
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
