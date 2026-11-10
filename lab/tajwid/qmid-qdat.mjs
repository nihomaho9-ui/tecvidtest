import fs from 'node:fs'; import * as core from '/workspace/tecvidtest/src/tajwid-core.js'; import { TOKENS, encodePhonemes } from '@tilawa/core';
core.setEquivalence(TOKENS); const corpus = JSON.parse(fs.readFileSync('corpus.json')); const PM = JSON.parse(fs.readFileSync('/workspace/tecvidtest/src/tajwid-qmid.json'));
const meta = JSON.parse(fs.readFileSync('qdat/meta.json')); const qay = { w: corpus.surahs[4].ayahs[108].w.slice(7) }; const at = core.ayahTokens(qay, encodePhonemes, TOKENS);
const c = {}; for (const m of meta) { const f = `cache2/qdat-${m.id}`; const L = fs.readFileSync(f + '.lp'), E = fs.readFileSync(f + '.enc'); const lp = new Float32Array(L.buffer.slice(L.byteOffset, L.byteOffset + L.length)), enc = new Float32Array(E.buffer.slice(E.byteOffset, E.byteOffset + E.length)); const T = lp.length / 251;
  const al = core.alignAyah(lp, T, at.ids); if (!al) continue; const ms = core.measure(al, at);
  for (const x of ms.rows) if (x.k === 'qalqala' && !x.final) { const k = `t${x.i} ${at.toks[x.i]}`; c[k] ??= [0, 0, 0]; c[k][1]++; const p = ms.rows[x.i - 1], n = ms.rows[x.i + 1]; if (x.emit < -3 || p.emit < -3 || n.emit < -3) { c[k][2]++; continue; } if (core.qprobeScore(enc, T, al.start[x.i], PM) > 0) c[k][0]++; } }
console.log('qdat mid-ayah qalqala sites: [flagged, total, gated]', JSON.stringify(c));
