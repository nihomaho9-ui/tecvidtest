// Score clean EveryAyah recitations: per-pair / qalqala / ghunna scores for FA tuning.
import fs from "node:fs";
import path from "node:path";
import { TOKENS, encodePhonemes } from "@tilawa/core";
import { setEquivalence, ayahTokens, alignAyah } from "../../src/tajwid-core.js";
import { buildIndex, scoreAyah } from "../../src/letter-gop.js";
import { LAB, APP, readWavPcm16k, logprobs, log, appendJsonl, writeJson } from "./infer-lib.mjs";
import { RECITERS, SURAHS } from "./download-clean.mjs";

setEquivalence(TOKENS);
const index = buildIndex(TOKENS);
const corpus = JSON.parse(fs.readFileSync(path.join(APP, "public/corpus.json"), "utf8"));
const ROOT = path.join(LAB, "clean-audio");
const OUT = path.join(LAB, "out/clean.jsonl");
const SUMMARY = path.join(LAB, "out/clean-progress.json");

const already = new Set();
if (fs.existsSync(OUT)) {
  for (const line of fs.readFileSync(OUT, "utf8").split("\n")) {
    if (!line) continue;
    try { already.add(JSON.parse(line).key); } catch { /* skip */ }
  }
}

const jobs = [];
for (const id of Object.keys(RECITERS)) {
  for (const [s, a0, a1] of SURAHS) {
    for (let a = a0; a <= a1; a += 1) {
      const name = String(s).padStart(3, "0") + String(a).padStart(3, "0") + ".mp3";
      const dest = path.join(ROOT, id, name);
      if (fs.existsSync(dest)) jobs.push({ id, s, a, dest, key: `${id}-${s}-${a}` });
    }
  }
}
log("clean jobs", jobs.length, "already", already.size);

const t0 = Date.now();
let n = 0, ok = 0, fail = 0;
for (const j of jobs) {
  if (already.has(j.key)) continue;
  try {
    const pcm = readWavPcm16k(j.dest);
    const { lp, T } = await logprobs(pcm, 12000);
    const at = ayahTokens(corpus.surahs[j.s - 1].ayahs[j.a - 1], encodePhonemes, TOKENS);
    const al = at ? alignAyah(lp, T, at.ids) : null;
    if (!at || !al) {
      appendJsonl(OUT, { key: j.key, id: j.id, s: j.s, a: j.a, ok: false, reason: "align", T });
      fail += 1;
    } else {
      const rows = scoreAyah(lp, T, at, al, index);
      const compact = [];
      for (const r of rows) {
        if (r.emit < -4) continue;
        for (const p of r.pairs) compact.push({ k: "pair", i: r.i, w: r.w, tok: r.tok, key: p.key, llr: p.llr, fam: p.fam, gop: r.gop, emit: r.emit });
        if (r.qalqala) compact.push({ k: "qalqala", i: r.i, w: r.w, tok: r.tok, llr: r.qalqala.llr, gop: r.gop, emit: r.emit });
        if (r.ghunna) compact.push({ k: r.ghunna.kind, i: r.i, w: r.w, tok: r.tok, llr: r.ghunna.llr, gop: r.gop, emit: r.emit });
        if (r.extraGhunna) compact.push({ k: "extra-ghunna", i: r.i, w: r.w, tok: r.tok, mass: r.extraGhunna.mass, emit: r.emit });
      }
      appendJsonl(OUT, { key: j.key, id: j.id, s: j.s, a: j.a, ok: true, T, ntok: at.ids.length, poor: rows.filter((r) => r.emit < -4).length / Math.max(1, rows.length), sites: compact });
      ok += 1;
    }
  } catch (e) {
    appendJsonl(OUT, { key: j.key, id: j.id, s: j.s, a: j.a, ok: false, reason: String(e).slice(0, 200) });
    fail += 1;
  }
  n += 1;
  if (n % 10 === 0) {
    const dt = (Date.now() - t0) / 1000;
    log("clean", n, "ok", ok, "fail", fail, `${dt.toFixed(0)}s`);
    writeJson(SUMMARY, { n, ok, fail, already: already.size, elapsed_s: +dt.toFixed(1) });
  }
}
log("clean done new", n, "ok", ok, "fail", fail);
writeJson(SUMMARY, { n, ok, fail, already: already.size, done: true });
