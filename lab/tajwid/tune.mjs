import fs from 'node:fs'; import { maddType } from './mtype.mjs';
const QASR = new Set(['jibreel', 'rifai', 'husarymj', 'basfar']);
const J = f => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : [];
const clean = [...J('rows-clean.json'), ...J('rows-clean3.json')], inj = [...J('rows-injdev.json'), ...J('rows-injtest.json'), ...J('rows-injdev3.json')], Q = J('qdat/feats.json'), HQ = J('qdat/husary-ref.json');
const HR = new Map(clean.filter(x => x.rec === 'husary').map(x => [`${x.s}:${x.a}:${x.i}`, x.r]));
const qsplit = id => (parseInt(id[0], 16) < 8 ? 'dev' : 'test');
const QL = { 11: ['short', x => +x.separate_madd < 4], 13: ['short', x => +x.noon_moshaddadah_len === 0], 16: ['short', x => +x.noon_mokhfah_len < 2], 26: ['qalq', x => +x.qalqalah === 0], 1: ['long', x => +x.qalo_alif_len >= 3], 3: ['long', x => +x.qalo_waw_len >= 3], 5: ['long', x => +x.laa_alif_len >= 3], 20: ['long', x => +x.allam_alif_len >= 3] };
const rows = [];
for (const x of clean) rows.push({ ...x, src: x.rec === 'husarymj' ? 'mujawwad' : 'pro', rH: HR.get(`${x.s}:${x.a}:${x.i}`) });
for (const x of inj) rows.push({ ...x, src: 'inj', rH: HR.get(`${x.s}:${x.a}:${x.i}`) });
for (const x of Q) for (const s of x.f.sites) { const l = QL[s.i]; if (!l) continue;
  rows.push({ ...s, final: false, set: qsplit(x.id), rec: 'qdat', src: 'qdat', y: l[1](x) ? 1 : 0, inj: 'qdat', rH: HQ.find(z => z.i === s.i)?.r, qtask: l[0] }); }
const KIND = { madd4: 'madd', madd6: 'madd', ghunna: 'ghunna', ikhfa: 'ikhfa', madd2: 'long', qalqala: 'qalq' };
const task = x => { const k = KIND[x.k]; if (!k) return null; if (x.src === 'qdat') return x.qtask === 'short' ? (x.k.startsWith('madd') ? 'madd' : k) : x.qtask === 'long' ? 'long' : 'qalq';
  if (k === 'long') return x.inj === 'long' || x.inj === 'clean' ? 'long' : null; if (x.inj === 'long') return null; return k; };
