// Half-cut experiments: session tempo (median unit over the reciter's ayahs in the same surah) and simple fusions.
process.env.NOTUNE = 1; const { R } = await import('./tune.mjs');
const med = v => { const a = [...v].sort((x, y) => x - y); return a[a.length >> 1]; };
const sess = {}; for (const x of R) { if (x.inj !== 'clean' && x.src !== 'qdat') continue; const k = x.src === 'qdat' ? 'qdat' : `${x.rec}:${x.s}`; (sess[k] ??= { u: new Map(), o: new Map() }); sess[k].u.set(`${x.s}:${x.a}:${x.rec}:${x.id ?? ''}`, x.unit); sess[k].o.set(`${x.s}:${x.a}:${x.rec}`, x.uo); }
const SU = {}; for (const [k, v] of Object.entries(sess)) SU[k] = { u: med([...v.u.values()].filter(z => z > 0)), o: med([...v.o.values()].filter(z => z > 0)) };
for (const x of R) { if (x.src === "qdat") { x.rs = x.r; x.rmix = x.r; continue; } const k = `${x.rec}:${x.s}`; const su = SU[k]; if (!su || !(x.span > 0)) continue; x.rs = x.span / (x.k.startsWith('madd') ? su.u : su.o); x.rmix = Math.sqrt(x.r * x.rs); }
const ll = x => { const v = Object.values(x.llr || {}); return v.length ? v[0] : NaN; };
const gate = x => x.emit >= -3 && (x.pe ?? 0) >= -3 && (x.ne ?? 0) >= -3 && !(x.poor > 0.15);
const QASR = new Set(['jibreel', 'rifai', 'husarymj', 'basfar']);
function ev(t, set, f) { const v = R.filter(x => x.task === t && x.set === set && gate(x)); const neg = v.filter(x => !x.y && x.src === 'pro' && x.rec !== 'husary'), qn = v.filter(x => !x.y && x.src === 'qdat');
  const r = (a, g) => a.length ? (100 * a.filter(g).length / a.length).toFixed(0).padStart(3) + '%' : '  - ';
  return `fa ${r(neg, f)} faQ ${r(qn, f)} full ${r(v.filter(x => x.inj === 'full'), f)} half ${r(v.filter(x => x.inj === 'half'), f)} qdat ${r(v.filter(x => x.y && x.src === 'qdat'), f)}`; }
// grid on dev for each feature, FA<=1% pro & qdat, maximize half+qdat; report test
for (const t of ['muttasil', 'munfasil', 'ghunna']) { console.log('==', t);
  for (const feat of ['r', 'rs', 'rmix']) for (const useRel of [false, true]) for (const useL of [false, true]) { let best = null;
    for (let tr = 1.2; tr <= 2.8; tr += 0.05) for (const q of useRel ? [0.7, 0.75, 0.8, 0.85, 0.9] : [9]) for (const tl of useL ? [-16, -14, -12, -10, -8] : [-999]) {
      const f = x => x[feat] < tr && (!useRel || (x.rH > 0 && x.r < q * x.rH)) && (!useL || ll(x) > tl);
      const v = R.filter(x => x.task === t && x.set === 'dev' && gate(x)); const neg = v.filter(x => !x.y && x.src === 'pro' && x.rec !== 'husary'), qn = v.filter(x => !x.y && x.src === 'qdat');
      const fa = Math.max(neg.filter(f).length / Math.max(1, neg.length), qn.length ? qn.filter(f).length / qn.length : 0); if (fa > 0.01) continue;
      const h = v.filter(x => x.inj === 'half'), qd = v.filter(x => x.y && x.src === 'qdat'); const sc = (h.length ? h.filter(f).length / h.length : 0) + (qd.length ? qd.filter(f).length / qd.length : 0);
      if (!best || sc > best.sc) best = { sc, tr: +tr.toFixed(2), q, tl, f }; }
    if (best) console.log(`${feat.padEnd(4)} rel:${useRel ? 1 : 0} llr:${useL ? 1 : 0}`, JSON.stringify({ tr: best.tr, q: best.q, tl: best.tl }).padEnd(34), 'TEST', ev(t, 'test', best.f)); } }
