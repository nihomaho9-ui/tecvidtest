// Per-token goodness-of-pronunciation for confused letters, qalqala, and ghunna.
// Uses Zipformer CTC log-posteriors and @tilawa/core forced / free log-likelihoods.
// Browser-safe (no Node APIs). Thresholds live in letter-gop-thresholds.json.

import { FramePosteriors, forcedLogLik, freeLogLik, GOP_FLOOR, TOKENS } from "@tilawa/core";
import { CLASSES, BLANK, alignAyah, siteLLR, tokenClass, errorVariant } from "./tajwid-core.js";

/** Confused-letter pairs the judge can test. Order is (expected-side, sister-side) but comparisons are symmetric. */
export const PAIRS = [
  ["ح", "ه"],
  ["ع", "ء"],
  ["ص", "س"],
  ["ض", "د"],
  ["ط", "ت"],
  ["ق", "ك"],
  ["ذ", "ز"],
  ["ث", "س"],
  ["ظ", "ز"],
  ["خ", "ه"],
  ["غ", "خ"],
];

const LETTER_RE = /[ءاٲبتثجحخدذرزسشصضطظعغفقكلمنهويں۾]/;
const VOWEL_RE = /[َُِ]/;
const GHUNNA_RE = /^(ممم|ننن|ممممَ|ممممُ|ممممِ|ننننَ|ننننُ|ننننِ|نؙ)$/;
const IKHFA_RE = /^(ںںں|۾۾۾)$/;
const NASAL_BASE = new Set(["ن", "م", "ں", "۾", "ؙ"]);

export function pairKey(a, b) {
  return a < b ? `${a}/${b}` : `${b}/${a}`;
}

export function baseLetter(tok) {
  if (!tok || tok === "<blank>" || tok === "ؙ") return tok === "ؙ" ? "ن" : null;
  const m = tok.match(LETTER_RE);
  return m ? m[0] : null;
}

/** Replace the base letter (and its shadda doubling) with `to`. Drops qalqala if the sister has no such token. */
export function mapTokenLetter(tok, from, to, tokenIndex) {
  if (!tok.includes(from)) return -1;
  const raw = tok.split(from).join(to);
  if (tokenIndex.has(raw)) return tokenIndex.get(raw);
  if (raw.includes("ڇ")) {
    const dropped = raw.replace("ڇ", "");
    if (tokenIndex.has(dropped)) return tokenIndex.get(dropped);
  }
  return -1;
}

export function buildIndex(tokens = TOKENS) {
  const tokenIndex = new Map(tokens.map((t, i) => [t, i]));
  const byBase = new Map();
  for (let i = 0; i < tokens.length; i += 1) {
    const b = baseLetter(tokens[i]);
    if (!b) continue;
    if (!byBase.has(b)) byBase.set(b, []);
    byBase.get(b).push(i);
  }
  const sisters = new Map(); // tokenId -> [{key, from, to, sisterId, sisterTok}]
  for (const [a, b] of PAIRS) {
    const key = pairKey(a, b);
    for (const [from, to] of [[a, b], [b, a]]) {
      for (const id of byBase.get(from) || []) {
        const tok = tokens[id];
        const sid = mapTokenLetter(tok, from, to, tokenIndex);
        if (sid < 0 || sid === id) continue;
        if (!sisters.has(id)) sisters.set(id, []);
        const row = { key, from, to, sisterId: sid, sisterTok: tokens[sid] };
        if (!sisters.get(id).some((x) => x.key === key && x.sisterId === sid)) sisters.get(id).push(row);
      }
    }
  }
  const qalqalaOf = new Map(); // qalqala token id -> non-bounce variant id
  const ghunnaOf = new Map();
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (t.includes("ڇ")) {
      const alt = errorVariant(t, "qalqala");
      if (alt !== undefined && tokenIndex.has(alt)) qalqalaOf.set(i, tokenIndex.get(alt));
    }
    const k = tokenClass(t);
    if (k === "ghunna" || GHUNNA_RE.test(t)) {
      const alt = errorVariant(t, "ghunna");
      if (alt !== undefined && tokenIndex.has(alt)) ghunnaOf.set(i, tokenIndex.get(alt));
    }
    if (k === "ikhfa" || IKHFA_RE.test(t)) {
      const alt = errorVariant(t, "ikhfa");
      if (alt !== undefined && tokenIndex.has(alt)) ghunnaOf.set(i, tokenIndex.get(alt));
    }
  }
  return { tokens, tokenIndex, byBase, sisters, qalqalaOf, ghunnaOf };
}

