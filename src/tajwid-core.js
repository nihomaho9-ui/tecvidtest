// Tajwid duration checks shared by the app and the offline Husary prep (tools/tajwid-prep.mjs).
// Input: per-frame CTC log-probs (25 Hz, 251 classes) of the Zipformer phoneme model and the ayah's phoneme tokens.

export const CLASSES = 251;
export const BLANK = 250;

let EQUIV = null;
/** Madd tokens of one letter count as the same sound for confidence checks (length is judged separately). */
export function setEquivalence(TOKENS) {
  EQUIV = new Map();
  const fam = new Map();
  TOKENS.forEach((t, i) => { const m = /^([اۥۦ])\1+$/.exec(t); if (m) { if (!fam.has(m[1])) fam.set(m[1], []); fam.get(m[1]).push(i); } });
  for (const ids of fam.values()) for (const id of ids) EQUIV.set(id, ids);
}

/** Tajwid class of one phoneme token of the quran-transcript script. */
export function tokenClass(t) {
  if (/^[اۥۦ]+ۜ?$/.test(t)) return "madd" + [...t.replace("ۜ", "")].length;
  if (/^(ممم|ننن|ممممَ|ممممُ|ممممِ|ننننَ|ننننُ|ننننِ)$/.test(t)) return "ghunna";
  if (/^(ںںں|۾۾۾)$/.test(t)) return "ikhfa";
  if (t.includes("ڇ")) return "qalqala";
  return "other";
}

/** Token ids of an ayah and the word index of each token. */
export function ayahTokens(corpusAyah, encodePhonemes, TOKENS) {
  const w = corpusAyah.w;
  const ids = encodePhonemes(w.map((x) => x[1]).join(""));
  if (!ids) return null;
  const bounds = [];
  let p = 0;
  for (const x of w) { p += [...x[1]].length; bounds.push(p); }
  let c = 0;
  const wi = ids.map((id) => {
    const st = c;
    c += [...TOKENS[id]].length;
    let k = 0;
    while (k < bounds.length - 1 && st >= bounds[k]) k += 1;
    return k;
  });
  return { ids, wi, toks: ids.map((id) => TOKENS[id]) };
}

/**
 * CTC Viterbi alignment of `ids` inside frames [0,T) of `lp` (row-major T x 251). Frames before and after the
 * ayah are absorbed as "other speech" at a small per-frame penalty, so the window may hold the neighbouring ayahs.
 * Returns first emission frame and emission log-prob of each token, or null.
 */
export function alignAyah(lp, T, ids, penalty = 1.2, cap = Infinity) {
  const N = ids.length;
  const S = 2 * N + 1;
  if (!N || T < N) return null;
  const C = CLASSES;
  const lab = (s) => (s % 2 === 0 ? BLANK : ids[(s - 1) >> 1]);
  const garb = new Float64Array(T + 1);
  const floorT = new Float64Array(T);
  for (let t = 0; t < T; t += 1) {
    let mx = -Infinity;
    for (let k = 0; k < C; k += 1) { const v = lp[t * C + k]; if (v > mx) mx = v; }
    garb[t + 1] = garb[t] + mx - penalty;
    floorT[t] = mx - cap; // optional: an unexpected token costs at most `cap` per frame
  }
  const bp = new Int8Array(T * S);
  let prev = new Float64Array(S).fill(-Infinity);
  let cur = new Float64Array(S);
  let best = -Infinity;
  let bestT = -1;
  let bestS = -1;
  for (let t = 0; t < T; t += 1) {
    cur.fill(-Infinity);
    for (let s = 0; s < S; s += 1) {
      let v = prev[s];
      let b = 0;
      if (s > 0 && prev[s - 1] > v) { v = prev[s - 1]; b = 1; }
      if (s > 1 && s % 2 === 1 && ids[(s - 1) >> 1] !== ids[(s - 3) >> 1] && prev[s - 2] > v) { v = prev[s - 2]; b = 2; }
      if (s <= 1 && garb[t] > v) { v = garb[t]; b = 3; }
      if (v === -Infinity) continue;
      cur[s] = v + Math.max(lp[t * C + lab(s)], floorT[t]);
      bp[t * S + s] = b;
    }
    for (const s of [S - 1, S - 2]) {
      const total = cur[s] + (garb[T] - garb[t + 1]);
      if (total > best) { best = total; bestT = t; bestS = s; }
    }
    const tmp = prev; prev = cur; cur = tmp;
  }
  if (bestT < 0) return null;
  const start = new Int32Array(N).fill(-1);
  const emit = new Float32Array(N).fill(-99);
  let s = bestS;
  for (let t = bestT; t >= 0; t -= 1) {
    if (s % 2 === 1) {
      const k = (s - 1) >> 1;
      start[k] = t;
      const eq = EQUIV?.get(ids[k]);
      let v = lp[t * C + ids[k]];
      if (eq) for (const id of eq) v = Math.max(v, lp[t * C + id]);
      if (v > emit[k]) emit[k] = v;
    }
    const b = bp[t * S + s];
    if (b === 3) break;
    s -= b;
  }
  if (start[0] < 0) return null;
  return { start, emit, from: start[0], to: bestT, score: best };
}

