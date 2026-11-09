import fs from 'node:fs'; import * as core from '/workspace/tecvidtest/src/tajwid-core.js'; import { TOKENS, encodePhonemes } from '@tilawa/core'; import { maddType } from '../mtype.mjs';
const c = JSON.parse(fs.readFileSync('corpus.json'));
const MAP = { MonfaselMaddRule: 'munfasil', MottaselMaddRule: 'muttasil', LazemMaddRule: 'lazim' };
const st = {}; const bad = []; const inc = (k) => st[k] = (st[k] || 0) + 1;
for (const l of fs.readFileSync('ri/rule_index.jsonl', 'utf8').split('\n')) { if (!l) continue; const d = JSON.parse(l);
  const at = core.ayahTokens(c.surahs[d.surah - 1].ayahs[d.ayah - 1], encodePhonemes, TOKENS); if (!at) { inc('noTok'); continue; }
  const nW = c.surahs[d.surah - 1].ayahs[d.ayah - 1].w.length; const last = at.toks.length - 1;
  const ours = new Map(); // word -> list of types
  at.toks.forEach((t, i) => { const k = core.tokenClass(t); if (k !== 'madd4' && k !== 'madd6') return; let ty = maddType(d.surah, d.ayah, i); if (i >= last - 1) ty = 'final'; (ours.get(at.wi[i]) ?? ours.set(at.wi[i], []).get(at.wi[i])).push(ty); });
  const theirs = new Map();
  for (const p of d.phones) { const ty = MAP[p.rule]; if (!ty) continue; if (p.base === 'َ') continue; (theirs.get(p.word) ?? theirs.set(p.word, []).get(p.word)).push(ty); }
  for (const [w, L] of theirs) for (const ty of L) { const o = ours.get(w) || []; const j = o.indexOf(ty); if (j >= 0) { o.splice(j, 1); inc('agree ' + ty); } else { inc('ri-only ' + ty + ' ours:' + (o[0] || 'none')); if (bad.length < 25) bad.push(`${d.surah}:${d.ayah} w${w} ${ty} ours=${o.join(',') || 'none'}`); } }
  for (const [w, o] of ours) for (const ty of o) if (ty !== 'final') { inc('ours-only ' + ty); if (bad.length < 40) bad.push(`${d.surah}:${d.ayah} w${w} ours-only ${ty}`); }
}
console.log(Object.entries(st).sort((a, b) => b[1] - a[1])); console.log(bad.join('\n'));
