// Before/after for reveal gating and auto-locate. Small alafasy subset.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { revealedIndices } from './gate.mjs';

const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
const REPO = process.env.TARTIL_REPO || ROOT;
process.env.TARTIL_REPO = REPO;
const { makeSession, runClip } = await import('./engine.mjs');
const { assemble } = await import('./clip.mjs');
const { W, nAyah, seg, has, build } = await import('./cases.mjs');

const RECITER = 'alafasy';
const NEED = [];
function add(s, a, b) { for (let x = a; x <= b; x++) NEED.push([s, x]); }
add(1, 1, 7); add(2, 1, 10); add(2, 255, 255); add(36, 1, 6); add(93, 1, 5); add(103, 1, 3); add(112, 1, 4); add(113, 1, 5); add(114, 1, 6);

async function ensureData() {
  fs.mkdirSync('seg', { recursive: true });
  fs.mkdirSync('audio', { recursive: true });
  const recId = 7;
  const surahs = [...new Set([...NEED.map(([s]) => s), 1, 2, 36, 67, 78, 93, 102, 103, 112, 113, 114])];
  for (const s of surahs) {
    const f = `seg/${RECITER}-${s}.json`;
    if (fs.existsSync(f)) continue;
    let all = [];
    for (let pg = 1; pg < 20; pg++) {
      const r = await (await fetch(`https://api.quran.com/api/v4/recitations/${recId}/by_chapter/${s}?fields=segments&per_page=50&page=${pg}`)).json();
      all.push(...r.audio_files);
      if (!r.pagination.next_page) break;
    }
    fs.writeFileSync(f, JSON.stringify(all));
    console.log('seg', RECITER, s, all.length);
  }
  const jobs = [];
  const extra = new Set();
  for (const [s, a] of NEED) {
    for (const x of [a - 1, a, a + 1]) if (x >= 1 && x <= nAyah(s)) extra.add(`${s}:${x}`);
  }
  for (const k of extra) {
    const [s, a] = k.split(':').map(Number);
    const out = `audio/${RECITER}-${s}-${a}.f32`;
    if (fs.existsSync(out)) continue;
    const segs = JSON.parse(fs.readFileSync(`seg/${RECITER}-${s}.json`));
    const e = segs.find((x) => x.verse_key === k);
    if (!e) continue;
    let u = e.url;
    u = u.startsWith('//') ? 'https:' + u : u.startsWith('http') ? u : 'https://verses.quran.com/' + u;
    jobs.push([u, out]);
  }
  console.log('audio jobs', jobs.length);
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const [u, out] = jobs[i++];
      try {
        const b = Buffer.from(await (await fetch(u)).arrayBuffer());
        fs.writeFileSync(out + '.mp3', b);
        const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', out + '.mp3', '-ar', '16000', '-ac', '1', '-f', 'f32le', out], { stdio: 'inherit' });
        fs.unlinkSync(out + '.mp3');
        if (r.status) console.log('ffmpeg fail', out);
      } catch (e) {
        console.log('fail', u, e.message);
      }
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
}

