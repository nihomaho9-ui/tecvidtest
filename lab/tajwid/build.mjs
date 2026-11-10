// Feature rows for clean clips and injected errors. usage: node build.mjs <job> ; jobs: clean | injdev | injtest
import fs from 'node:fs'; import { run } from './lp2.mjs'; import { clipFeatures } from './feats.mjs'; import { steady, peakDb, cut, stretch } from './feat.mjs';
const corpus = JSON.parse(fs.readFileSync('corpus.json')); const job = process.argv[2]; const FR = 640, L = 4800;
const rd = f => { const b = fs.readFileSync(f); return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const ay = (s, a) => corpus.surahs[s - 1].ayahs[a - 1];
const list = [];
if (job === 'clean') { for (const f of fs.readdirSync('audio')) { const [r, s, a] = f.slice(0, -4).split('-'); if (+s === 2 && +a <= 41) list.push(['dev', r, +s, +a, 'audio/' + f]); }
  for (const f of fs.readdirSync('audio2')) { const [r, s, a] = f.slice(0, -4).split('-'); list.push(['test', r, +s, +a, 'audio2/' + f]); } }
if (job === 'clean3') for (const f of fs.readdirSync('audio3')) { if (!f.endsWith('.f32')) continue; const [r, s, a] = f.slice(0, -4).split('-'); list.push(['dev', r, +s, +a, 'audio3/' + f]); }
if (job === 'injdev3') for (const f of fs.readdirSync('audio3')) { if (!f.endsWith('.f32')) continue; const [r, s, a] = f.slice(0, -4).split('-'); if (['minshawi', 'abdulbasit', 'maher'].includes(r)) list.push(['dev', r, +s, +a, 'audio3/' + f]); }
if (job === 'injdev') for (let a = 1; a <= 41; a++) list.push(['dev', 'husary', 2, a, `audio/husary-2-${a}.f32`]);
if (job === 'injtest') for (const r of ['husary', 'minshawi', 'abdulbasit']) { for (let a = 1; a <= 30; a++) list.push(['test', r, 36, a, `audio2/${r}-36-${a}.f32`]); for (let a = 1; a <= 20; a++) list.push(['test', r, 67, a, `audio2/${r}-67-${a}.f32`]); }
const out = []; let k = 0;
for (const [set, r, s, a, f] of list) { if (!fs.existsSync(f)) continue; const pcm = rd(f); const key = `${r}-${s}-${a}`;
  const base = await run(pcm, key); const F = clipFeatures(base.lp, base.T, ay(s, a)); if (!F) continue;
  if (job === 'clean' || job === 'clean3') { for (const x of F.sites) out.push({ ...x, set, rec: r, s, a, y: 0, inj: "clean", unit: F.unit, uo: F.uo, poor: F.poor }); continue; }
  const pk = peakDb(pcm); let m2 = 0;
  for (const x of F.sites) { if (x.final) continue;
    const w0 = x.s0 * FR - L, w1 = x.s1 * FR - L; const st = steady(pcm, w0, w1, pk); if (!st) continue;
    const edits = [];
    if (['madd4', 'madd6', 'ghunna', 'ikhfa'].includes(x.k)) { const extra = (x.span - (x.k.startsWith('madd') ? F.unit : F.uo)) * FR; for (const fr of [1, 0.5]) edits.push([fr === 1 ? 'full' : 'half', -Math.floor(fr * extra)]); }
    if (x.k === 'madd2' && (m2++ % 3 === 0)) edits.push(['long', Math.floor(F.unit * FR * 0.9)]);
    for (const [name, n] of edits) { let ed;
      if (n < 0) { const m = Math.min(-n, Math.max(0, (st[1] - st[0]) - 1600)); if (m < 800) continue; ed = cut(pcm, st[0], st[1], m); }
      else { if (st[1] - st[0] < 2000) continue; ed = stretch(pcm, st[0], st[1], n); }
      const e = await run(ed, `${key}-${x.i}-${name}`); const G = clipFeatures(e.lp, e.T, ay(s, a)); const y = G?.sites.find(z => z.i === x.i); if (!y) continue;
      out.push({ ...y, set, rec: r, s, a, y: 1, inj: name, unit: G.unit, uo: G.uo, poor: G.poor }); } }
  if (++k % 10 === 0) console.log(job, k, out.length); }
fs.writeFileSync(`rows-${job}.json`, JSON.stringify(out)); console.log('done', job, out.length);
