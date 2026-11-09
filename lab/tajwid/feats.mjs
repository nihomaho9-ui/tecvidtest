// Per-site tajwid features for one clip: duration ratio + local Viterbi LLR (error variant vs expected).
import * as core from '/workspace/tecvidtest/src/tajwid-core.js';
import { TOKENS, encodePhonemes } from '@tilawa/core';
core.setEquivalence(TOKENS);
export const ID = Object.fromEntries(TOKENS.map((t, i) => [t, i]));
const C = 251;
// error variants per token class
export function variants(t, k) {
  const v = [];
  const base = t[0];
  if (k === 'madd4' || k === 'madd6' || k === 'madd5') { v.push(['short2', base + base]); if (k === 'madd6') v.push(['short4', base.repeat(4)]); }
  if (k === 'madd2') { v.push(['long4', base.repeat(4)]); v.push(['short1', null]); }
  if (k === 'ghunna') { const vow = t.slice(-1); const c = t[0]; v.push(['plain', /[َُِ]/.test(vow) ? c + vow : c]); }
  if (k === 'ikhfa') v.push(['izhar', t[0] === 'ں' ? 'ن' : 'م']);
  if (k === 'qalqala') v.push(['noq', t.replace('ڇ', '')]);
  return v.filter(([, x]) => x === null || ID[x] !== undefined);
}
export function siteLLR(lp, T, ids, al, i, alt, ctx = 3) {
  const a = Math.max(0, i - ctx), b = Math.min(ids.length, i + ctx + 1);
  const f0 = Math.max(0, al.start[a] - 12), f1 = Math.min(T, (b < ids.length ? al.start[b] : al.to + 1) + 12);
  const sub = lp.subarray(f0 * C, f1 * C); const n = f1 - f0;
  const exp = ids.slice(a, b);
  const alt_ = [...ids.slice(a, i), ...(alt === null ? [] : [ID[alt]]), ...ids.slice(i + 1, b)];
  const e = core.alignAyah(sub, n, exp, 1.2), x = core.alignAyah(sub, n, alt_, 1.2);
  if (!e || !x) return NaN;
  return x.score - e.score;
}
export function clipFeatures(lp, T, ayahLike) {
  const at = core.ayahTokens(ayahLike, encodePhonemes, TOKENS);
  if (!at) return null;
  const al = core.alignAyah(lp, T, at.ids);
  if (!al) return null;
  const m = core.measure(al, at);
  const sites = [];
  for (const x of m.rows) {
    if (x.k === 'other' || x.i === 0) continue;
    const f = { i: x.i, k: x.k, t: at.toks[x.i], w: x.w, final: x.final, r: x.r, span: x.span, emit: x.emit,
      pe: m.rows[x.i - 1]?.emit, ne: m.rows[x.i + 1]?.emit, s0: al.start[x.i - 1], s1: al.start[x.i + 1] ?? al.to, llr: {} };
    for (const [name, alt] of variants(at.toks[x.i], x.k)) f.llr[name] = +siteLLR(lp, T, at.ids, al, x.i, alt).toFixed(2);
    sites.push(f);
  }
  return { unit: m.unit, uo: m.uo, poor: m.poor, sites, from: al.from, to: al.to, n: at.ids.length };
}
