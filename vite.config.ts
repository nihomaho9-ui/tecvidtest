import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.TARTIL_BASE ?? "/tecvidtest/",
  build: { target: "es2022" },
});
