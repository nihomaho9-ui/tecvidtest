import fs from 'node:fs'; import * as core from '/workspace/tecvidtest/src/tajwid-core.js'; import { TOKENS, encodePhonemes } from '@tilawa/core';
const J = f => JSON.parse(fs.readFileSync(f)); const corpus = J('corpus.json'); const cache = new Map();
const atOf = (s, a) => { const k = s + ':' + a; if (!cache.has(k)) cache.set(k, core.ayahTokens(corpus.surahs[s - 1].ayahs[a - 1], encodePhonemes, TOKENS)); return cache.get(k); };
const wEnd = x => { const at = atOf(x.s, x.a); return at.wi[x.i + 1] !== at.wi[x.i]; };
const c = J('rows-clean.json').filter(x => x.k === 'madd2' && !x.final && x.r > 0 && x.emit >= -3 && x.pe >= -3 && (x.ne ?? 0) >= -3);
const inj = [...J('rows-injdev.json'), ...J('rows-injtest.json')].filter(x => x.inj === 'long' && x.r > 0);
const HR = new Map(J('rows-clean.json').filter(x => x.rec === 'husary').map(x => [`${x.s}:${x.a}:${x.i}`, x.r]));
for (const set of ['dev', 'test']) { const cs = c.filter(x => x.set === set), is = inj.filter(x => x.set === set);
  for (const tr of [1.5, 1.6, 1.8, 2.0]) for (const mode of ['all', 'midword', 'midword+rel']) {
    const f = x => x.r > tr && (mode === 'all' || !wEnd(x)) && (mode !== 'midword+rel' || (HR.get(`${x.s}:${x.a}:${x.i}`) ?? 9) < x.r / 1.5);
    const fa = cs.filter(x => x.rec !== 'husary').filter(f).length, n = cs.filter(x => x.rec !== 'husary').length; const det = is.filter(f).length;
    console.log(set, tr, mode.padEnd(12), 'FA', (100 * fa / n).toFixed(1) + '%', `${fa}/${n}`, 'det', (100 * det / is.length).toFixed(0) + '%', `${det}/${is.length}`, 'midword share inj', (100*is.filter(x=>!wEnd(x)).length/is.length).toFixed(0)+'%'); } }
console.log('--- fused with LLR(long4)');
for (const set of ['dev', 'test']) { const cs = c.filter(x => x.set === set && x.rec !== 'husary'), is = inj.filter(x => x.set === set);
  for (const tr of [1.4, 1.5]) for (const tl of [-12, -10, -8, -6]) { const f = x => x.r > tr && !wEnd(x) && (HR.get(`${x.s}:${x.a}:${x.i}`) ?? 9) < x.r / 1.5 && x.llr?.long4 > tl;
    const fa = cs.filter(f).length; const det = is.filter(f).length; const ay = new Set(cs.map(x => x.rec + x.s + ':' + x.a)).size;
    console.log(set, tr, tl, 'FA/site', (100 * fa / cs.length).toFixed(2) + '%', 'FA/ayah', (100 * fa / ay).toFixed(1) + '%', 'det', (100 * det / is.length).toFixed(0) + '%', 'det midword', (100 * det / is.filter(x => !wEnd(x)).length).toFixed(0) + '%'); } }
