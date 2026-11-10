import { defineConfig } from "vite";

export default defineConfig({
  // Relative base so the same build works at /tecvidtest/ (github.io) and at / (custom domain).
  base: process.env.TARTIL_BASE ?? "./",
  build: { target: "es2022" },
});
