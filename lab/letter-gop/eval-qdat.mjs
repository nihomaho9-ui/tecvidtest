// Score qdat_bench (Ma'idah 5:109, second half) for qalqala / ghunna / ikhfa GOP.
import fs from "node:fs";
import path from "node:path";
import { TOKENS, encodePhonemes } from "@tilawa/core";
import { setEquivalence, ayahTokens, alignAyah } from "../../src/tajwid-core.js";
import { buildIndex, scoreAyah } from "../../src/letter-gop.js";
import { LAB, APP, readWavPcm16k, logprobs, log, writeJson, appendJsonl } from "./infer-lib.mjs";

setEquivalence(TOKENS);
const index = buildIndex(TOKENS);
const corpus = JSON.parse(fs.readFileSync(path.join(APP, "public/corpus.json"), "utf8"));
const ayah = corpus.surahs[5 - 1].ayahs[109 - 1];
// Clips cover قالُوا…الغُيوب (words 7–14 of the Hafs ayah).
const atFull = ayahTokens(ayah, encodePhonemes, TOKENS);
const w0 = 7, w1 = 14;
const keep = [];
for (let i = 0; i < atFull.ids.length; i += 1) if (atFull.wi[i] >= w0 && atFull.wi[i] <= w1) keep.push(i);
const at = {
  ids: keep.map((i) => atFull.ids[i]),
  toks: keep.map((i) => atFull.toks[i]),
  wi: keep.map((i) => atFull.wi[i] - w0),
};
log("expected suffix tokens", at.toks.join(" "));

const labels = JSON.parse(fs.readFileSync(path.join(LAB, "qdat_bench/labels_all.json"), "utf8"));
const wavDir = path.join(LAB, "qdat_bench/wav");
const OUT_JSONL = path.join(LAB, "out/qdat.jsonl");
const already = new Set();
if (fs.existsSync(OUT_JSONL)) {
  for (const line of fs.readFileSync(OUT_JSONL, "utf8").split("\n")) {
    if (!line) continue;
    try { already.add(JSON.parse(line).id); } catch { /* skip */ }
  }
}
const out = [];
const t0 = Date.now();
if (already.size) log("qdat resume already", already.size);
for (const lab of labels) {
  if (already.has(lab.id)) continue;
  const wav = path.join(wavDir, lab.id + ".wav");
  if (!fs.existsSync(wav)) {
    const rec = { id: lab.id, ok: false, reason: "missing" };
    out.push(rec);
    appendJsonl(OUT_JSONL, rec);
    continue;
  }
  const pcm = readWavPcm16k(wav);
  const { lp, T } = await logprobs(pcm, 12000);
  const al = alignAyah(lp, T, at.ids);
  if (!al) {
    out.push({ id: lab.id, ok: false, reason: "align", T, qalqalah: lab.qalqalah, noon_moshaddadah_len: lab.noon_moshaddadah_len, noon_mokhfah_len: lab.noon_mokhfah_len });
    continue;
  }
  const rows = scoreAyah(lp, T, at, al, index);
  const q = rows.filter((r) => r.qalqala);
  const g = rows.filter((r) => r.ghunna && r.ghunna.kind === "ghunna");
  const ik = rows.filter((r) => r.ghunna && r.ghunna.kind === "ikhfa");
  const pick = (list) => list.map((r) => ({
    i: r.i, tok: r.tok, w: r.w, emit: r.emit, gop: r.gop,
    llr: r.qalqala?.llr ?? r.ghunna?.llr, llrWin: r.qalqala?.llrWin ?? r.ghunna?.llrWin, llrCtx: r.qalqala?.llrCtx ?? r.ghunna?.llrCtx,
  }));
  const rec = {
    id: lab.id,
    ok: true,
    T,
    qalqalah: lab.qalqalah,
    noon_moshaddadah_len: lab.noon_moshaddadah_len,
    noon_mokhfah_len: lab.noon_mokhfah_len,
    qalqala: pick(q),
    ghunna: pick(g),
    ikhfa: pick(ik),
    pairs: rows.flatMap((r) => r.pairs.map((p) => ({ i: r.i, tok: r.tok, w: r.w, emit: r.emit, gop: r.gop, ...p }))),
  };
  out.push(rec);
  appendJsonl(OUT_JSONL, rec);
  if (out.length % 5 === 0 || out.length === 1) log("qdat new", out.length, "total", already.size + out.length, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
// Rebuild the full JSON from jsonl so a resume still produces a complete file.
const all = [];
if (fs.existsSync(OUT_JSONL)) {
  for (const line of fs.readFileSync(OUT_JSONL, "utf8").split("\n")) {
    if (line) all.push(JSON.parse(line));
  }
}
writeJson(path.join(LAB, "out/qdat.json"), all);
log("qdat done", all.length, "aligned", all.filter((x) => x.ok).length);
