import { defineConfig } from "vitest/config";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node", // pure functions don't need a DOM
  },
  server: {
    allowedHosts: [],
  },
  base: "/spelling-bee/",
});
