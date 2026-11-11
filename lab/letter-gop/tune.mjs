// Tune per-pair / feature thresholds to a <=1.5% false-alarm budget on clean audio,
// then report detection on Hijaiyah, qdat_bench, and Al-Osman.
import fs from "node:fs";
import path from "node:path";
import { LAB, writeJson, log } from "./io.mjs";
import { PAIRS, pairKey } from "../../src/letter-gop.js";

const FA_BUDGET = 0.015;
const MIN_CLEAN = 40; // min clean sites before we trust a per-pair threshold
const OUT = path.join(LAB, "out");

function loadJsonl(p) {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}
function pct(xs, p) {
  if (!xs.length) return null;
  const a = [...xs].sort((x, y) => x - y);
  const x = (a.length - 1) * p;
  const i = Math.floor(x);
  const f = x - i;
  return a[i] * (1 - f) + a[Math.min(i + 1, a.length - 1)] * f;
}
function mean(xs) { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; }

function rateAt(scores, th, lowerIsFlag) {
  if (!scores.length) return null;
  const n = scores.filter((v) => (lowerIsFlag ? v <= th : v >= th)).length;
  return n / scores.length;
}

/** Highest-detection threshold on `pos` such that FA on `neg` is <= budget.
 * lowerIsFlag: flag when score <= th (LLR / GOP). */
function tune(neg, pos, budget = FA_BUDGET, lowerIsFlag = true) {
  if (!neg.length) return { th: null, fa: null, det: null, nNeg: 0, nPos: 0 };
  const ns = [...neg].sort((a, b) => a - b);
  // FA <= budget: for lowerIsFlag, th can be at most the budget-quantile of neg.
  const th = lowerIsFlag ? pct(ns, budget) : pct(ns, 1 - budget);
  const fa = rateAt(neg, th, lowerIsFlag);
  const det = pos.length ? rateAt(pos, th, lowerIsFlag) : null;
  return { th, fa, det, nNeg: neg.length, nPos: pos.length, p10: pct(neg, 0.1), p50: pct(neg, 0.5), p90: pct(neg, 0.9), posP50: pos.length ? pct(pos, 0.5) : null };
}

const clean = loadJsonl(path.join(OUT, "clean.jsonl")).filter((x) => x.ok);
const hij = loadJsonl(path.join(OUT, "hijaiyah.jsonl"));
const qdat = fs.existsSync(path.join(OUT, "qdat.json")) ? JSON.parse(fs.readFileSync(path.join(OUT, "qdat.json"), "utf8")) : [];
const alos = fs.existsSync(path.join(OUT, "alosman.json")) ? JSON.parse(fs.readFileSync(path.join(OUT, "alosman.json"), "utf8")) : [];

const pairKeys = PAIRS.map(([a, b]) => pairKey(a, b));

const cleanBy = { pairs: {}, qalqala: [], ghunna: [], ikhfa: [], extra: [] };
for (const k of pairKeys) cleanBy.pairs[k] = [];
for (const ayah of clean) {
  for (const s of ayah.sites || []) {
    if (s.k === "pair" && cleanBy.pairs[s.key]) cleanBy.pairs[s.key].push(s.llr);
    else if (s.k === "qalqala") cleanBy.qalqala.push(s.llr);
    else if (s.k === "ghunna") cleanBy.ghunna.push(s.llr);
    else if (s.k === "ikhfa") cleanBy.ikhfa.push(s.llr);
    else if (s.k === "extra-ghunna") cleanBy.extra.push(s.mass);
  }
}

