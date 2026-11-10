// False alarms of both qalqala probes through the shipped judge on clean qaris. usage: node qfa2.mjs <audioDir>
import fs from 'node:fs'; import { run } from './lp2.mjs'; import * as core from '/workspace/tecvidtest/src/tajwid-core.js'; import { TOKENS, encodePhonemes } from '@tilawa/core';
core.setEquivalence(TOKENS); const corpus = JSON.parse(fs.readFileSync('corpus.json'));
const PF = JSON.parse(fs.readFileSync('/workspace/tecvidtest/src/tajwid-qprobe.json')), PM = JSON.parse(fs.readFileSync('/workspace/tecvidtest/src/tajwid-qmid.json'));
const dir = process.argv[2]; const st = { mid: [0, 0], final: [0, 0] }; const byL = {}; const hits = [];
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.f32'))) { const [rec, s, a] = f.slice(0, -4).split('-'); const b = fs.readFileSync(`${dir}/${f}`);
  const c = await run(new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), `${rec}-${s}-${a}`);
  const at = core.ayahTokens(corpus.surahs[s - 1].ayahs[a - 1], encodePhonemes, TOKENS); if (!at) continue; const al = core.alignAyah(c.lp, c.T, at.ids); if (!al) continue; const m = core.measure(al, at);
  if (!(c.enc && c.enc.length === c.T * 512)) continue;
  const iss = core.judge(m, { tj: [] }, { at, qprobe: i => core.qprobeScore(c.enc, c.T, al.start[i], PF), qmid: i => core.qprobeScore(c.enc, c.T, al.start[i], PM) }).filter(x => x.kind === 'qalqala');
  for (const x of m.rows) { if (x.k !== 'qalqala' || x.i === 0) continue; const p = m.rows[x.i - 1], n = m.rows[x.i + 1]; if (x.emit < -3 || p.emit < -3 || (n && n.emit < -3) || m.poor > 0.15) continue;
    const k = x.final ? 'final' : 'mid'; st[k][1]++; const L = k[0] + at.toks[x.i][0]; byL[L] ??= [0, 0]; byL[L][1]++; if (iss.some(z => z.i === x.i)) { st[k][0]++; byL[L][0]++; hits.push(`${rec} ${s}:${a} t${x.i} ${L}`); } } }
console.log(dir, JSON.stringify(st), JSON.stringify(byL)); console.log(hits.slice(0, 20).join('\n'));
