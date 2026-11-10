// False alarms of the ayah-end qalqala check on clean qaris (audio3: surahs 85, 89, 96, 111-113; letters ق ط ب ج د).
import fs from 'node:fs'; import { run } from './lp2.mjs'; import * as core from '/workspace/tecvidtest/src/tajwid-core.js'; import { TOKENS, encodePhonemes } from '@tilawa/core';
core.setEquivalence(TOKENS); const corpus = JSON.parse(fs.readFileSync('corpus.json')); const P = JSON.parse(fs.readFileSync('/workspace/tecvidtest/src/tajwid-qprobe.json'));
const st = { probe: [0, 0], llr: [0, 0] }; const byL = {}; const hits = [];
for (const f of fs.readdirSync('audio3').filter(f => f.endsWith('.f32'))) { const [rec, s, a] = f.slice(0, -4).split('-'); const b = fs.readFileSync('audio3/' + f);
  const pcm = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); const c = await run(pcm, `${rec}-${s}-${a}`);
  const at = core.ayahTokens(corpus.surahs[s - 1].ayahs[a - 1], encodePhonemes, TOKENS); if (!at) continue; const al = core.alignAyah(c.lp, c.T, at.ids); if (!al) continue; const m = core.measure(al, at);
  const qi = m.rows.filter(x => x.k === 'qalqala' && x.final).map(x => x.i); if (!qi.length) continue;
  const llr = i => core.siteLLR(c.lp, c.T, at.ids, al, i, TOKENS.indexOf(core.errorVariant(at.toks[i], 'qalqala')));
  const okEnc = c.enc && c.enc.length === c.T * 512;
  const a1 = core.judge(m, { tj: [] }, { at, qprobe: okEnc ? i => core.qprobeScore(c.enc, c.T, al.start[i], P) : undefined, llr }).filter(x => x.kind === 'qalqala');
  const a2 = core.judge(m, { tj: [] }, { at, llr }).filter(x => x.kind === 'qalqala');
  for (const i of qi) { const L = at.toks[i][0]; byL[L] ??= [0, 0, 0]; byL[L][2]++; st.probe[1]++; st.llr[1]++;
    if (a1.some(x => x.i === i)) { st.probe[0]++; byL[L][0]++; hits.push(`${rec} ${s}:${a} ${L}`); } if (a2.some(x => x.i === i)) { st.llr[0]++; byL[L][1]++; } } }
console.log(JSON.stringify(st), JSON.stringify(byL)); console.log(hits.join('\n'));