// Hijaiyah: benar = negatives for expected letter; salah and cross(benar of sister scored as L) = positives.
const hijBy = {};
for (const k of pairKeys) hijBy[k] = { benarLlr: [], salahLlr: [], crossLlr: [], benarFam: [], salahFam: [], benarGop: [], salahGop: [] };
for (const r of hij) {
  if (!r.ok) continue;
  for (const p of r.pairs || []) {
    const b = hijBy[p.key];
    if (!b) continue;
    if (r.category === "benar") { b.benarLlr.push(p.llr); b.benarFam.push(p.fam); b.benarGop.push(r.gop); }
    else { b.salahLlr.push(p.llr); b.salahFam.push(p.fam); b.salahGop.push(r.gop); }
  }
  if (r.category === "benar") {
    for (const c of r.cross || []) {
      // clip of letter L, scored as sister S: llr is P(S) - P(L) under expected S, i.e. a substitution of S towards L.
      // For pair S/L this is a positive (error) example of pronouncing S as L? Wait:
      // scoreIsolated(letter=S) on audio of L: expected S, audio is L, so LLR(S vs L) should be low / negative.
      // That is a true substitution error for expected S.
      if (c.ok && c.llr != null) {
        const key = pairKey(r.letter, c.letter);
        if (hijBy[key]) hijBy[key].crossLlr.push(c.llr);
      }
    }
  }
}

const qPos = { qalqala: [], ghunna: [], ikhfa: [] };
const qNeg = { qalqala: [], ghunna: [], ikhfa: [] };
for (const r of qdat.filter((x) => x.ok)) {
  const take = (list, dest) => { for (const x of list || []) if (Number.isFinite(x.llr)) dest.push(x.llr); };
  take(r.qalqala, r.qalqalah === 0 ? qPos.qalqala : qNeg.qalqala);
  take(r.ghunna, r.noon_moshaddadah_len === 0 ? qPos.ghunna : qNeg.ghunna);
  take(r.ikhfa, r.noon_mokhfah_len === 0 ? qPos.ikhfa : qNeg.ikhfa);
}

const report = { faBudget: FA_BUDGET, cleanAyahs: clean.length, hijClips: hij.filter((x) => x.ok).length, qdat: qdat.length, alosman: alos.length, pairs: {}, features: {}, ship: [], skip: [], notes: [] };

const thresholds = { pairs: {}, qalqala: null, ghunna: null, ikhfa: null, extraGhunna: null };

for (const k of pairKeys) {
  const c = cleanBy.pairs[k] || [];
  const h = hijBy[k];
  const tunedClean = tune(c, h.crossLlr, FA_BUDGET, true);
  const detSalah = h.salahLlr.length && tunedClean.th != null ? rateAt(h.salahLlr, tunedClean.th, true) : null;
  const hijFa = tune(h.benarLlr, h.crossLlr, FA_BUDGET, true);
  const useful = tunedClean.th != null && c.length >= MIN_CLEAN && (tunedClean.det || 0) >= 0.35;
  const weakButOk = tunedClean.th != null && c.length >= MIN_CLEAN && (tunedClean.det || 0) >= 0.2 && detSalah >= 0.25;
  const ship = useful || weakButOk;
  report.pairs[k] = {
    cleanN: c.length, cleanMean: mean(c), cleanP10: pct(c, 0.1), cleanP50: pct(c, 0.5),
    hijBenarN: h.benarLlr.length, hijSalahN: h.salahLlr.length, hijCrossN: h.crossLlr.length,
    hijBenarMean: mean(h.benarLlr), hijSalahMean: mean(h.salahLlr), hijCrossMean: mean(h.crossLlr),
    threshClean15: tunedClean, detSalahAtCleanTh: detSalah, hijIsolatedTune: hijFa,
    ship,
  };
  if (ship) {
    thresholds.pairs[k] = { llr: tunedClean.th };
    report.ship.push({ feature: k, th: tunedClean.th, fa: tunedClean.fa, detCross: tunedClean.det, detSalah, nClean: c.length });
  } else {
    report.skip.push({ feature: k, why: c.length < MIN_CLEAN ? "too few clean sites" : `detection ${(tunedClean.det * 100 || 0).toFixed(1)}% at FA budget too low`, th: tunedClean.th, fa: tunedClean.fa, det: tunedClean.det, detSalah, nClean: c.length });
  }
}

