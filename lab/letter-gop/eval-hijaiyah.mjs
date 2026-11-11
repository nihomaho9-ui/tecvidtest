// Score every Hijaiyah clip (benar + salah) with isolated-letter GOP / sister LLR.
import fs from "node:fs";
import path from "node:path";
import { TOKENS } from "@tilawa/core";
import { setEquivalence } from "../../src/tajwid-core.js";
import { buildIndex, scoreIsolated, PAIRS, pairKey } from "../../src/letter-gop.js";
import { LAB, APP, readWavPcm16k, logprobs, log, appendJsonl, writeJson } from "./infer-lib.mjs";

setEquivalence(TOKENS);
const index = buildIndex(TOKENS);

const HURUF = {
  1: "ا", 2: "ب", 3: "ت", 4: "ث", 5: "ج", 6: "ح", 7: "خ", 8: "د",
  9: "ذ", 10: "ر", 11: "ز", 12: "س", 13: "ش", 14: "ص", 15: "ض", 16: "ط",
  17: "ظ", 18: "ع", 19: "غ", 20: "ف", 21: "ق", 22: "ك", 23: "ل", 24: "م",
  25: "ن", 26: "و", 27: "ه", 28: "ي",
};

const PAIR_LETTERS = new Set(PAIRS.flat());
PAIR_LETTERS.add("ا"); // isolated alif is encoded as hamza ء + vowel

const META = path.join(LAB, "hijaiyah/metadata_rekaman.csv");
const WAV_ROOT = path.join(LAB, "hijaiyah/wav");
const OUT = path.join(LAB, "out/hijaiyah.jsonl");
const SUMMARY = path.join(LAB, "out/hijaiyah-progress.json");

function findWav(rel) {
  // metadata: benar/1/1-1-1.wav  zips: "Data Benar/1/1-1-1.wav"
  const m = /^(benar|salah)\/(.+)$/i.exec(rel.replaceAll("\\", "/"));
  if (!m) return null;
  const folder = m[1].toLowerCase() === "benar" ? "Data Benar" : "Data Salah";
  const p = path.join(WAV_ROOT, folder, m[2]);
  return fs.existsSync(p) ? p : null;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const hdr = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const o = {};
    hdr.forEach((h, i) => { o[h] = cols[i]; });
    return o;
  });
}

const already = new Set();
if (fs.existsSync(OUT)) {
  for (const line of fs.readFileSync(OUT, "utf8").split("\n")) {
    if (!line) continue;
    try { already.add(JSON.parse(line).source_id); } catch { /* skip */ }
  }
}

const rows = parseCsv(fs.readFileSync(META, "utf8"));
const repsArg = process.argv.find((a) => a.startsWith("--reps="));
const onlyReps = repsArg ? new Set(repsArg.slice(7).split(",").map(Number)) : null;
const respArg = process.argv.find((a) => a.startsWith("--responden="));
const onlyResp = respArg ? new Set(respArg.slice(12).split(",")) : null;
const catArg = process.argv.find((a) => a.startsWith("--category="));
const onlyCat = catArg ? new Set(catArg.slice(11).split(",")) : null;
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.slice(8)) : 0;
const want = rows.filter((r) =>
  PAIR_LETTERS.has(HURUF[+r.huruf_no]) &&
  (!onlyReps || onlyReps.has(+r.rep)) &&
  (!onlyResp || onlyResp.has(r.responden)) &&
  (!onlyCat || onlyCat.has(r.category))
);
log("hijaiyah clips in confused-letter set", want.length, "already", already.size, "limit", limit || "none");

const t0 = Date.now();
let n = 0, ok = 0, fail = 0;
for (const r of want) {
  if (already.has(r.source_id)) continue;
  const wav = findWav(r.source_id);
  if (!wav) {
    appendJsonl(OUT, { source_id: r.source_id, ok: false, reason: "missing" });
    fail += 1;
    continue;
  }
  try {
    const pcm = readWavPcm16k(wav);
    const { lp, T } = await logprobs(pcm, 8000);
    const letter = HURUF[+r.huruf_no] === "ا" ? "ء" : HURUF[+r.huruf_no];
    const scored = scoreIsolated(lp, T, letter, +r.sub, index);
    const sisters = [...new Set((scored.row?.pairs || []).map((x) => x.to))];
    const cross = [];
    for (const s of sisters) {
      const sc = scoreIsolated(lp, T, s, +r.sub, index);
      if (!sc.ok) { cross.push({ letter: s, ok: false }); continue; }
      const hit = (sc.row.pairs || []).find((p) => p.to === letter);
      cross.push({
        letter: s, ok: true, emit: sc.al.emit, gop: sc.row.gop,
        llr: hit?.llr ?? null, fam: hit?.fam ?? null, llrWin: hit?.llrWin ?? null,
      });
    }
    const rec = {
      source_id: r.source_id,
      category: r.category,
      responden: r.responden,
      grup_cv: r.grup_cv,
      huruf_no: +r.huruf_no,
      letter,
      item: r.item,
      sub: +r.sub,
      rep: +r.rep,
      split: r.split,
      fold: r.fold,
      y_S1: +r.y_S1,
      y_S3: +r.y_S3,
      y_T2: +r.y_T2,
      duration: +r.duration,
      T,
      ok: scored.ok,
      reason: scored.reason || null,
      emit: scored.al?.emit ?? null,
      gop: scored.row?.gop ?? null,
      extraGhunna: scored.row?.extraGhunna?.mass ?? null,
      pairs: (scored.row?.pairs || []).map((p) => ({
        key: p.key, to: p.to, llr: p.llr, llrWin: p.llrWin, llrCtx: p.llrCtx, fam: p.fam, gopSister: p.gopSister,
      })),
      clipFam: scored.row?.clipFam || null,
      cross,
    };
    appendJsonl(OUT, rec);
    if (scored.ok) ok += 1; else fail += 1;
  } catch (e) {
    appendJsonl(OUT, { source_id: r.source_id, ok: false, reason: String(e).slice(0, 200) });
    fail += 1;
  }
  n += 1;
  if (n % 10 === 0 || n === 1) {
    const dt = (Date.now() - t0) / 1000;
    log("hijaiyah", n, "ok", ok, "fail", fail, `${dt.toFixed(0)}s`, `${(n / dt).toFixed(2)}/s`);
    writeJson(SUMMARY, { n, ok, fail, already: already.size, elapsed_s: +dt.toFixed(1) });
  }
  if (limit && n >= limit) {
    log("hijaiyah hit --limit", limit);
    break;
  }
}
log("hijaiyah done new", n, "ok", ok, "fail", fail);
writeJson(SUMMARY, { n, ok, fail, already: already.size, done: true });