export function wrapPost(lp, T) {
  const post = new FramePosteriors(CLASSES, Math.max(T + 8, 64));
  post.push(lp, T, 0);
  return post;
}

export function tokenSpan(al, i, T, pad = 2) {
  const from = Math.max(0, al.start[i] - pad);
  const next = i + 1 < al.start.length ? al.start[i + 1] : al.to + 1;
  const to = Math.min(T, Math.max(from + 3, next + pad));
  return [from, to];
}

function floorGop(x) {
  return Number.isFinite(x) ? Math.max(GOP_FLOOR, x) : GOP_FLOOR;
}

/** Per-token GOP: (forced expected ids - free) / n_ids, floored like wordGop. */
export function tokenGop(post, ids, from, to) {
  if (!ids.length || to - from < ids.length) return NaN;
  const f = forcedLogLik(post, ids, from, to);
  if (!Number.isFinite(f)) return GOP_FLOOR;
  return floorGop((f - freeLogLik(post, from, to)) / ids.length);
}

/** log P(expected) - log P(sister) over the same window (positive = expected fits better). */
export function forcedLLR(post, expIds, altIds, from, to) {
  const a = forcedLogLik(post, expIds, from, to);
  const b = forcedLogLik(post, altIds, from, to);
  if (!Number.isFinite(a) && !Number.isFinite(b)) return 0;
  if (!Number.isFinite(a)) return GOP_FLOOR;
  if (!Number.isFinite(b)) return -GOP_FLOOR;
  return a - b;
}

function logsumexp(vals) {
  let m = -Infinity;
  for (const v of vals) if (v > m) m = v;
  if (m === -Infinity) return -Infinity;
  let s = 0;
  for (const v of vals) s += Math.exp(v - m);
  return m + Math.log(s);
}

/** Mean log-posterior mass of every token whose base letter is `letter`, over [from, to). */
export function letterLogMass(lp, T, from, to, letter, index) {
  const ids = index.byBase.get(letter);
  if (!ids || to <= from) return NaN;
  let acc = 0;
  for (let t = from; t < to; t += 1) {
    const vals = ids.map((id) => lp[t * CLASSES + id]);
    acc += logsumexp(vals);
  }
  return acc / (to - from);
}

export function meanLogp(lp, from, to, id) {
  if (to <= from) return NaN;
  let s = 0;
  for (let t = from; t < to; t += 1) s += lp[t * CLASSES + id];
  return s / (to - from);
}

const GHUNNA_IDS_CACHE = new WeakMap();
function nasalIds(index) {
  let ids = GHUNNA_IDS_CACHE.get(index);
  if (ids) return ids;
  ids = [];
  index.tokens.forEach((t, i) => {
    if (t === "ؙ" || t.includes("ؙ") || GHUNNA_RE.test(t) || IKHFA_RE.test(t) || t === "ں" || t === "۾") ids.push(i);
  });
  GHUNNA_IDS_CACHE.set(index, ids);
  return ids;
}

/** Mean log mass of ghunna/ikhfa tokens in a window (for extra ghunna on a non-nasal letter). */
export function nasalLogMass(lp, from, to, index) {
  const ids = nasalIds(index);
  if (!ids.length || to <= from) return NaN;
  let acc = 0;
  for (let t = from; t < to; t += 1) {
    acc += logsumexp(ids.map((id) => lp[t * CLASSES + id]));
  }
  return acc / (to - from);
}

