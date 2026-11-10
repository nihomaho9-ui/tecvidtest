// Encoder-frame features around ayah-end qalqala for a probe: qdat_bench clips + clean pro clips.
import fs from 'node:fs'; import * as core from '/workspace/tecvidtest/src/tajwid-core.js'; import { TOKENS, encodePhonemes } from '@tilawa/core';
core.setEquivalence(TOKENS); const corpus = JSON.parse(fs.readFileSync('corpus.json'));
const rd = k => { const f = `cache2/${k}`; if (!fs.existsSync(f + '.lp')) return null; const L = fs.readFileSync(f + '.lp'), E = fs.readFileSync(f + '.enc');
  const lp = new Float32Array(L.buffer.slice(L.byteOffset, L.byteOffset + L.length)); const enc = new Float32Array(E.buffer.slice(E.byteOffset, E.byteOffset + E.length)); return { lp, T: lp.length / 251, enc }; };
const W = [[0, 6], [0, 12], [-3, 3], [3, 12]];
function feat(c, ayahLike, onlyFinal = true) { const at = core.ayahTokens(ayahLike, encodePhonemes, TOKENS); if (!at) return []; const al = core.alignAyah(c.lp, c.T, at.ids); if (!al) return [];
  const last = at.wi[at.ids.length - 1]; const out = [];
  at.toks.forEach((t, i) => { if (core.tokenClass(t) !== 'qalqala' || (onlyFinal && at.wi[i] !== last)) return; const s = al.start[i]; const f = [];
    for (const [a, b] of W) { const lo = Math.max(0, s + a), hi = Math.min(c.T, s + b); const mean = new Array(512).fill(0), mx = new Array(512).fill(-1e9);
      for (let t2 = lo; t2 < hi; t2++) for (let d = 0; d < 512; d++) { const v = c.enc[t2 * 512 + d]; mean[d] += v / Math.max(1, hi - lo); if (v > mx[d]) mx[d] = v; } f.push(mean.map(v => +v.toFixed(4)), mx.map(v => +v.toFixed(4))); }
    out.push({ i, f, emit: al.emit[i], llr: core.siteLLR(c.lp, c.T, at.ids, al, i, TOKENS.indexOf(core.errorVariant(t, 'qalqala'))) }); });
  return out; }
const rows = [];
const meta = JSON.parse(fs.readFileSync('qdat/meta.json')); const qay = { w: corpus.surahs[4].ayahs[108].w.slice(7) };
for (const m of meta) { const c = rd('qdat-' + m.id); if (!c) continue; for (const x of feat(c, qay)) if (x.i === 26) rows.push({ src: 'qdat', set: parseInt(m.id[0], 16) < 8 ? 'dev' : 'test', y: +m.qalqalah === 0 ? 1 : 0, ...x }); }
for (const [dir, set] of [['audio', 'dev'], ['audio2', 'test']]) for (const f of fs.readdirSync(dir)) { const [rec, s, a] = f.slice(0, -4).split('-'); if (dir === 'audio' && !(+s === 2 && +a <= 41)) continue;
  const c = rd(`${rec}-${s}-${a}`); if (!c) continue; for (const x of feat(c, corpus.surahs[s - 1].ayahs[a - 1])) rows.push({ src: 'pro', rec, set, y: 0, ...x }); }
fs.writeFileSync('qprobe.json', JSON.stringify(rows)); console.log(rows.length, rows.filter(x => x.y).length);
