import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const apiProxy = {
  "/api": {
    target: "http://localhost:3000",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api(?=\/|$)/, ""),
  },
};

export default defineConfig({
  plugins: [react()],
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
