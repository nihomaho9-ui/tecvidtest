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

/** Kinds checked and the ratio under which a kind is "too short". Chosen for low false alarms (phase 1 data). */
export const KINDS = { madd4: 1.85, madd6: 2.6, ghunna: 1.45, ikhfa: 1.2 };
export const REL = 0.72; // and shorter than this share of Husary's own ratio on the same token

/**
 * Tajwid issues of one recited ayah. `ref` = [[tokenIndex, kind, husaryRatio], ...] from the page JSON (optional).
 * Returns [{i, w, kind, r, rRef}] — kind is madd | ghunna | ikhfa.
 */
export function judge(m, ref) {
  if (!(m.unit > 0) || !(m.uo > 0) || m.poor > 0.15) return [];
  const refMap = new Map((ref || []).map((x) => [x[0], x]));
  const out = [];
  for (const x of m.rows) {
    const th = KINDS[x.k];
    if (!th || x.final || !(x.r > 0)) continue;
    const prev = m.rows[x.i - 1];
    const next = m.rows[x.i + 1];
    if (x.emit < -3 || (prev && prev.emit < -3) || (next && next.emit < -3)) continue;
    const r0 = refMap.get(x.i);
    if (ref && !r0) continue; // Husary's own reading of this token was not usable
    if (x.r >= th) continue;
    if (r0 && x.r >= REL * r0[2]) continue;
    out.push({ i: x.i, w: x.w, kind: x.k.startsWith("madd") ? "madd" : x.k, sub: x.k, r: x.r, rRef: r0 ? r0[2] : null });
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