/**
 * Context-aware LLR around token i: log P(ids with expected) - log P(ids with alt at i).
 * Uses the same window as siteLLR, but flipped so positive means the expected token wins.
 */
export function contextLLR(lp, T, ids, al, i, altId, ctx = 2) {
  if (altId == null || altId < 0) return NaN;
  const v = siteLLR(lp, T, ids, al, i, altId, ctx);
  return Number.isFinite(v) ? -v : NaN;
}

export function scoreToken(lp, T, post, at, al, i, index, opts = {}) {
  const id = at.ids[i];
  const tok = at.toks[i];
  const base = baseLetter(tok);
  const [from, to] = tokenSpan(al, i, T);
  const gop = tokenGop(post, [id], from, to);
  const emit = al.emit[i];
  const out = {
    i,
    w: at.wi[i],
    tok,
    base,
    from,
    to,
    emit,
    gop,
    pairs: [],
    qalqala: null,
    ghunna: null,
    extraGhunna: null,
  };
  for (const s of index.sisters.get(id) || []) {
    const llrWin = forcedLLR(post, [id], [s.sisterId], from, to);
    const llrCtx = opts.fast ? NaN : contextLLR(lp, T, at.ids, al, i, s.sisterId);
    const fam = letterLogMass(lp, T, from, to, base, index) - letterLogMass(lp, T, from, to, s.to, index);
    out.pairs.push({
      key: s.key,
      from: s.from,
      to: s.to,
      sisterId: s.sisterId,
      sisterTok: s.sisterTok,
      llr: Number.isFinite(llrCtx) ? llrCtx : llrWin,
      llrWin,
      llrCtx,
      fam,
      gopSister: tokenGop(post, [s.sisterId], from, to),
    });
  }
  if (index.qalqalaOf.has(id)) {
    const alt = index.qalqalaOf.get(id);
    const llrWin = forcedLLR(post, [id], [alt], from, to);
    const llrCtx = opts.fast ? NaN : contextLLR(lp, T, at.ids, al, i, alt);
    out.qalqala = { alt, llr: Number.isFinite(llrCtx) ? llrCtx : llrWin, llrWin, llrCtx, gop };
  }
  if (index.ghunnaOf.has(id)) {
    const alt = index.ghunnaOf.get(id);
    const k = tokenClass(tok) === "ikhfa" ? "ikhfa" : "ghunna";
    const llrWin = forcedLLR(post, [id], [alt], from, to);
    const llrCtx = opts.fast ? NaN : contextLLR(lp, T, at.ids, al, i, alt);
    out.ghunna = { kind: k, alt, llr: Number.isFinite(llrCtx) ? llrCtx : llrWin, llrWin, llrCtx, gop };
  }
  if (base && !NASAL_BASE.has(base) && tokenClass(tok) === "other") {
    out.extraGhunna = { mass: nasalLogMass(lp, from, to, index), gop };
  }
  return out;
}

export function scoreAyah(lp, T, at, al, index, opts = {}) {
  if (!at || !al) return [];
  const post = wrapPost(lp, T);
  const rows = [];
  for (let i = 0; i < at.ids.length; i += 1) {
    if (al.start[i] < 0) continue;
    rows.push(scoreToken(lp, T, post, at, al, i, index, opts));
  }
  return rows;
}

const VOWELS = { 1: "َ", 2: "ِ", 3: "ُ" };

/** Isolated hijaiyah letter: encode as letter+vowel (alif as hamza). */
export function isolatedIds(letter, vowelSub, index) {
  const v = VOWELS[vowelSub] || VOWELS[1];
  const base = letter === "ا" || letter === "أ" || letter === "إ" || letter === "آ" ? "ء" : letter;
  const tok = base + v;
  const id = index.tokenIndex.get(tok);
  if (id == null) return null;
  return { ids: [id], toks: [tok], wi: [0], tok, id, base };
}