const median = (v) => { if (!v.length) return NaN; const a = [...v].sort((x, y) => x - y); return a[a.length >> 1]; };

/** Ratio of each tajwid token's span (previous token start -> next token start) to the reciter's own tempo. */
export function measure(al, at) {
  const N = at.ids.length;
  const last = at.wi[N - 1];
  const rows = [];
  for (let i = 0; i < N; i += 1) {
    const k = tokenClass(at.toks[i]);
    const span = i > 0 && i < N - 1 ? al.start[i + 1] - al.start[i - 1] : NaN;
    rows.push({ i, k, w: at.wi[i], final: at.wi[i] === last, span, emit: al.emit[i] });
  }
  const m2 = rows.filter((x) => x.k === "madd2" && !x.final && x.span > 0).map((x) => x.span);
  const ot = rows.filter((x) => x.k === "other" && !x.final && x.span > 0).map((x) => x.span);
  const unit = m2.length >= 3 ? median(m2) : median(ot);
  const uo = median(ot);
  for (const x of rows) x.r = x.span > 0 ? x.span / (x.k.startsWith("madd") ? unit : uo) : NaN;
  const poor = rows.filter((x) => x.emit < -4).length / Math.max(1, N);
  return { rows, unit, uo, poor };
}

/** Kinds checked and the ratio under which a kind is "too short" (madd6 and the fallback; see RULES for the tuned ones). */
export const KINDS = { madd4: 1.85, madd6: 2.6, ghunna: 1.45, ikhfa: 1.2 };
export const REL = 0.72; // and shorter than this share of Husary's own ratio on the same token

/**
 * Rules tuned on dev data (Husary/Alafasy/Minshawi 2:1-41, qdat_bench dev half) for <=1.5% false alarms and checked on
 * held-out reciters (10 qaris, 36:1-30, 67:1-20) and the qdat_bench test half. See docs/TAJWID-PHASE2.md.
 *  - madd: ratio below tr AND below q x Husary's ratio on the same token.
 *  - ghunna / ikhfa: ratio below tr AND the error variant (plain noon / clear noon) is not much less likely (LLR > tl).
 *  - qalqala at the ayah end: encoder probe (src/tajwid-qprobe.json) score > 0.
 */
export const RULES = {
  muttasil: { tr: 2.2, q: 0.75 },
  munfasil: { tr: 2.1, q: 0.8 },
  lazim: { tr: 2.6, q: 0.72 },
  ghunna: { tr: 1.9, tl: -10 },
  ikhfa: { tr: 1.2, tl: -12 },
  long: { tr: 1.4, q: 1.5, tl: -10 }, // natural madd held too long: mid-word only, needs Husary's ratio (page all-site data)
};

/** Letters the mid-ayah qalqala probe is trusted on (ط had 10 training pairs and 3/10 false flags on a fresh set). */
export const QMID_LETTERS = "بجدق";

/** Madd type of token i: munfasil (hamza starts the next word), muttasil (same word), lazim (6), or other. */
export function maddType(at, i, mt) {
  const t = mt?.[i];
  if (t) return t === "f" ? "munfasil" : t === "t" ? "muttasil" : "lazim";
  const tok = at.toks[i];
  if ([...tok].length >= 6) return "lazim";
  const nx = at.toks[i + 1] || "";
  if (nx.startsWith("ء")) return at.wi[i + 1] === at.wi[i] ? "muttasil" : "munfasil";
  return "other";
}


