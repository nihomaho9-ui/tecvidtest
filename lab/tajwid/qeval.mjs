import fs from 'node:fs';
const D = JSON.parse(fs.readFileSync('qdat/feats.json'));
const site = (x, i) => x.f.sites.find(s => s.i === i);
const tasks = {
  'munfasil short (<4)': { i: 11, lab: x => +x.separate_madd < 4 },
  'ghunna partial': { i: 13, lab: x => +x.noon_moshaddadah_len === 0 },
  'ikhfa not done': { i: 16, lab: x => +x.noon_mokhfah_len < 2 },
  'qalqala missing': { i: 26, lab: x => +x.qalqalah === 0 },
  'qalo_waw long': { i: 3, lab: x => +x.qalo_waw_len >= 3 },
  'qalo_waw short': { i: 3, lab: x => +x.qalo_waw_len <= 1 },
};
function auc(pos, neg) { let s = 0; for (const p of pos) for (const n of neg) s += p > n ? 1 : p === n ? 0.5 : 0; return s / (pos.length * neg.length || 1); }
for (const [name, t] of Object.entries(tasks)) {
  const rows = D.map(x => ({ y: t.lab(x), s: site(x, t.i) })).filter(r => r.s);
  const pos = rows.filter(r => r.y), neg = rows.filter(r => !r.y);
  const feats = { '-r': r => -(r.s.r || 0) };
  for (const k of Object.keys(rows[0].s.llr)) feats['llr.' + k] = r => r.s.llr[k];
  const line = Object.entries(feats).map(([fn, f]) => `${fn}=${auc(pos.map(f), neg.map(f)).toFixed(2)}`).join(' ');
  console.log(name.padEnd(22), `pos ${pos.length} neg ${neg.length}`, 'AUC', line);
}
// "before": current app thresholds (ratio only, emit gates)
const TH = { 11: 1.85, 13: 1.45, 16: 1.2 };
for (const [name, t] of Object.entries(tasks)) { if (!TH[t.i]) continue;
  const rows = D.map(x => ({ y: t.lab(x), s: site(x, t.i) })).filter(r => r.s);
  const flag = r => r.s.r < TH[t.i] && r.s.emit >= -3 && r.s.pe >= -3 && r.s.ne >= -3;
  const pos = rows.filter(r => r.y), neg = rows.filter(r => !r.y);
  console.log('BEFORE', name.padEnd(22), 'TPR', (100*pos.filter(flag).length/pos.length).toFixed(0)+'%', 'FPR', (100*neg.filter(flag).length/neg.length).toFixed(0)+'%'); }
