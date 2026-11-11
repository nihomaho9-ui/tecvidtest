// Split mushaf JSON out of the JS bundle into public/pg/<page>.json + index.json.
// Source of truth remains src/data/*.json; rerun this script after changing those files.
import { readFileSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = (name) => JSON.parse(readFileSync(join(root, "src/data", name), "utf8"));

const words = data("words.json");
const qcfPages = data("qcf-pages.json");
const qcfWords = data("qcf-words.json");
const qcfAyahs = data("qcf-ayahs.json");

const outDir = join(root, "public/pg");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const pages = [];
const surahAyahs = words.ayahs.map((list) => list.length);
let bytes = 0;
for (let n = 1; n <= 604; n += 1) {
  const key = String(n);
  const runs = qcfAyahs[key] ?? [];
  const lines = qcfPages[key] ?? [];
  const wlens = qcfWords[key] ?? [];
  const prev = qcfPages[String(n - 1)];
  const entry = [];
  for (const [pair] of runs) {
    const [s, a] = String(pair).split(":").map(Number);
    const wc = words.ayahs[s - 1]?.[a - 1]?.length ?? 0;
    entry.push([s, a, wc]);
  }
  pages.push(entry.map(([s, a]) => [s, a]));
  const body = {
    lines,
    wlens,
    runs,
    prev14: Boolean(prev?.[14]),
  };
  const json = JSON.stringify(body);
  writeFileSync(join(outDir, `${n}.json`), json);
  bytes += json.length;
}

const index = JSON.stringify({ v: 1, pages, ayahs: surahAyahs, words: pages.map((list, i) => {
  // word counts aligned with pages[i]: reuse the entry we built — recompute from words
  const n = i + 1;
  const runs = qcfAyahs[String(n)] ?? [];
  return runs.map(([pair]) => {
    const [s, a] = String(pair).split(":").map(Number);
    return words.ayahs[s - 1]?.[a - 1]?.length ?? 0;
  });
}) });
writeFileSync(join(outDir, "index.json"), index);
bytes += index.length;
console.log(`wrote 604 pages + index, ${(bytes / 1024).toFixed(1)} KB`);