/** Read a ratio from ref.band: [[i, kind, min, p10, med, p90, max, n], ...]. */
function bandRatio(R, i, key) {
  const row = (R?.band || []).find((x) => x[0] === i);
  if (!row || !(row[7] > 0)) return null;
  const j = { min: 2, p10: 3, med: 4, p90: 5, max: 6 }[key];
  const v = j == null ? null : row[j];
  return v > 0 ? v : null;
}

/**
 * Per-rule band mode used by the app. Unset rules stay on the Husary-only path.
 * Filled only for rules that decide-val marked SHIP after full inject.
 * opt.bandMode may still be a single string in lab scripts.
 */
export const BAND_MODES = {};

function modeOf(opt, rule) {
  const m = opt?.bandMode;
  if (!m) return null;
  if (typeof m === "string") return m;
  return m[rule] || null;
}
function shortKeyOf(mode) {
  return mode === "min" || mode === "p10" ? mode : mode === "median" ? "med" : null;
}
function longKeyOf(mode) {
  return mode === "min" ? "max" : mode === "p10" ? "p90" : mode === "median" ? "med" : null;
}

/**
 * Tajwid issues of one recited ayah.
 * ref = the page JSON ayah ({tj: [[i, kind, husaryRatio]], all?: [[i, kind, r, ok, llr, final]], mt?: {i: f|t|l}}), or a bare tj list.
 * opt.llr(i) = local LLR of token i's error variant (only called for candidates). opt.at = ayah tokens.
 * opt.munfasil = 2 for the qasr reading of madd munfasil (never flagged), else 4–5 counts.
 * Returns [{i, w, kind, sub, r, rRef}] — kind is madd | ghunna | ikhfa | qalqala.
 */
export function judge(m, ref, opt = {}) {
  if (!(m.unit > 0) || !(m.uo > 0) || m.poor > 0.15) return [];
  const R = Array.isArray(ref) ? { tj: ref } : ref || null;
  const refMap = new Map((R?.tj || []).map((x) => [x[0], x]));
  const allMap = new Map((R?.all || []).map((x) => [x[0], x]));
  const longKey = longKeyOf(modeOf(opt, "long"));
  const out = [];
  for (const x of m.rows) {
    const prev = m.rows[x.i - 1];
    const next = m.rows[x.i + 1];
    if (x.i === 0 || x.emit < -3 || (prev && prev.emit < -3) || (next && next.emit < -3)) continue;
    if (x.k === "qalqala") {
      if (!x.final) {
        // Mid-ayah sakin qalqala: probe trained on synthetic pairs (release silenced), src/tajwid-qmid.json.
        if (!opt.qmid || !opt.at || !QMID_LETTERS.includes(opt.at.toks[x.i][0])) continue;
        const pm = opt.qmid(x.i);
        if (pm > 0) out.push({ i: x.i, w: x.w, kind: "qalqala", sub: "qalqala-mid", r: x.r, rRef: null, llr: pm });
        continue;
      }
      if (!opt.qprobe) continue;
      // Encoder probe only: the LLR alone flagged 9% of clean ayah ends (33/380, 10 qaris), the probe 0/380.
      const p = opt.qprobe(x.i);
      if (p > 0) out.push({ i: x.i, w: x.w, kind: "qalqala", sub: "qalqala", r: x.r, rRef: null, llr: p });
      continue;
    }
    if (x.k === "madd2") {
      const L = RULES.long, h = allMap.get(x.i);
      let rRef = h && h[3] && h[2] > 0 ? h[2] : null;
      if (longKey) {
        const b = bandRatio(R, x.i, longKey);
        if (b != null) rRef = b;
      }
      if (x.final || !(x.r > L.tr) || !opt.at || !opt.llr || !(rRef > 0)) continue;
      if (opt.at.wi[x.i + 1] !== opt.at.wi[x.i]) continue; // word end: a pause can stretch it legitimately
      if (!(rRef * L.q < x.r)) continue;
      const l = opt.llr(x.i);
      if (l > L.tl) out.push({ i: x.i, w: x.w, kind: "madd", sub: "madd2", type: "long", r: x.r, rRef, llr: l });
      continue;
    }
    if (!KINDS[x.k] || x.final || !(x.r > 0)) continue;
    const r0 = refMap.get(x.i);
    if (x.k.startsWith("madd")) {
      const ty = x.k === "madd6" ? "lazim" : opt.at ? maddType(opt.at, x.i, R?.mt) : "muttasil";
      const shortKey = shortKeyOf(modeOf(opt, ty));
      let rH = r0 ? r0[2] : null;
      if (shortKey) {
        const b = bandRatio(R, x.i, shortKey);
        if (b != null) rH = b;
      } else if (R && !r0) continue;
      if (shortKey && rH == null && R && !r0) continue;
      // Qasr (opt.munfasil === 2): munfasil at 2 counts is a valid reading, so never call it short. No "too long" flag
      // either: the reference reading (Husary) is 4–5 and holds every munfasil longer than qasr allows.
      if (ty === "munfasil" && opt.munfasil === 2) continue;
      const rule = RULES[ty === "munfasil" ? "munfasil" : ty === "lazim" ? "lazim" : "muttasil"];
      if (!(x.r < rule.tr)) continue;
      if (rH != null && !(x.r < rule.q * rH)) continue;
      if (rH == null && !(x.r < KINDS[x.k])) continue;
      out.push({ i: x.i, w: x.w, kind: "madd", sub: x.k, type: ty, r: x.r, rRef: rH });
      continue;
    }
    const shortKey = shortKeyOf(modeOf(opt, x.k));
    let rH = r0 ? r0[2] : null;
    if (shortKey) {
      const b = bandRatio(R, x.i, shortKey);
      if (b != null) rH = b;
    } else if (R && !r0) continue;
    if (shortKey && rH == null && R && !r0) continue;
    const rule = RULES[x.k];
    if (!(x.r < rule.tr)) continue;
    if (x.k === "ikhfa" && rH != null && !(x.r < REL * rH)) continue; // ikhfa: also clearly shorter than Husary here (browser clean false flag)
    if (opt.llr) { const l = opt.llr(x.i); if (!(l > rule.tl)) continue; }
    else if (!(x.r < KINDS[x.k])) continue;
    out.push({ i: x.i, w: x.w, kind: x.k, sub: x.k, r: x.r, rRef: rH });
  }
  return out;
}