function subsetCases() {
  const allow = new Set(NEED.map(([s, a]) => `${s}:${a}`));
  const all = [];
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  for (const [s, b] of NEED) {
    if (!has(RECITER, s, b)) continue;
    const words = W(s, b);
    const sg = seg(RECITER, s, b);
    if (!sg) continue;
    const A = b > 1 && has(RECITER, s, b - 1) ? b - 1 : null;
    const C = b < nAyah(s) && has(RECITER, s, b + 1) ? b + 1 : null;
    const start = A ?? b;
    const exp = { surah: s, ayah: start, ayahEnd: Math.min(nAyah(s), Math.max((C ?? b) + 1, start + 7)) };
    const full = (a) => ({ s, a });
    const base = { r: RECITER, s, b, exp };
    const id = (k) => `${RECITER}-${s}-${b}-${k}`;
    all.push({ ...base, id: id('clean'), kind: 'clean', parts: [A && full(A), full(b), C && full(C)].filter(Boolean) });
    if (sg.length !== words.length || words.length < 4) continue;
    const n = words.length;
    const k = 1 + Math.floor(rnd() * (n - 2));
    const wordsOf = (drop) => ({ s, a: b, keep: sg.map((x) => x.pos).filter((p) => !drop.includes(p)) });
    all.push({ ...base, id: id('omit'), kind: 'omit', tw: k, parts: [A && full(A), wordsOf([k]), C && full(C)].filter(Boolean) });
    let donor = null;
    for (let t = 0; t < 80 && !donor; t++) {
      const [ds, da] = NEED[Math.floor(rnd() * NEED.length)];
      if (ds === s && Math.abs(da - b) < 3) continue;
      if (!has(RECITER, ds, da)) continue;
      const dsg = seg(RECITER, ds, da);
      const dw = W(ds, da);
      if (!dsg || dsg.length !== dw.length || dw.length < 3) continue;
      const j = 1 + Math.floor(rnd() * (dw.length - 2));
      if (dw[j][1] === words[k][1]) continue;
      const len = dsg[j].en - dsg[j].st, len0 = sg[k].en - sg[k].st;
      if (len < 250 || Math.abs(len - len0) > len0 * 0.8) continue;
      donor = { s: ds, a: da, pos: j };
    }
    if (donor) all.push({ ...base, id: id('sub'), kind: 'sub', tw: k, parts: [A && full(A), { s, a: b, keep: sg.map((x) => x.pos), replace: { at: k, donor } }, C && full(C)].filter(Boolean) });
  }
  const picked = [];
  for (const kind of ['clean', 'omit', 'sub']) {
    const g = all.filter((c) => c.kind === kind);
    const cap = kind === 'clean' ? 16 : 12;
    picked.push(...g.filter((_, i) => i % Math.max(1, Math.floor(g.length / cap)) === 0).slice(0, cap));
  }
  return picked;
}

async function runOne(sess, c, mode) {
  const pcm = assemble(c);
  if (mode === 'before') {
    const r = await runClip(sess, pcm, c.exp, true);
    // engine.mjs already used legacy fill-to-cursor into r.words
    return r;
  }
  // after: no expected lock at start (global locate), reveal only confident ok
  const { s, z, total, setSink } = sess;
  let pos = 0, cur = 0;
  const issues = [];
  const words = new Map();
  const firstLock = { s: 0, a: 0, t: null };
  const CH = 7680;
  const checked = new Set();
  const handle = (m) => {
    if (m.type === 'verse_candidate' && !firstLock.s) {
      const c0 = m.candidates?.[0];
      if (c0?.surah) { firstLock.s = c0.surah; firstLock.a = c0.ayah; firstLock.t = cur / 16000; }
    }
    if (m.type === 'correction' || m.type === 'correction_note') {
      const issue = m.type === 'correction_note' ? m.issue : m.state?.issue;
      const ph = m.state?.phase;
      if (ph === 'error' && issue) {
        if (!(issue.source === 'similar_verse' && issue.kind === 'possible_omission')) {
          issues.push({ s: issue.surah, a: issue.ayah, w: issue.word, kind: issue.kind, src: issue.source, t: cur / 16000 });
        }
        z.correct('review_later');
        if (typeof issue.wordIndex === 'number') z.correction.suppressed?.delete(issue.wordIndex);
      }
      return;
    }
    if (m.type === 'word_progress' && m.surah && m.ayah) {
      if (!firstLock.s) { firstLock.s = m.surah; firstLock.a = m.ayah; firstLock.t = cur / 16000; }
      let all = [];
      try { all = z.verdicts(); } catch { all = []; }
      const idxs = revealedIndices(all, m.surah, m.ayah);
      for (const i of idxs) {
        const k = m.surah + ':' + m.ayah + ':' + i;
        if (!words.has(k)) words.set(k, cur / 16000);
      }
    }
  };
  setSink(handle);
  z.setExpected(null);
  for (; pos < pcm.length; pos += CH) {
    cur = Math.min(pcm.length, pos + CH);
    await s.feed(pcm.subarray(pos, Math.min(pcm.length, pos + CH)));
  }
  cur = pcm.length;
  const ph = z.correction?.state?.phase; if (ph && ph !== 'idle') z.correct('review_later');
  const fl = await s.stop();
  if (Array.isArray(fl)) for (const m of fl) handle(m);
  s.reset();
  setSink(null);
  return { issues, words: Object.fromEntries(words), firstLock };
}

