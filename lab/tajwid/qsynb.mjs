// Synthetic qalqala pairs at every sakin qalqala (mid and final): clean vs release silenced. Writes encoder features.
import fs from 'node:fs'; import { run } from './lp2.mjs'; import * as core from '/workspace/tecvidtest/src/tajwid-core.js'; import { TOKENS, encodePhonemes } from '@tilawa/core';
core.setEquivalence(TOKENS); const corpus = JSON.parse(fs.readFileSync('corpus.json')); const FR = 640, L = 4800;
const job = process.argv[2]; const list = [];
const add = (dir, set, keep) => { for (const f of fs.readdirSync(dir)) { if (!f.endsWith('.f32')) continue; const [r, s, a] = f.slice(0, -4).split('-'); if (keep(+s, +a)) list.push([set, r, +s, +a, `${dir}/${f}`]); } };
if (job === 'dev') { add('audio', 'dev', (s, a) => s === 2 && a <= 41); add('audio3', 'dev', () => true); }
if (job === 'test') add('audio2', 'test', () => true);
const pool = (enc, T, s0, w0, w1) => { const lo = Math.max(0, s0 + w0), hi = Math.min(T, s0 + w1); if (hi <= lo) return null; const m = new Float32Array(512), x = new Float32Array(512).fill(-1e9);
  for (let t = lo; t < hi; t++) for (let d = 0; d < 512; d++) { const v = enc[t * 512 + d]; m[d] += v / (hi - lo); if (v > x[d]) x[d] = v; } return [...m, ...x].map(v => +v.toFixed(3)); };
const out = []; let k = 0;
for (const [set, rec, s, a, f] of list) { const b = fs.readFileSync(f); const pcm = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
  const at = core.ayahTokens(corpus.surahs[s - 1].ayahs[a - 1], encodePhonemes, TOKENS); if (!at) continue; const c = await run(pcm, `${rec}-${s}-${a}`);
  const al = core.alignAyah(c.lp, c.T, at.ids); if (!al) continue; const m = core.measure(al, at);
  for (const x of m.rows) { if (x.k !== 'qalqala' || x.i === 0) continue; const ok = x.emit >= -3 && m.rows[x.i - 1].emit >= -3 && (!m.rows[x.i + 1] || m.rows[x.i + 1].emit >= -3); if (!ok) continue;
    const s0 = al.start[x.i]; const fc = pool(c.enc, c.T, s0, -3, 3); if (!fc) continue; out.push({ set, rec, s, a, i: x.i, L: at.toks[x.i][0], final: x.final, y: 0, f: fc });
    // closure = quietest 10 ms in the token's first 200 ms; silence the next 100 ms (mid) or the rest (final) with 10 ms ramps
    const p0 = Math.max(0, s0 * FR - L), p1 = Math.min(pcm.length, p0 + 3200); let best = p0, be = Infinity;
    for (let p = p0; p + 160 < p1; p += 80) { let e = 0; for (let q = p; q < p + 160; q++) e += pcm[q] * pcm[q]; if (e < be) { be = e; best = p; } }
    const ed = new Float32Array(pcm); const end = x.final ? ed.length : Math.min(ed.length, best + 1600);
    for (let q = best; q < end; q++) { const g = q < best + 160 ? 1 - (q - best) / 160 : !x.final && q > end - 160 ? (q - (end - 160)) / 160 : 0; ed[q] *= g; }
    const e = await run(ed, `${rec}-${s}-${a}-qs${x.i}`); const al2 = core.alignAyah(e.lp, e.T, at.ids); if (!al2) continue;
    const fe = pool(e.enc, e.T, al2.start[x.i], -3, 3); if (fe) out.push({ set, rec, s, a, i: x.i, L: at.toks[x.i][0], final: x.final, y: 1, f: fe, emit2: al2.emit[x.i] }); }
  if (++k % 50 === 0) console.log(job, k, '/', list.length, out.length); }
fs.writeFileSync(`qsyn-${job}.json`, JSON.stringify(out)); console.log('done', job, out.length);
