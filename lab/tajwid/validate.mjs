// App-path validation: the shipped judge() with real prep reference files, on cached log-probs.
import fs from 'node:fs'; import * as core from '/workspace/tecvidtest/src/tajwid-core.js'; import { TOKENS, encodePhonemes } from '@tilawa/core';
core.setEquivalence(TOKENS); if (process.env.RULES) for (const [k, v] of Object.entries(JSON.parse(process.env.RULES))) core.RULES[k] = v;
const corpus = JSON.parse(fs.readFileSync('corpus.json')); const MODE = process.argv[2] || 'after';
const PROBE = process.env.NOPROBE ? null : JSON.parse(fs.readFileSync('/workspace/tecvidtest/src/tajwid-qprobe.json'));
const lpOf = k => { const f = `cache2/${k}.lp`; if (!fs.existsSync(f)) return null; const b = fs.readFileSync(f); const lp = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); const ef = `cache2/${k}.enc`; let enc = null; if (fs.existsSync(ef)) { const e = fs.readFileSync(ef); enc = new Float32Array(e.buffer.slice(e.byteOffset, e.byteOffset + e.length)); } return { lp, T: lp.length / 251, enc }; };
const refs = new Map(); for (const d of ['/tmp/vref/out', '/workspace/tecvid-lab/prep-pages']) if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) if (/^\d+\.json$/.test(f)) for (const a of JSON.parse(fs.readFileSync(`${d}/${f}`)).ayahs) refs.set(`${a.s}:${a.a}`, a);
// BEFORE = the previous app judge (madd4 1.85 / ghunna 1.45 / ikhfa 1.2, all with 0.72 x Husary), no qalqala.
function judgeBefore(m, ref) { const refMap = new Map((ref.tj || []).map(x => [x[0], x])); const out = [];
  for (const x of m.rows) { const th = core.KINDS[x.k]; if (!th || x.final || !(x.r > 0)) continue; const p = m.rows[x.i - 1], n = m.rows[x.i + 1];
    if (x.emit < -3 || (p && p.emit < -3) || (n && n.emit < -3)) continue; const r0 = refMap.get(x.i); if (!r0) continue; if (x.r >= th || x.r >= core.REL * r0[2]) continue;
    out.push({ i: x.i, kind: x.k.startsWith('madd') ? 'madd' : x.k }); } return out; }
function analyse(lpT, ayahLike, ref) { const at = core.ayahTokens(ayahLike, encodePhonemes, TOKENS); if (!at) return null; const { lp, T } = lpT;
  const al = core.alignAyah(lp, T, at.ids); if (!al) return null; const m = core.measure(al, at);
  const llr = i => { const alt = core.errorVariant(at.toks[i], core.tokenClass(at.toks[i])); const id = alt === undefined ? -1 : TOKENS.indexOf(alt); return id >= 0 ? core.siteLLR(lp, T, at.ids, al, i, id) : NaN; };
  const issues = MODE === 'before' ? judgeBefore(m, ref) : core.judge(m, ref, { llr, at, qprobe: PROBE && lpT.enc && lpT.enc.length === T * 512 ? (i => core.qprobeScore(lpT.enc, T, al.start[i], PROBE)) : undefined });
  const kindOf = x => { const k = core.tokenClass(at.toks[x.i]); if (k === 'madd2') return 'long'; if (k.startsWith('madd')) { const t = core.maddType(at, x.i, ref.mt); return t === 'munfasil' ? 'munfasil' : 'muttasil'; } return k; };
  return { m, at, issues, kindOf };
}
const QASR = new Set(['jibreel', 'rifai', 'husarymj', 'basfar']);
const S = {}; const add = (k, f, v) => { S[k] ??= {}; S[k][f] ??= [0, 0]; S[k][f][1]++; if (v) S[k][f][0]++; };
// clean pro clips: every checkable site is a negative
for (const [dir, set] of [['audio', 'dev'], ['audio2', 'test']]) for (const f of fs.readdirSync(dir)) { const [rec, s, a] = f.slice(0, -4).split('-'); if (dir === 'audio' && !(+s === 2 && +a <= 41)) continue;
  const ref = refs.get(`${s}:${a}`); const lpT = lpOf(`${rec}-${s}-${a}`); if (!ref || !lpT) continue; const r = analyse(lpT, corpus.surahs[s - 1].ayahs[a - 1], ref); if (!r) continue;
  const flagged = new Set(r.issues.map(x => x.i));
  for (const x of r.m.rows) { const k = core.tokenClass(r.at.toks[x.i]); if (k === 'other' || x.i === 0) continue; if (k === 'qalqala' && !x.final) continue; if (k !== 'qalqala' && x.final) continue;
    const kind = r.kindOf(x); if (kind === 'munfasil' && QASR.has(rec)) continue; add(`${set} FA ${rec === 'husary' ? 'husary' : 'others'}`, kind, flagged.has(x.i)); } }