function score(rows) {
  const clean = rows.filter((r) => r.kind === 'clean');
  const sub = rows.filter((r) => r.kind === 'sub');
  const omit = rows.filter((r) => r.kind === 'omit');
  const falseFlags = clean.filter((r) => (r.issues || []).some((i) => i.kind && i.kind !== 'app_hold')).length;
  const falseRevealSub = sub.filter((r) => r.words[`${r.s}:${r.b}:${r.tw}`] != null).length;
  const falseRevealOmit = omit.filter((r) => r.words[`${r.s}:${r.b}:${r.tw}`] != null).length;
  // ayah-start: first word of target ayah revealed even though that clip swapped/omitted word 0, or first word of next ayah revealed immediately after a substitution in previous? 
  // Measure: on sub/omit, was word 0 of the target ayah revealed when tw!==0 too early? We count word 0 revealed on clips where tw is 0 (wrong first word).
  const startWrong = [...sub, ...omit].filter((r) => r.tw === 0);
  const startFalse = startWrong.filter((r) => r.words[`${r.s}:${r.b}:0`] != null).length;
  return {
    n: rows.length,
    clean: clean.length,
    sub: sub.length,
    omit: omit.length,
    cleanFalseFlags: falseFlags,
    cleanFalseFlagsPct: clean.length ? +(100 * falseFlags / clean.length).toFixed(1) : 0,
    falseRevealSub,
    falseRevealSubPct: sub.length ? +(100 * falseRevealSub / sub.length).toFixed(1) : 0,
    falseRevealOmit,
    falseRevealOmitPct: omit.length ? +(100 * falseRevealOmit / omit.length).toFixed(1) : 0,
    ayahStartWrongClips: startWrong.length,
    ayahStartFalseReveals: startFalse,
  };
}

function locateScore(rows) {
  // Target start ayah is c.b (the middle ayah). A preceding ayah A is also in the clip for clean A,B,C.
  // For locate-from-random-start we use firstLock vs the first part of the clip.
  let ok = 0, n = 0;
  for (const r of rows) {
    if (r.kind !== 'clean' || !r.firstLock) continue;
    n++;
    const firstPart = r.parts?.[0];
    const wantS = firstPart?.s ?? r.s;
    const wantA = firstPart?.a ?? (r.b > 1 ? r.b - 1 : r.b);
    if (r.firstLock.s === wantS && Math.abs(r.firstLock.a - wantA) <= 1) ok++;
  }
  return { locateN: n, locateOk: ok, locatePct: n ? +(100 * ok / n).toFixed(1) : 0 };
}

// Random-start locate: play only the target ayah, no expected passage, maybe starting mid-ayah.
async function locateRandom(sess, cases) {
  const cleans = cases.filter((c) => c.kind === 'clean' && has(c.r, c.s, c.b));
  let ok = 0, midOk = 0, n = 0, midN = 0;
  const { s, z, setSink } = sess;
  for (const c of cleans) {
    const path = `audio/${c.r}-${c.s}-${c.b}.f32`;
    if (!fs.existsSync(path)) continue;
    const buf = fs.readFileSync(path);
    const pcm = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
    const sg = seg(c.r, c.s, c.b);
    async function once(slice, expectA) {
      let lock = null;
      setSink((m) => {
        if (lock) return;
        if (m.type === 'verse_candidate' && m.candidates?.[0]) lock = { s: m.candidates[0].surah, a: m.candidates[0].ayah };
        if (m.type === 'word_progress' && m.surah) lock = { s: m.surah, a: m.ayah };
      });
      z.setExpected(null);
      const CH = 7680;
      for (let pos = 0; pos < slice.length; pos += CH) await s.feed(slice.subarray(pos, Math.min(slice.length, pos + CH)));
      const fl = await s.stop();
      if (Array.isArray(fl)) for (const m of fl) {
        if (lock) break;
        if (m.type === 'verse_candidate' && m.candidates?.[0]) lock = { s: m.candidates[0].surah, a: m.candidates[0].ayah };
        if (m.type === 'word_progress' && m.surah) lock = { s: m.surah, a: m.ayah };
      }
      s.reset();
      setSink(null);
      return lock && lock.s === c.s && lock.a === expectA;
    }
    n++;
    if (await once(pcm, c.b)) ok++;
    if (sg && sg.length >= 4) {
      const mid = Math.min(pcm.length, Math.round(sg[1].st * 16));
      const slice = pcm.subarray(mid);
      if (slice.length > 16000) {
        midN++;
        if (await once(slice, c.b)) midOk++;
      }
    }
  }
  return {
    fromAyahStart: { n, ok, pct: n ? +(100 * ok / n).toFixed(1) : 0 },
    fromMidAyah: { n: midN, ok: midOk, pct: midN ? +(100 * midOk / midN).toFixed(1) : 0 },
  };
}

