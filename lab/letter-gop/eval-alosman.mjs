// Score Al-Osman Fatiha lesson windows (read-only wav in tecvidtest).
import fs from "node:fs";
import path from "node:path";
import { TOKENS, encodePhonemes } from "@tilawa/core";
import { setEquivalence, ayahTokens, alignAyah } from "../../src/tajwid-core.js";
import { buildIndex, scoreAyah, scoreIsolated } from "../../src/letter-gop.js";
import { readWavPcm16k, readPcm16kSliceWav, logprobs, log, writeJson, appendJsonl } from "./infer-lib.mjs";

setEquivalence(TOKENS);
const index = buildIndex(TOKENS);
const APP = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const corpus = JSON.parse(fs.readFileSync(path.join(APP, "public/corpus.json"), "utf8"));
const WAV = "/workspace/tecvidtest/lab/fatiha/alosman/lessons/fatiha-tashih.wav";
const OUT = "/workspace/letter-lab/out/alosman.json";
const OUT_JSONL = "/workspace/letter-lab/out/alosman.jsonl";


// Windows taken from lab/fatiha/alosman/lessons/real-error-report.json (video seconds).
// "wrong" = a demonstrated error or drill; "clean" = a later full correct take of the ayah.
const CLIPS = [
  { id: "d2-rahm-taf", demo: 2, kind: "tafkheem", expectedAyah: 1, t0: 406, t1: 430, label: "wrong", note: "Basmala drills; tafkheem of ra transferred onto ha" },
  { id: "d2-rahim-short", demo: 2, kind: "haraka", expectedAyah: 1, t0: 422.4, t1: 427.32, label: "wrong", note: "isolated الرحيم very short madd (secondary)" },
  { id: "d2-rahim-fuller", demo: 2, kind: "clean-ish", expectedAyah: 1, t0: 482.25, t1: 490.57, label: "clean", note: "fuller الرحيم take" },
  { id: "d3-hamd-damma", demo: 3, kind: "haraka", expectedAyah: 2, t0: 520, t1: 560, label: "wrong", note: "الحمد incomplete damma; ربا tafkheem drill" },
  { id: "d3-clean-1-2", demo: 3, kind: "clean", expectedAyah: 2, t0: 685.36, t1: 701.84, label: "clean", note: "full 1:2 take" },
  { id: "d4-ghunna-alameen", demo: 4, kind: "extra-ghunna", expectedAyah: 2, t0: 590, t1: 637.5, label: "wrong", note: "extra ghunna on ya of العالمين; nose-pinch drill" },
  { id: "d5-hamza-tarqeeq", demo: 5, kind: "tarqeeq", expectedAyah: 3, t0: 710, t1: 751, label: "wrong", note: "hamza must stay light before heavy ra" },
  { id: "d5-clean-1-3", demo: 5, kind: "clean", expectedAyah: 3, t0: 751.25, t1: 762.37, label: "clean", note: "full 1:3 take" },
  { id: "d6-clean-1-4", demo: 6, kind: "clean", expectedAyah: 4, t0: 762.18, t1: 772.79, label: "clean", note: "full 1:4 take" },
  { id: "d7-dal-ta", demo: 7, kind: "sifat", expectedAyah: 4, t0: 817.8, t1: 825.08, label: "wrong", note: "dal vs ta / hams of moved dal" },
  { id: "d7-clean-1-4b", demo: 7, kind: "clean", expectedAyah: 4, t0: 901.31, t1: 911.77, label: "clean", note: "later 1:4 take" },
  { id: "d9-ayn-nabud", demo: 9, kind: "makhraj", expectedAyah: 5, t0: 1006, t1: 1080, label: "wrong", note: "ayn makhraj in نعبد" },
  { id: "d10-clean-1-5", demo: 10, kind: "clean", expectedAyah: 5, t0: 1217.03, t1: 1233.09, label: "clean", note: "full correct 1:5" },
  { id: "d11-sad-taf", demo: 11, kind: "tafkheem", expectedAyah: 6, t0: 1247, t1: 1300, label: "wrong", note: "nun tarqeeq before sad; tafkheem of صراط" },
  { id: "d11-clean-1-6", demo: 11, kind: "clean", expectedAyah: 6, t0: 1233.03, t1: 1246.22, label: "clean", note: "full correct 1:6" },
  { id: "d11-clean-1-6b", demo: 11, kind: "clean", expectedAyah: 6, t0: 1408.26, t1: 1416.46, label: "clean", note: "later full 1:6" },
];

const ats = {};
for (let a = 1; a <= 7; a += 1) ats[a] = ayahTokens(corpus.surahs[0].ayahs[a - 1], encodePhonemes, TOKENS);

if (!fs.existsSync(WAV)) {
  console.error("missing", WAV);
  process.exit(1);
}

const already = new Map();
if (fs.existsSync(OUT_JSONL)) {
  for (const line of fs.readFileSync(OUT_JSONL, "utf8").split("\n")) {
    if (!line) continue;
    try { const r = JSON.parse(line); if (r.id) already.set(r.id, r); } catch { /* skip */ }
  }
}
const out = [...already.values()];
if (already.size) log("alosman resume already", already.size);
for (const c of CLIPS) {
  if (already.has(c.id)) continue;
  const pcm = readPcm16kSliceWav(WAV, Math.max(0, c.t0 - 0.05), c.t1 + 0.05);
  const { lp, T } = await logprobs(pcm, 12000);
  const at = ats[c.expectedAyah];
  const al = at ? alignAyah(lp, T, at.ids) : null;
  const rows = al ? scoreAyah(lp, T, at, al, index) : [];
  const compact = rows.map((r) => ({
    i: r.i, w: r.w, tok: r.tok, base: r.base, emit: r.emit, gop: r.gop,
    pairs: r.pairs.map((p) => ({ key: p.key, to: p.to, llr: +p.llr?.toFixed?.(3) || p.llr, fam: +p.fam?.toFixed?.(3) || p.fam })),
    qalqala: r.qalqala ? { llr: r.qalqala.llr, gop: r.gop } : null,
    ghunna: r.ghunna ? { kind: r.ghunna.kind, llr: r.ghunna.llr } : null,
    extraGhunna: r.extraGhunna ? { mass: r.extraGhunna.mass } : null,
  }));
  const rec = {
    ...c,
    T,
    aligned: !!al,
    poor: al ? compact.filter((r) => r.emit < -4).length / Math.max(1, compact.length) : 1,
    from: al?.from ?? null,
    to: al?.to ?? null,
    rows: compact,
  };
  out.push(rec);
  appendJsonl(OUT_JSONL, rec);
  log("alosman", c.id, "T", T, "aligned", !!al, "rows", compact.length);
}
writeJson(OUT, out);
log("alosman done", out.length);