// injected
const inj = [...JSON.parse(fs.readFileSync('rows-injdev.json')), ...JSON.parse(fs.readFileSync('rows-injtest.json'))];
for (const y of inj) { const ref = refs.get(`${y.s}:${y.a}`); const lpT = lpOf(`${y.rec}-${y.s}-${y.a}-${y.i}-${y.inj}`); if (!ref || !lpT) continue;
  const r = analyse(lpT, corpus.surahs[y.s - 1].ayahs[y.a - 1], ref); if (!r) continue; const kind = r.kindOf({ i: y.i }); add(`${y.set} inj ${y.inj}`, kind, r.issues.some(z => z.i === y.i)); }
// qdat_bench (5:109 words 7..end); Husary reference = the same span of Husary's own reading
const meta = JSON.parse(fs.readFileSync('qdat/meta.json')); const qay = { w: corpus.surahs[4].ayahs[108].w.slice(7) };
const hlp = lpOf('husary-5-109q') || null;
const HQ = JSON.parse(fs.readFileSync('qdat/husary-ref.json'));
const qref = { tj: HQ.filter(z => core.KINDS[z.k] && z.r >= core.KINDS[z.k] * 1.08).map(z => [z.i, z.k, z.r]), all: HQ.map(z => [z.i, z.k, z.r > 0 ? z.r : null, z.emit >= -3 && (z.pe ?? 0) >= -3 && (z.ne ?? 0) >= -3 ? 1 : 0, null, z.final ? 1 : 0]) };
const QL = { 11: ['munfasil', x => +x.separate_madd < 4], 13: ['ghunna', x => +x.noon_moshaddadah_len === 0], 16: ['ikhfa', x => +x.noon_mokhfah_len < 2], 26: ['qalqala', x => +x.qalqalah === 0], 1: ['long', x => +x.qalo_alif_len >= 3], 3: ['long', x => +x.qalo_waw_len >= 3], 5: ['long', x => +x.laa_alif_len >= 3], 20: ['long', x => +x.allam_alif_len >= 3] };
for (const x of meta) { const lpT = lpOf('qdat-' + x.id); if (!lpT) continue; const r = analyse(lpT, qay, qref); if (!r) continue; const set = parseInt(x.id[0], 16) < 8 ? 'dev' : 'test';
  for (const [i, [kind, isErr]] of Object.entries(QL)) { const hit = r.issues.some(z => z.i === +i); add(`${set} qdat ${isErr(x) ? 'err(TPR)' : 'ok(FPR)'}`, kind, hit); } }
const kinds = ['muttasil', 'munfasil', 'ghunna', 'ikhfa', 'qalqala', 'long'];
console.log(MODE.toUpperCase().padEnd(22), kinds.map(k => k.padStart(13)).join(''));
for (const k of Object.keys(S).sort()) console.log(k.padEnd(22), kinds.map(t => { const v = S[k][t]; return (v ? `${(100 * v[0] / v[1]).toFixed(0)}% ${v[0]}/${v[1]}` : '-').padStart(13); }).join(''));