function refsOf(c){
  const out=[];
  for (const p of c.parts||[]){
    out.push([c.r,p.s,p.a]);
    if(p.replace?.donor) out.push([c.r,p.replace.donor.s,p.replace.donor.a]);
  }
  return out;
}

async function ensureAudio(pairs){
  fs.mkdirSync('audio',{recursive:true});
  const jobs=[];
  for (const [r,s,a] of pairs){
    if(!r||!s||!a) continue;
    const f=`seg/${r}-${s}.json`;
    if(!fs.existsSync(f)) continue;
    const out=`audio/${r}-${s}-${a}.f32`;
    if(fs.existsSync(out)) continue;
    const segs=JSON.parse(fs.readFileSync(f));
    const e=segs.find(x=>x.verse_key===`${s}:${a}`);
    if(!e) continue;
    let u=e.url; u=u.startsWith('//')?'https:'+u:u.startsWith('http')?u:'https://verses.quran.com/'+u;
    jobs.push([u,out]);
  }
  console.log('extra audio jobs',jobs.length);
  let i=0;
  async function worker(){while(i<jobs.length){const [u,out]=jobs[i++];try{const b=Buffer.from(await (await fetch(u)).arrayBuffer());fs.writeFileSync(out+'.mp3',b);const r=spawnSync('ffmpeg',['-loglevel','error','-y','-i',out+'.mp3','-ar','16000','-ac','1','-f','f32le',out],{stdio:'inherit'});fs.unlinkSync(out+'.mp3');if(r.status)console.log('ffmpeg fail',out);}catch(e){console.log('fail',u,e.message);}}}
  await Promise.all(Array.from({length:8},worker));
}

const outPath = 'measure-v33.json';
await ensureData();
const cases0 = subsetCases();
const needPairs=[]; for(const c of cases0) needPairs.push(...refsOf(c));
// Donors may be in other TARGETS of the same reciter; fetch those segs too.
const donorSurahs=[...new Set(needPairs.map(p=>p[1]))];
await ensureData(); // segs already for NEED; fetch missing donor segs
for (const s of donorSurahs){
  const f=`seg/${RECITER}-${s}.json`;
  if(fs.existsSync(f)) continue;
  let all=[]; for(let pg=1;pg<20;pg++){const r=await (await fetch(`https://api.quran.com/api/v4/recitations/7/by_chapter/${s}?fields=segments&per_page=50&page=${pg}`)).json();all.push(...r.audio_files);if(!r.pagination.next_page)break;}
  fs.writeFileSync(f,JSON.stringify(all));
  console.log('donor seg',s,all.length);
}
await ensureAudio(needPairs);
const cases=cases0.filter(c=>refsOf(c).every(([r,s,a])=>fs.existsSync(`audio/${r}-${s}-${a}.f32`)));
console.log('cases', cases.length, Object.fromEntries(Object.entries(cases.reduce((a, c) => (a[c.kind] = (a[c.kind] || 0) + 1, a), {}))));

const sess = await makeSession({ slipHead: false, structural: { ayahOrder: true, similarVerse: true, timing: 'pause' } });
const before = [];
const after = [];
for (const c of cases) {
  let pcm;
  try { pcm = assemble(c); } catch (e) { console.log('skip', c.id, e.message); continue; }
  process.stdout.write(c.id + ' before\n');
  const b = await runClip(sess, pcm, c.exp, true);
  before.push({ id: c.id, kind: c.kind, s: c.s, b: c.b, tw: c.tw, issues: b.issues, words: b.words, parts: c.parts });
  process.stdout.write(c.id + ' after\n');
  const a = await runOne(sess, c, 'after');
  after.push({ id: c.id, kind: c.kind, s: c.s, b: c.b, tw: c.tw, issues: a.issues, words: a.words, firstLock: a.firstLock, parts: c.parts });
}

console.log('locate random...');
const locate = await locateRandom(sess, cases);
const report = {
  when: new Date().toISOString(),
  reciter: RECITER,
  cases: cases.length,
  before: { ...score(before), locateDuringAbc: locateScore(before.map((r, i) => ({ ...r, firstLock: null }))) },
  after: { ...score(after), locateDuringAbc: locateScore(after) },
  locate,
};
// before locateDuringAbc is not measured in runClip; leave empty
delete report.before.locateDuringAbc;
fs.writeFileSync(outPath, JSON.stringify({ report, before, after }, null, 2));
console.log(JSON.stringify(report, null, 2));
