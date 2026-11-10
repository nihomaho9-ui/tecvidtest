// Encoder features over ikhfa / ghunna token spans: qdat_bench (site 16 ikhfa, 13 ghunna) + clean pro sites (negatives).
import fs from 'node:fs'; import * as core from '/workspace/tecvidtest/src/tajwid-core.js'; import { TOKENS, encodePhonemes } from '@tilawa/core';
core.setEquivalence(TOKENS); const corpus = JSON.parse(fs.readFileSync('corpus.json'));
const rd = k => { const f = `cache2/${k}`; if (!fs.existsSync(f + '.lp') || !fs.existsSync(f + '.enc')) return null; const L = fs.readFileSync(f + '.lp'), E = fs.readFileSync(f + '.enc');
  const lp = new Float32Array(L.buffer.slice(L.byteOffset, L.byteOffset + L.length)); const enc = new Float32Array(E.buffer.slice(E.byteOffset, E.byteOffset + E.length)); return { lp, T: lp.length / 251, enc }; };
const feat = (c, al, i, N) => { const lo = Math.max(0, al.start[i]), hi = Math.min(c.T, i + 1 < N ? Math.max(al.start[i + 1], lo + 1) : lo + 4); const m = new Float32Array(512), x = new Float32Array(512).fill(-1e9);
  for (let t = lo; t < hi; t++) for (let d = 0; d < 512; d++) { const v = c.enc[t * 512 + d]; m[d] += v / (hi - lo); if (v > x[d]) x[d] = v; } return [...m, ...x].map(v => +v.toFixed(3)); };
const rows = [];
const meta = JSON.parse(fs.readFileSync('qdat/meta.json')); const qay = { w: corpus.surahs[4].ayahs[108].w.slice(7) }; const qat = core.ayahTokens(qay, encodePhonemes, TOKENS);
for (const m of meta) { const c = rd('qdat-' + m.id); if (!c) continue; const al = core.alignAyah(c.lp, c.T, qat.ids); if (!al) continue; const ms = core.measure(al, qat); const set = parseInt(m.id[0], 16) < 8 ? 'dev' : 'test';
  for (const [i, k, y] of [[16, 'ikhfa', +m.noon_mokhfah_len < 2 ? 1 : 0], [13, 'ghunna', +m.noon_moshaddadah_len === 0 ? 1 : 0]]) rows.push({ src: 'qdat', set, k, y, r: ms.rows[i].r, emit: ms.rows[i].emit, f: feat(c, al, i, qat.ids.length) }); }
for (const [dir, set] of [['audio', 'dev'], ['audio3', 'dev'], ['audio2', 'test']]) for (const f of fs.readdirSync(dir)) { if (!f.endsWith('.f32')) continue; const [rec, s, a] = f.slice(0, -4).split('-'); if (dir === 'audio' && !(+s === 2 && +a <= 41)) continue;
  const c = rd(`${rec}-${s}-${a}`); if (!c) continue; const at = core.ayahTokens(corpus.surahs[s - 1].ayahs[a - 1], encodePhonemes, TOKENS); if (!at) continue; const al = core.alignAyah(c.lp, c.T, at.ids); if (!al) continue; const ms = core.measure(al, at);
  for (const x of ms.rows) if ((x.k === 'ikhfa' || x.k === 'ghunna') && !x.final && x.i > 0 && x.emit >= -3) rows.push({ src: 'pro', set, rec, k: x.k, y: 0, r: x.r, emit: x.emit, f: feat(c, al, x.i, at.ids.length) }); }
fs.writeFileSync('nprobe.json', JSON.stringify(rows)); console.log(rows.length, JSON.stringify(rows.reduce((o, r) => { const k = `${r.src}-${r.set}-${r.k}-${r.y}`; o[k] = (o[k] || 0) + 1; return o; }, {})));
