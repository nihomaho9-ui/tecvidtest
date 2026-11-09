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
export function alignAyah(lp, T, ids, penalty = 1.2) {
  const N = ids.length;
  const S = 2 * N + 1;
  if (!N || T < N) return null;
  const C = CLASSES;
  const lab = (s) => (s % 2 === 0 ? BLANK : ids[(s - 1) >> 1]);
  const garb = new Float64Array(T + 1);
  for (let t = 0; t < T; t += 1) {
    let mx = -Infinity;
    for (let k = 0; k < C; k += 1) { const v = lp[t * C + k]; if (v > mx) mx = v; }
    garb[t + 1] = garb[t] + mx - penalty;
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
      cur[s] = v + lp[t * C + lab(s)];
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
 *  - qalqala at the ayah end: the no-qalqala variant is not much less likely (LLR > tl).
 */
export const RULES = {
  muttasil: { tr: 2.2, q: 0.75 },
  munfasil: { tr: 2.1, q: 0.8 },
  lazim: { tr: 2.6, q: 0.72 },
  ghunna: { tr: 1.9, tl: -10 },
  ikhfa: { tr: 1.2, tl: -12 },
  qalqala: { tl: -14 },
};

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

/**
 * Tajwid issues of one recited ayah.
 * ref = the page JSON ayah ({tj: [[i, kind, husaryRatio]], all?: [[i, kind, r, ok, llr, final]], mt?: {i: f|t|l}}), or a bare tj list.
 * opt.llr(i) = local LLR of token i's error variant (only called for candidates). opt.at = ayah tokens.
 * Returns [{i, w, kind, sub, r, rRef}] — kind is madd | ghunna | ikhfa | qalqala.
 */
export function judge(m, ref, opt = {}) {
  if (!(m.unit > 0) || !(m.uo > 0) || m.poor > 0.15) return [];
  const R = Array.isArray(ref) ? { tj: ref } : ref || null;
  const refMap = new Map((R?.tj || []).map((x) => [x[0], x]));
  const allMap = new Map((R?.all || []).map((x) => [x[0], x]));
  const out = [];
  for (const x of m.rows) {
    const prev = m.rows[x.i - 1];
    const next = m.rows[x.i + 1];
    if (x.i === 0 || x.emit < -3 || (prev && prev.emit < -3) || (next && next.emit < -3)) continue;
    if (x.k === "qalqala") {
      if (!x.final || !opt.llr) continue;
      const h = allMap.get(x.i);
      if (h && (!h[3] || !(h[4] <= RULES.qalqala.tl))) continue; // Husary's own qalqala here was not clear
      const l = opt.llr(x.i);
      if (l > RULES.qalqala.tl) out.push({ i: x.i, w: x.w, kind: "qalqala", sub: "qalqala", r: x.r, rRef: null, llr: l });
      continue;
    }
    if (!KINDS[x.k] || x.final || !(x.r > 0)) continue;
    const r0 = refMap.get(x.i);
    if (R && !r0) continue; // Husary's own reading of this token was not usable
    const rH = r0 ? r0[2] : null;
    if (x.k.startsWith("madd")) {
      const ty = x.k === "madd6" ? "lazim" : opt.at ? maddType(opt.at, x.i, R?.mt) : "muttasil";
      const rule = RULES[ty === "munfasil" ? "munfasil" : ty === "lazim" ? "lazim" : "muttasil"];
      if (!(x.r < rule.tr)) continue;
      if (rH != null && !(x.r < rule.q * rH)) continue;
      if (rH == null && !(x.r < KINDS[x.k])) continue;
      out.push({ i: x.i, w: x.w, kind: "madd", sub: x.k, type: ty, r: x.r, rRef: rH });
      continue;
    }
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
