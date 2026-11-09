import fs from 'node:fs'; import * as core from '/workspace/tecvidtest/src/tajwid-core.js'; import { TOKENS, encodePhonemes } from '@tilawa/core';
const c = JSON.parse(fs.readFileSync('corpus.json')); const cache = new Map();
export function maddType(s, a, i) { const k = s + ':' + a; if (!cache.has(k)) cache.set(k, core.ayahTokens(c.surahs[s - 1].ayahs[a - 1], encodePhonemes, TOKENS)); const at = cache.get(k);
  const t = at.toks[i], nx = at.toks[i + 1] || ''; const sameWord = at.wi[i + 1] === at.wi[i];
  if ([...t].length >= 6) return 'lazim'; if (nx.startsWith('ء')) return sameWord ? 'muttasil' : 'munfasil'; return 'other4'; }
if (process.argv[1].endsWith('mtype.mjs')) { const rows = JSON.parse(fs.readFileSync('rows-clean.json')); const g = {};
  for (const x of rows) { if (!['madd4', 'madd6'].includes(x.k) || x.final || !(x.r > 0)) continue; const k = x.rec + ' ' + maddType(x.s, x.a, x.i); (g[k] ??= []).push(x.r); }
  for (const [k, v] of Object.entries(g).sort()) { v.sort((a, b) => a - b); const q = p => v[Math.floor(p * (v.length - 1))].toFixed(2); console.log(k.padEnd(22), String(v.length).padStart(3), 'p5', q(.05), 'p50', q(.5)); } }