/** Error variant of a tajwid token (the token a reciter who breaks the rule would produce), or undefined. */
export function errorVariant(t, k) {
  const c = t[0];
  if (k === "madd4" || k === "madd5" || k === "madd6") return c + c;
  if (k === "madd2") return c.repeat(4);
  if (k === "ghunna") { const v = t.slice(-1); return /[َُِ]/.test(v) ? c + v : c; }
  if (k === "ikhfa") return c === "ں" ? "ن" : "م";
  if (k === "qalqala") return t.replace("ڇ", "");
  return undefined;
}

/**
 * Local log-likelihood ratio log P(error variant) - log P(expected) around token i (Viterbi, +-ctx tokens).
 * Positive = the audio fits the mistake better than the rule.
 */
export function siteLLR(lp, T, ids, al, i, altId, ctx = 3) {
  const a = Math.max(0, i - ctx);
  const b = Math.min(ids.length, i + ctx + 1);
  const f0 = Math.max(0, al.start[a] - 12);
  const f1 = Math.min(T, (b < ids.length ? al.start[b] : al.to + 1) + 12);
  const n = f1 - f0;
  if (n <= b - a) return NaN;
  const sub = lp.subarray(f0 * CLASSES, f1 * CLASSES);
  const exp = ids.slice(a, b);
  const alt = [...ids.slice(a, i), ...(altId == null ? [] : [altId]), ...ids.slice(i + 1, b)];
  const e = alignAyah(sub, n, exp, 1.2);
  const x = alignAyah(sub, n, alt, 1.2);
  return e && x ? x.score - e.score : NaN;
}

/**
 * Qalqala probe (tilawa slip-head pattern): logistic score on [mean | max] of the 512-d encoder rows around the
 * qalqala token start. > 0 = the bounce is probably missing. probe = src/tajwid-qprobe.json.
 */