export function scoreIsolated(lp, T, letter, vowelSub, index) {
  const at = isolatedIds(letter, vowelSub, index);
  if (!at) return { ok: false, reason: "oov", letter, vowelSub };
  const al = alignAyah(lp, T, at.ids);
  if (!al) return { ok: false, reason: "align", letter, vowelSub, T, at };
  const post = wrapPost(lp, T);
  const row = scoreToken(lp, T, post, at, al, 0, index);
  // Whole-clip family contrast (blank-argmax frames only), useful when the token window is tiny.
  const spokenFrom = Math.max(0, al.from - 1);
  const spokenTo = Math.min(T, al.to + 2);
  row.clipFam = {};
  for (const s of row.pairs) {
    row.clipFam[s.key] = letterLogMass(lp, T, spokenFrom, spokenTo, at.base, index)
      - letterLogMass(lp, T, spokenFrom, spokenTo, s.to, index);
  }
  return { ok: true, letter, vowelSub, T, al: { from: al.from, to: al.to, emit: al.emit[0] }, row };
}

/**
 * Flag letter issues using tuned thresholds.
 * A pair flags when its context/window LLR is at or below `pairs[key].llr`.
 * Optional `fam` / `gop` floors must also fail when present (AND), to keep false alarms down.
 */
export function judgeLetterRows(rows, thresholds) {
  if (!thresholds) return [];
  const issues = [];
  const seen = new Set();
  const push = (x) => {
    const k = `${x.i}:${x.kind}:${x.sub}`;
    if (seen.has(k)) return;
    seen.add(k);
    issues.push(x);
  };
  for (const row of rows) {
    if (!(row.emit > -4)) continue; // unaligned / not clearly present
    for (const s of row.pairs) {
      const th = thresholds.pairs?.[s.key];
      if (!th || th.llr == null) continue;
      const score = s.llr;
      if (!(score <= th.llr)) continue;
      if (th.fam != null && !(s.fam <= th.fam)) continue;
      if (th.gop != null && !(row.gop <= th.gop)) continue;
      push({ i: row.i, w: row.w, kind: "letter", sub: s.key, type: "letter", r: score, rRef: th.llr, llr: score, heard: s.sisterTok, expected: row.tok });
    }
    if (row.qalqala && thresholds.qalqala?.llr != null) {
      const th = thresholds.qalqala;
      if (row.qalqala.llr <= th.llr && (th.gop == null || row.gop <= th.gop)) {
        push({ i: row.i, w: row.w, kind: "letter", sub: "qalqala", type: "qalqala", r: row.qalqala.llr, rRef: th.llr, llr: row.qalqala.llr, expected: row.tok });
      }
    }
    if (row.ghunna && thresholds[row.ghunna.kind]?.llr != null) {
      const th = thresholds[row.ghunna.kind];
      if (row.ghunna.llr <= th.llr && (th.gop == null || row.gop <= th.gop)) {
        push({ i: row.i, w: row.w, kind: "letter", sub: row.ghunna.kind, type: row.ghunna.kind, r: row.ghunna.llr, rRef: th.llr, llr: row.ghunna.llr, expected: row.tok });
      }
    }
    if (row.extraGhunna && thresholds.extraGhunna?.mass != null) {
      const th = thresholds.extraGhunna;
      if (row.extraGhunna.mass >= th.mass) {
        push({ i: row.i, w: row.w, kind: "letter", sub: "extra-ghunna", type: "extra-ghunna", r: row.extraGhunna.mass, rRef: th.mass, llr: row.extraGhunna.mass, expected: row.tok });
      }
    }
  }
  return issues;
}

export const DEFAULT_THRESHOLDS = { pairs: {}, qalqala: null, ghunna: null, ikhfa: null, extraGhunna: null };
