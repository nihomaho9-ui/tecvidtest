import fs from 'node:fs'; import { run } from './lp2.mjs'; import { clipFeatures } from './feats.mjs';
const corpus = JSON.parse(fs.readFileSync('corpus.json')); const meta = JSON.parse(fs.readFileSync('qdat/meta.json'));
const ay = { w: corpus.surahs[4].ayahs[108].w.slice(7) }; const out = [];
for (const m of meta) { const b = fs.readFileSync(`qdat/audio/${m.id}.f32`); const pcm = new Float32Array(b.buffer, b.byteOffset, b.length / 4);
  const r = await run(pcm, 'qdat-' + m.id); const f = clipFeatures(r.lp, r.T, ay); out.push({ ...m, f }); }
fs.writeFileSync('qdat/feats.json', JSON.stringify(out)); console.log('done', out.length, out.filter(x => !x.f).length, 'failed');
console.log(JSON.stringify(out[0].f.sites.map(s=>[s.i,s.k,s.t,+s.r.toFixed(2),s.llr])));