export function qprobeScore(enc, T, s, probe) {
  const D = probe.dim, lo = Math.max(0, s + probe.win[0]), hi = Math.min(T, s + probe.win[1]);
  if (!(hi > lo)) return NaN;
  let z = probe.b;
  for (let d = 0; d < D; d += 1) {
    let sum = 0, mx = -Infinity;
    for (let t = lo; t < hi; t += 1) { const v = enc[t * D + d]; sum += v; if (v > mx) mx = v; }
    z += probe.w[d] * (sum / (hi - lo)) + probe.w[D + d] * mx;
  }
  return z;
}

/**
 * Wrong stop (waqf) inside an ayah — "Çətin" only.
 * `loud`: decoder-frame loudness (mean log-mel of the 10 ms fbank frames 4t..4t+3, max over the four).
 * Quiet runs >= minRun frames split the ayah into spoken chunks; each chunk is matched to the word range j..k that
 * explains it best (CTC alignment, the rest of the chunk as garbage), so a restart from an earlier word is seen too.
 * A stop after word k is fine at a pause mark (ۖ ۗ ۘ ۚ ۜ, ۛ once per pair) and wrong elsewhere (no mark, or ۙ).
 */
export const WAQF = { fullPenalty: 1.2, tail: 6, maxSpan: 25, minRun: 18, gap: 5, lag: 12, cap: 8, bridge: 3, minDyn: 4, back: 6, ahead: 4, penalty: 6 };

export function quietRuns(loud, T, from, to, opt = WAQF) {
  // floor: quietest real frames (digital zero, < -15.5, is padding); ref: speech level. Quiet = well below speech.
  const lo = Math.max(0, from - 250);
  const hi = Math.min(T, to + 10);
  const vals = [];
  for (let t = lo; t < hi; t += 1) if (Number.isFinite(loud[t]) && loud[t] > -15.5) vals.push(loud[t]);
  if (vals.length < 20) return [];
  vals.sort((a, b) => a - b);
  const floor = vals[Math.floor(vals.length * 0.02)];
  const ref = vals[Math.floor(vals.length * 0.9)];
  if (ref - floor < opt.minDyn) return [];
  const th = Math.min(ref - opt.gap, floor + 0.5 * (ref - floor));
  const runs = [];
  // quiet stretches; a click or breath of <= bridge frames inside a pause does not split it
  let s = -1;
  let lastQ = -1;
  const bridge = opt.bridge ?? 3;
  const close = () => { if (s >= 0 && lastQ + 1 - s >= opt.minRun) runs.push({ s, e: lastQ + 1 }); s = -1; };
  for (let t = from + 1; t < to; t += 1) {
    const q = Number.isFinite(loud[t]) && loud[t] < th;
    if (!q) continue;
    if (s >= 0 && t - lastQ - 1 > bridge) close();
    if (s < 0) s = t;
    lastQ = t;
  }
  close();
  return runs;
}

function idsOf(at, j, k) {
  const out = [];
  for (let i = 0; i < at.ids.length; i += 1) if (at.wi[i] >= j && at.wi[i] <= k) out.push(at.ids[i]);
  return out;
}

/** Word range j..k that best explains frames [a,b): candidates J for j, k in [kLo,kHi]. */
function bestRange(lp, a, b, at, J, kLo, kHi, penalty, cap) {
  let best = null;
  let G = 0; // the same frames explained as garbage only
  for (let t = a; t < b; t += 1) {
    let mx = -Infinity;
    for (let c = 0; c < CLASSES; c += 1) if (lp[t * CLASSES + c] > mx) mx = lp[t * CLASSES + c];
    G += mx - penalty;
  }
  for (const j of J) {
    for (let k = Math.max(j, kLo); k <= kHi; k += 1) {
      const ids = idsOf(at, j, k);
      if (!ids.length || ids.length > b - a) continue;
      const al = alignAyah(lp.subarray(a * CLASSES, b * CLASSES), b - a, ids, penalty, cap);
      if (al && (!best || al.score > best.score)) best = { j, k, score: al.score, to: a + al.to, gain: (al.score - G) / ids.length, span: (al.to - al.from + 1) / ids.length };
    }
  }
  return best;
}

