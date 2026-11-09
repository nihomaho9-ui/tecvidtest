process.env.NOTUNE = 1;
const { R, evaluate, DET } = await import('./tune.mjs');
const pct = v => isNaN(v) ? '  -' : (100 * v).toFixed(0).padStart(3) + '%';
const show = (name, t, det, p) => { for (const set of ['dev', 'test']) { const e = evaluate(t, set, det, p); console.log(name.padEnd(28), t.padEnd(9), set.padEnd(5), 'faPro', pct(e.faPro), 'faQ', pct(e.faQ), 'full', pct(e.full), 'half', pct(e.half), 'long', pct(e.long), 'qdat', pct(e.qd)); } };
const args = JSON.parse(process.argv[2]);
for (const [name, t, det, p] of args) show(name, t, det, p);
if (process.argv[3]) { const [t, det, p] = JSON.parse(process.argv[3]); const gate = x => x.emit >= -3 && !(x.poor > 0.15);
  const by = {}; for (const x of R) if (x.task === t && !x.y && x.src === 'pro') { const k = x.set + ' ' + x.rec; by[k] ??= [0, 0]; by[k][1]++; if (gate(x) && DET[det](x, p)) by[k][0]++; }
  console.log(by); }
