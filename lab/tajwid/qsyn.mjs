// Synthetic "qalqala missing" at the ayah end: silence the release after the closure, rerun the model, score the probe.
import fs from 'node:fs'; import { run } from './lp2.mjs'; import * as core from '/workspace/tecvidtest/src/tajwid-core.js'; import { TOKENS, encodePhonemes } from '@tilawa/core';
core.setEquivalence(TOKENS); const corpus = JSON.parse(fs.readFileSync('corpus.json')); const P = JSON.parse(fs.readFileSync('/workspace/tecvidtest/src/tajwid-qprobe.json'));
const FR = 640, L = 4800; const byL = {}; let n = 0;
const files = fs.readdirSync('audio3').filter(f => f.endsWith('.f32')).filter((_, k) => k % 2 === 0); // half, for time
for (const f of files) { const [rec, s, a] = f.slice(0, -4).split('-'); const b = fs.readFileSync('audio3/' + f); const pcm = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
  const c = await run(pcm, `${rec}-${s}-${a}`); const ay = corpus.surahs[s - 1].ayahs[a - 1]; const at = core.ayahTokens(ay, encodePhonemes, TOKENS); if (!at) continue;
  const al = core.alignAyah(c.lp, c.T, at.ids); if (!al) continue; const m = core.measure(al, at);
  const x = m.rows.find(r => r.k === 'qalqala' && r.final); if (!x) continue;
  // closure = quietest 10 ms inside the qalqala token's first ~200 ms
  const s0 = Math.max(0, al.start[x.i] * FR - L), s1 = Math.min(pcm.length, s0 + 3200); let best = s0, be = Infinity;
  for (let p = s0; p + 160 < s1; p += 80) { let e = 0; for (let q = p; q < p + 160; q++) e += pcm[q] * pcm[q]; if (e < be) { be = e; best = p; } }
  const ed = new Float32Array(pcm); for (let q = best; q < ed.length; q++) ed[q] *= q < best + 160 ? 1 - (q - best) / 160 : 0;
  const e = await run(ed, `${rec}-${s}-${a}-qsyn`); const al2 = core.alignAyah(e.lp, e.T, at.ids); if (!al2) continue; const m2 = core.measure(al2, at);
  const iss = core.judge(m2, { tj: [] }, { at, qprobe: e.enc && e.enc.length === e.T * 512 ? i => core.qprobeScore(e.enc, e.T, al2.start[i], P) : undefined });
  const L0 = at.toks[x.i][0]; byL[L0] ??= [0, 0]; byL[L0][1]++; if (iss.some(z => z.kind === 'qalqala' && z.i === x.i)) byL[L0][0]++; n++; }
const tot = Object.values(byL).reduce((t, v) => [t[0] + v[0], t[1] + v[1]], [0, 0]); console.log('synthetic missing-qalqala detected', tot, JSON.stringify(byL));
