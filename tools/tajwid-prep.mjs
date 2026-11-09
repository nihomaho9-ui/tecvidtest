// Offline Husary murattal reference for the tajwid check: one small JSON per Mushaf page in public/tj/.
// Usage (from a dir holding model.onnx and node_modules with onnxruntime-node + @tilawa/core):
//   node tajwid-prep.mjs <work-dir> <worker> <workers> [fromPage] [toPage]   -> per-ayah results (resumable)
//   node tajwid-prep.mjs <work-dir> pages <out-dir>                           -> build page files from finished ayahs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const core = await import(path.join(repo, "src/tajwid-core.js"));
const [work, mode, arg3, arg4, arg5] = process.argv.slice(2);
const corpus = JSON.parse(fs.readFileSync(path.join(repo, "public/corpus.json"), "utf8"));
const qcf = JSON.parse(fs.readFileSync(path.join(repo, "src/data/qcf-ayahs.json"), "utf8"));
const pages = Array.from({ length: 604 }, (_, i) => (qcf[String(i + 1)] ?? []).map(([k]) => k.split(":").map(Number)));
fs.mkdirSync(path.join(work, "seg"), { recursive: true });
fs.mkdirSync(path.join(work, "ayah"), { recursive: true });

async function segments(s) {
  const f = path.join(work, "seg", `${s}.json`);
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8"));
  const all = [];
  for (let pg = 1; pg < 40; pg += 1) {
    const r = await (await fetch(`https://api.quran.com/api/v4/recitations/6/by_chapter/${s}?fields=segments&per_page=50&page=${pg}`)).json();
    all.push(...r.audio_files);
    if (!r.pagination?.next_page) break;
  }
  fs.writeFileSync(f, JSON.stringify(all));
  return all;
}

if (mode === "pages") {
  const out = arg3;
  fs.mkdirSync(out, { recursive: true });
  let done = 0;
  const have = [];
  for (let p = 1; p <= 604; p += 1) {
    const list = pages[p - 1];
    const rows = list.map(([s, a]) => path.join(work, "ayah", `${s}-${a}.json`));
    if (!rows.length || !rows.every((f) => fs.existsSync(f))) continue;
    const ayahs = rows.map((f) => JSON.parse(fs.readFileSync(f, "utf8")));
    fs.writeFileSync(path.join(out, `${p}.json`), JSON.stringify({ v: 1, p, reciter: "Husary murattal", ayahs }));
    have.push(p);
    done += 1;
  }
  fs.writeFileSync(path.join(out, "index.json"), JSON.stringify({ v: 1, pages: have }));
  console.log("pages written", done);
  process.exit(0);
}

const ort = await import(path.join(work, "node_modules/onnxruntime-node/dist/index.js")).catch(() => import("onnxruntime-node"));
const tl = await import(path.join(work, "node_modules/@tilawa/core/dist/index.js"));
const runner = await tl.ZipformerRunner.create(ort.default ?? ort, fs.readFileSync(path.join(work, "model.onnx")), tl.DEFAULT_ZIPFORMER_IO, ["cpu"]);
async function logprobs(pcm) {
  runner.reset();
  const fb = new tl.KaldiFbank();
  const parts = [];
  let n = 0;
  const push = async (fr) => { if (!fr.length) return; const r = await runner.accept(fr); if (r.frames) { parts.push(r.logProbs.slice(0, r.frames * 251)); n += r.frames; } };
  for (let i = 0; i < pcm.length; i += 7680) await push(fb.acceptWaveform(pcm.subarray(i, i + 7680)));
  await push(fb.acceptWaveform(new Float32Array(24000)));
  await push(fb.inputFinished());
  const lp = new Float32Array(n * 251);
  let o = 0;
  for (const x of parts) { lp.set(x, o); o += x.length; }
  return { lp, T: n };
}

const worker = Number(mode), workers = Number(arg3), p0 = Number(arg4 || 1), p1 = Number(arg5 || 604);
const todo = [];
for (let p = p0; p <= p1; p += 1) for (const [s, a] of pages[p - 1]) todo.push([s, a]);
const mine = todo.filter((_, i) => i % workers === worker);
const segCache = new Map();
let n = 0;
for (const [s, a] of mine) {
  const outF = path.join(work, "ayah", `${s}-${a}.json`);
  if (fs.existsSync(outF)) continue;
  try {
    if (!segCache.has(s)) segCache.set(s, await segments(s));
    const e = segCache.get(s).find((x) => x.verse_key === `${s}:${a}`);
    let url = e.url.startsWith("//") ? "https:" + e.url : e.url.startsWith("http") ? e.url : "https://verses.quran.com/" + e.url;
    const tmp = path.join(work, `tmp-${worker}`);
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    fs.writeFileSync(tmp + ".mp3", buf);
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", tmp + ".mp3", "-ar", "16000", "-ac", "1", "-f", "f32le", tmp + ".f32"]);
    const raw = fs.readFileSync(tmp + ".f32");
    const pcm = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
    const { lp, T } = await logprobs(pcm);
    const at = core.ayahTokens(corpus.surahs[s - 1].ayahs[a - 1], tl.encodePhonemes, tl.TOKENS);
    const al = at && core.alignAyah(lp, T, at.ids);
    const row = { s, a, url, seg: (e.segments || []).map((x) => [x[1] - 1, x[2], x[3]]), tj: [], q: 0 };
    if (al) {
      const m = core.measure(al, at);
      row.q = +(1 - m.poor).toFixed(2);
      for (const x of m.rows) {
        const th = core.KINDS[x.k];
        if (!th || x.final || !(x.r > 0)) continue;
        const pv = m.rows[x.i - 1], nx = m.rows[x.i + 1];
        const ok = x.emit >= -3 && pv.emit >= -3 && nx.emit >= -3 && x.r >= th * 1.08;
        if (ok) row.tj.push([x.i, x.k, +x.r.toFixed(2)]);
      }
    }
    fs.writeFileSync(outF, JSON.stringify(row));
    n += 1;
    if (n % 25 === 0) console.log(new Date().toISOString(), `worker ${worker}`, n, `${s}:${a}`);
  } catch (err) {
    console.log("fail", `${s}:${a}`, err.message);
  }
}
console.log("worker done", worker, n);
