import { createHash } from "node:crypto";
import { readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vite";

const modelHash = createHash("sha256").update(readFileSync("public/model.onnx")).digest("hex").slice(0, 12);

function shellAssetsPlugin() {
  return {
    name: "shell-assets",
    closeBundle() {
      const dist = join(process.cwd(), "dist");
      const swPath = join(dist, "sw.js");
      if (!existsSync(swPath)) return;
      const assetsDir = join(dist, "assets");
      const keep: string[] = [];
      if (existsSync(assetsDir)) {
        for (const name of readdirSync(assetsDir)) {
          // The app loads ORT wasm from public/ort/; the copy Vite emits into assets/ is unused and ~15 MB.
          if (/^ort-wasm-simd-threaded-.*\.wasm$/.test(name)) {
            rmSync(join(assetsDir, name), { force: true });
            continue;
          }
          keep.push(`assets/${name}`);
        }
      }
      const sw = readFileSync(swPath, "utf8").replace(
        "\"__SHELL_ASSETS__\"",
        JSON.stringify(keep.map((p) => `./${p}`)),
      );
      writeFileSync(swPath, sw);
    },
  };
}

export default defineConfig({
  // Relative base so the same build works at /tecvidtest/ (github.io) and at / (custom domain).
  base: process.env.TARTIL_BASE ?? "./",
  define: {
    __MODEL_ID__: JSON.stringify(modelHash),
  },
  build: {
    target: "es2022",
    plugins: [],
  },
  plugins: [shellAssetsPlugin()],
});