/** marks: { [word]: code } with s q m l j t k (see tj data). Returns wrong stops [{ w, soft, len }] (len in frames). */
export function findStops(lp, T, loud, at, al0, marks, opt = WAQF) {
  const N = at.ids.length;
  // own alignment with capped per-frame cost, so unexpected tokens don't push the start late
  const w0 = Math.max(0, al0.from - 250);
  const w1 = Math.min(T, al0.to + 25);
  // mild garbage here (a strict one drags word 0 back onto the previous ayah through the pause), strict inside chunks
  const ra = alignAyah(lp.subarray(w0 * CLASSES, w1 * CLASSES), w1 - w0, at.ids, opt.fullPenalty, opt.cap);
  const al = ra ? { from: ra.from + w0, to: ra.to + w0, start: Array.from(ra.start, (x) => (x < 0 ? -1 : x + w0)) } : al0;
  const lastW = at.wi[N - 1];
  if (lastW < 1) return [];
  let firstLast = N - 1;
  while (firstLast > 0 && at.wi[firstLast - 1] === lastW) firstLast -= 1;
  const endF = al.start[firstLast];
  const runs = quietRuns(loud, T, al.from, endF, opt);
  if (!runs.length) return [];
  const wordAt = (f) => {
    let w = 0;
    for (let i = 0; i < N; i += 1) if (al.start[i] >= 0 && al.start[i] < f) w = at.wi[i];
    return w;
  };
  const chunks = [];
  let prevK = -1;
  // first chunk: from the end of the last quiet stretch before the ayah (the full alignment can start late)
  let a = -1;
  for (const q of quietRuns(loud, T, Math.max(0, al.from - 250), al.from + 2, { ...opt, minRun: 8 })) a = q.e;
  if (a < 0) a = Math.max(0, al.from - 25);
  const a0 = a;
  for (const r of runs) {
    const kA = wordAt(r.s);
    const J = chunks.length ? [] : [0];
    if (chunks.length) for (let j = Math.max(0, prevK - opt.back); j <= Math.min(lastW - 1, prevK + 1); j += 1) J.push(j);
    const kLo = Math.max(0, chunks.length ? Math.min(kA - opt.ahead, prevK) : kA - opt.ahead);
    const kHi = Math.min(lastW - 1, kA + opt.ahead);
    // CTC emits a word's last tokens a few frames after its audio fades, so let the chunk reach into the pause
    const got = bestRange(lp, a, Math.min(r.e, r.s + opt.lag), at, J, kLo, kHi, opt.penalty, opt.cap);
    if (!got) return [];
    if (got.to < r.s - opt.tail || got.span > opt.maxSpan) {
      // the words don't reach this pause, or a few tokens are smeared over much more speech (word 0 found inside the
      // previous ayah): not a stop inside this ayah. Skip it; a first chunk then starts after it.
      if (!chunks.length) a = r.e;
      continue;
    }
    // reading restarts at word 0: what came before was the previous ayah (or a fresh start): no stop to judge there
    if (got.j === 0 && chunks.length) chunks.length = 0;
    chunks.push({ ...got, run: r });
    prevK = got.k;
    a = r.e;
  }
  // start word of the chunk after the last quiet run (it runs to the ayah's last word)
  const tailEnd = Math.min(T, Math.max(al.to + 25, a + 8));
  let after = null;
  for (let j = Math.max(0, prevK - opt.back); j <= Math.min(lastW, prevK + 1); j += 1) {
    const ids = idsOf(at, j, lastW);
    if (!ids.length || ids.length > tailEnd - a) continue;
    const x = alignAyah(lp.subarray(a * CLASSES, tailEnd * CLASSES), tailEnd - a, ids, opt.penalty, opt.cap);
    if (x && (!after || x.score > after.score)) after = { j, score: x.score };
  }
  if (after && after.j === 0) chunks.length = 0;
  const out = [];
  let pairOpen = false;
  chunks.forEach((c, n) => {
    const next = n + 1 < chunks.length ? chunks[n + 1].j : after ? after.j : c.k + 1;
    const m = marks?.[c.k] || "";
    let ok = /[sqmjkh]/.test(m);
    if (/t/.test(m)) {
      ok = !pairOpen;
      pairOpen = true;
    }
    if (ok) return;
    out.push({ w: c.k, soft: next <= c.k, len: c.run.e - c.run.s, next });
  });
  if (opt.debug) opt.debug.push({ start: a0, chunks, after });
  return out;
}