function feature(name, cleanScores, pos, lowerIsFlag = true, minDet = 0.35) {
  const t = tune(cleanScores, pos, FA_BUDGET, lowerIsFlag);
  const qNegN = (name === "qalqala" ? qNeg.qalqala : name === "ghunna" ? qNeg.ghunna : name === "ikhfa" ? qNeg.ikhfa : []);
  const qFa = t.th != null && qNegN.length ? rateAt(qNegN, t.th, lowerIsFlag) : null;
  const ship = t.th != null && cleanScores.length >= 20 && (t.det || 0) >= minDet;
  report.features[name] = { cleanN: cleanScores.length, cleanMean: mean(cleanScores), posN: pos.length, posMean: mean(pos), tune: t, qdatFaAtTh: qFa, ship };
  if (ship) {
    const key = name === "extraGhunna" ? "extraGhunna" : name;
    const field = lowerIsFlag ? "llr" : "mass";
    thresholds[key] = { [field]: t.th };
    report.ship.push({ feature: name, th: t.th, fa: t.fa, det: t.det, nClean: cleanScores.length });
  } else {
    report.skip.push({ feature: name, why: cleanScores.length < 20 ? "too few clean sites" : `detection ${(t.det * 100 || 0).toFixed(1)}% at FA budget too low`, th: t.th, fa: t.fa, det: t.det, nClean: cleanScores.length });
  }
}

feature("qalqala", cleanBy.qalqala, qPos.qalqala, true, 0.35);
feature("ghunna", cleanBy.ghunna, qPos.ghunna, true, 0.3);
feature("ikhfa", cleanBy.ikhfa, qPos.ikhfa, true, 0.3);
// extra ghunna: flag when nasal mass is HIGH
feature("extraGhunna", cleanBy.extra, [], false, 0.3);

// Al-Osman qualitative: apply shipped thresholds if any, else report raw scores on relevant tokens.
function applyTh(rows) {
  const flags = [];
  for (const r of rows || []) {
    for (const p of r.pairs || []) {
      const th = thresholds.pairs[p.key];
      if (th && p.llr <= th.llr) flags.push({ tok: r.tok, sub: p.key, llr: p.llr, th: th.llr });
    }
    if (r.qalqala && thresholds.qalqala && r.qalqala.llr <= thresholds.qalqala.llr) flags.push({ tok: r.tok, sub: "qalqala", llr: r.qalqala.llr });
    if (r.ghunna && thresholds[r.ghunna.kind] && r.ghunna.llr <= thresholds[r.ghunna.kind].llr) flags.push({ tok: r.tok, sub: r.ghunna.kind, llr: r.ghunna.llr });
    if (r.extraGhunna && thresholds.extraGhunna && r.extraGhunna.mass >= thresholds.extraGhunna.mass) flags.push({ tok: r.tok, sub: "extra-ghunna", mass: r.extraGhunna.mass });
  }
  return flags;
}
report.alosman = alos.map((c) => ({
  id: c.id, demo: c.demo, label: c.label, kind: c.kind, note: c.note, aligned: c.aligned, poor: c.poor,
  flags: applyTh(c.rows),
  pairMin: Object.fromEntries(pairKeys.map((k) => {
    const xs = (c.rows || []).flatMap((r) => (r.pairs || []).filter((p) => p.key === k).map((p) => p.llr)).filter(Number.isFinite);
    return [k, xs.length ? Math.min(...xs) : null];
  })),
  extraMax: Math.max(-Infinity, ...(c.rows || []).map((r) => r.extraGhunna?.mass).filter(Number.isFinite)),
}));

const wrong = report.alosman.filter((x) => x.label === "wrong");
const cleanA = report.alosman.filter((x) => x.label === "clean");
report.alosmanSummary = {
  wrongN: wrong.length,
  wrongFlagged: wrong.filter((x) => x.flags.length).length,
  cleanN: cleanA.length,
  cleanFlagged: cleanA.filter((x) => x.flags.length).length,
};

writeJson(path.join(OUT, "tune-report.json"), report);
writeJson(path.join(OUT, "thresholds.json"), thresholds);
// Do not overwrite src/letter-gop-thresholds.json unless explicitly asked.
if (process.argv.includes("--write-app")) {
  const appTh = path.join(LAB, "app/src/letter-gop-thresholds.json");
  writeJson(appTh, thresholds);
  log("wrote app thresholds", appTh);
}
log("tune ship", report.ship.length, "skip", report.skip.length, "alosman wrong flagged", report.alosmanSummary.wrongFlagged, "/", report.alosmanSummary.wrongN);
console.log(JSON.stringify({ ship: report.ship, skip: report.skip, alosman: report.alosmanSummary }, null, 2));
