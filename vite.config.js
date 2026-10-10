import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globalSetup: "./src/test/globalSetup.js",
    setupFiles: "./src/test/setup.js",
  },
}); 