for (const x of rows) { x.task = task(x); if (x.task === 'madd') { const mt = x.src === 'qdat' ? 'munfasil' : maddType(x.s, x.a, x.i); x.task = mt === 'munfasil' ? 'munfasil' : 'muttasil'; if (mt === 'munfasil' && QASR.has(x.rec)) x.task = null; } }
const ok3 = v => v === undefined || v === null || v >= -3; const gate = x => x.emit >= -3 && ok3(x.pe) && ok3(x.ne) && !(x.poor > 0.15);
for (const x of rows) if (x.task === 'qalq') x.task = (x.final || x.src === 'qdat') ? 'qalqK' : 'qalqS';
export const R = rows.filter(x => x.task && (x.task === 'qalqK' || (!x.final && (x.task === 'qalqS' || x.r > 0))));
const ll = x => { const v = Object.values(x.llr || {}); return v.length ? v[0] : NaN; };
export const DET = {
  ratio: (x, p) => x.r < p.tr,
  llr: (x, p) => ll(x) > p.tl,
  and: (x, p) => x.r < p.tr && ll(x) > p.tl,
  rel: (x, p) => x.rH > 0 && x.r < p.tr && x.r < p.q * x.rH,
  relAnd: (x, p) => x.rH > 0 && x.r < p.tr && x.r < p.q * x.rH && ll(x) > p.tl,
  or: (x, p) => x.r < p.tr || ll(x) > p.tl,
};
const long = { ratio: (x, p) => x.r > p.tr, llr: (x, p) => ll(x) > p.tl, and: (x, p) => x.r > p.tr && ll(x) > p.tl, or: (x, p) => x.r > p.tr || ll(x) > p.tl };
const grid = { tr: [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.4, 2.6, 1.5, 1.75, 2.25], tl: [-20, -18, -16, -14, -12, -10, -9, -8, -7, -6, -4, -2, -1, 0, 1, 2, 3, 4, 6, 8], q: [0.6, 0.7, 0.75, 0.8, 0.85, 0.9] };
const longGrid = { tr: [1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.0, 2.2], tl: [-8, -6, -4, -2, 0, 2, 4] };
function* params(names, g) { const [n, ...rest] = names; if (!n) { yield {}; return; } for (const v of g[n]) for (const p of params(rest, g)) yield { [n]: v, ...p }; }
const need = { ratio: ['tr'], llr: ['tl'], and: ['tr', 'tl'], rel: ['tr', 'q'], relAnd: ['tr', 'q', 'tl'], or: ['tr', 'tl'] };
const rate = (v, f) => v.length ? v.filter(f).length / v.length : NaN;
const pct = v => isNaN(v) ? '  - ' : (100 * v).toFixed(0).padStart(3) + '%';
export function evaluate(t, set, det, p, dets = DET) {
  const v = R.filter(x => x.task === t && x.set === set); const f = x => gate(x) && dets[det](x, p);
  const neg = v.filter(x => !x.y && x.src === 'pro'), qn = v.filter(x => !x.y && x.src === 'qdat');
  return { faPro: rate(neg, f), faQ: rate(qn, f), full: rate(v.filter(x => x.inj === 'full'), f), half: rate(v.filter(x => x.inj === 'half'), f), long: rate(v.filter(x => x.inj === 'long'), f), qd: rate(v.filter(x => x.y && x.src === 'qdat'), f), n: [neg.length, qn.length, v.filter(x => x.y).length] };
}
if (process.env.NOTUNE) { } else {
const FA = +(process.argv[2] || 0.015);
const out = {};
for (const t of ['muttasil', 'munfasil', 'ghunna', 'ikhfa', 'long', 'qalqK', 'qalqS']) {
  const dets = t === 'long' ? long : DET; const g = t === 'long' ? longGrid : grid;
  console.log(`\n== ${t} (FA target ${FA * 100}% on dev pro + dev qdat-correct)`);
  for (const det of Object.keys(dets)) { const nm = t === 'long' ? { ratio: ['tr'], llr: ['tl'], and: ['tr', 'tl'], or: ['tr', 'tl'] }[det] : need[det]; let best = null;
    for (const p of params(nm, g)) { const e = evaluate(t, 'dev', det, p, dets); const fa = Math.max(e.faPro || 0, isNaN(e.faQ) ? 0 : e.faQ); if (fa > FA) continue;
      const score = [e.half, e.qd, e.long].filter(z => !isNaN(z)); const sc = score.length ? score.reduce((a, b) => a + b, 0) / score.length : 0; if (!best || sc > best.sc) best = { p, sc, e }; }
    if (!best) { console.log(det.padEnd(7), 'no setting meets FA'); continue; }
    const te = evaluate(t, 'test', det, best.p, dets);
    console.log(det.padEnd(7), JSON.stringify(best.p).padEnd(34), 'DEV fa', pct(best.e.faPro), pct(best.e.faQ), 'full', pct(best.e.full), 'half', pct(best.e.half), 'long', pct(best.e.long), 'qdat', pct(best.e.qd), '| TEST fa', pct(te.faPro), pct(te.faQ), 'full', pct(te.full), 'half', pct(te.half), 'long', pct(te.long), 'qdat', pct(te.qd), te.n.join('/'));
    (out[t] ??= {})[det] = { p: best.p, dev: best.e, test: te }; } }
fs.writeFileSync(`tune-${FA}.json`, JSON.stringify(out));
}
