// Score letter GOP on already-computed Zipformer posteriors (read-only caches).
// Does not write inside tecvidtest-mulk or tecvidtest.
import fs from "node:fs";
import path from "node:path";
import { TOKENS, encodePhonemes } from "@tilawa/core";
import { setEquivalence, ayahTokens, alignAyah } from "../../src/tajwid-core.js";
import { buildIndex, scoreAyah } from "../../src/letter-gop.js";
import { LAB, APP, log, appendJsonl, writeJson } from "./io.mjs";
log("clean-cache starting");

setEquivalence(TOKENS);
const index = buildIndex(TOKENS);
const corpus = JSON.parse(fs.readFileSync(path.join(APP, "public/corpus.json"), "utf8"));

const CACHES = [
  "/workspace/tecvidtest-mulk/lab/quran-band/cache",
  "/workspace/tecvidtest-mulk/lab/mulk/cache",
  "/workspace/tecvidtest/lab/fatiha/cache",
];
const EXCLUDE = new Set(["abdulbasit", "abdulbasit_mj"]);
const OUT = path.join(LAB, "out/clean.jsonl");
const SUMMARY = path.join(LAB, "out/clean-progress.json");
const NAME = /^(.+)-(\d+)-(\d+)\.lp$/;

const already = new Set();
if (fs.existsSync(OUT)) {
  for (const line of fs.readFileSync(OUT, "utf8").split("\n")) {
    if (!line) continue;
    try { already.add(JSON.parse(line).key); } catch { /* skip */ }
  }
}

function readLp(file) {
  const b = fs.readFileSync(file);
  const aligned = (b.byteOffset % 4 === 0) ? b : Buffer.from(b);
  if (aligned.byteLength % 4) return null;
  const lp = new Float32Array(aligned.buffer, aligned.byteOffset, aligned.byteLength / 4);
  if (lp.length % 251) return null;
  return { lp, T: lp.length / 251 };
}

const jobs = [];
const seen = new Set();
for (const dir of CACHES) {
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    const m = NAME.exec(name);
    if (!m) continue;
    const rec = m[1], s = +m[2], a = +m[3];
    if (EXCLUDE.has(rec)) continue;
    const key = `${rec}-${s}-${a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    jobs.push({ key, rec, s, a, file: path.join(dir, name) });
  }
}
jobs.sort((x, y) => x.s - y.s || x.a - y.a || x.rec.localeCompare(y.rec));
log("clean-cache jobs", jobs.length, "already", already.size);

const t0 = Date.now();
let n = 0, ok = 0, fail = 0;
for (const j of jobs) {
  if (already.has(j.key)) continue;
  try {
    const st = fs.statSync(j.file);
    if (st.mtimeMs > Date.now() - 5000) { fail += 1; n += 1; continue; } // maybe still being written
    const got = readLp(j.file);
    if (!got) { appendJsonl(OUT, { key: j.key, id: j.rec, s: j.s, a: j.a, ok: false, reason: "bad-lp" }); fail += 1; n += 1; continue; }
    const at = ayahTokens(corpus.surahs[j.s - 1].ayahs[j.a - 1], encodePhonemes, TOKENS);
    const al = at ? alignAyah(got.lp, got.T, at.ids) : null;
    if (!at || !al) {
      appendJsonl(OUT, { key: j.key, id: j.rec, s: j.s, a: j.a, ok: false, reason: "align", T: got.T });
      fail += 1;
    } else {
      const rows = scoreAyah(got.lp, got.T, at, al, index, { fast: true });
      const compact = [];
      for (const r of rows) {
        if (r.emit < -4) continue;
        for (const p of r.pairs) compact.push({ k: "pair", i: r.i, w: r.w, tok: r.tok, key: p.key, llr: p.llr, fam: p.fam, gop: r.gop, emit: r.emit });
        if (r.qalqala) compact.push({ k: "qalqala", i: r.i, w: r.w, tok: r.tok, llr: r.qalqala.llr, gop: r.gop, emit: r.emit });
        if (r.ghunna) compact.push({ k: r.ghunna.kind, i: r.i, w: r.w, tok: r.tok, llr: r.ghunna.llr, gop: r.gop, emit: r.emit });
        if (r.extraGhunna) compact.push({ k: "extra-ghunna", i: r.i, w: r.w, tok: r.tok, mass: r.extraGhunna.mass, emit: r.emit });
      }
      appendJsonl(OUT, { key: j.key, id: j.rec, s: j.s, a: j.a, ok: true, T: got.T, ntok: at.ids.length, poor: rows.filter((r) => r.emit < -4).length / Math.max(1, rows.length), sites: compact });
      ok += 1;
    }
  } catch (e) {
    appendJsonl(OUT, { key: j.key, id: j.rec, s: j.s, a: j.a, ok: false, reason: String(e).slice(0, 200) });
    fail += 1;
  }
  n += 1;
  if (n % 50 === 0) {
    const dt = (Date.now() - t0) / 1000;
    log("clean-cache", n, "ok", ok, "fail", fail, `${dt.toFixed(0)}s`, `${(n / Math.max(1, dt)).toFixed(1)}/s`);
    writeJson(SUMMARY, { n, ok, fail, already: already.size, elapsed_s: +dt.toFixed(1) });
  }
}
log("clean-cache done new", n, "ok", ok, "fail", fail);
writeJson(SUMMARY, { n, ok, fail, already: already.size, done: true });
