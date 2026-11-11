// Shared Zipformer inference for letter-GOP evaluation (Node, onnxruntime-node).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as ort from "onnxruntime-node";
import { KaldiFbank, ZipformerRunner, DEFAULT_ZIPFORMER_IO } from "@tilawa/core";

// One intra-op thread by default: we share the box with nice-0 band workers and
// 14 ORT threads just get preempted. Override with ORT_THREADS=N.
const ORT_THREADS = Math.max(1, Number(process.env.ORT_THREADS || 1) || 1);
process.env.OMP_NUM_THREADS = String(ORT_THREADS);
process.env.ORT_NUM_THREADS = String(ORT_THREADS);

const here = path.dirname(fileURLToPath(import.meta.url));
export const APP = path.resolve(here, "../..");
export const LAB = path.resolve(here, "../../.."); // /workspace/letter-lab
export const MODEL = path.join(APP, "public/model.onnx");

export function readWavPcm16k(file) {
  const buf = fs.readFileSync(file);
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WAVE") {
    const pcm = decodeWavPcm(buf);
    if (pcm) return resampleLinear(pcm.samples, pcm.sr, 16000);
  }
  return ffmpegPcm16k(file);
}

function decodeWavPcm(buf) {
  let off = 12;
  let sr = 0, ch = 0, bits = 0, data = null, fmt = 1;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    const start = off + 8;
    if (id === "fmt ") {
      fmt = buf.readUInt16LE(start);
      ch = buf.readUInt16LE(start + 2);
      sr = buf.readUInt32LE(start + 4);
      bits = buf.readUInt16LE(start + 14);
    } else if (id === "data") {
      data = buf.subarray(start, start + size);
      break;
    }
    off = start + size + (size % 2);
  }
  if (!data || !sr || !ch) return null;
  let mono;
  if (fmt === 1 && bits === 16) {
    const n = Math.floor(data.length / 2);
    const tmp = new Float32Array(Math.floor(n / ch));
    for (let i = 0, o = 0; i + ch <= n; i += ch, o += 1) {
      let s = 0;
      for (let c = 0; c < ch; c += 1) s += data.readInt16LE((i + c) * 2) / 32768;
      tmp[o] = s / ch;
    }
    mono = tmp;
  } else if (fmt === 3 && bits === 32) {
    const n = Math.floor(data.length / 4);
    const tmp = new Float32Array(Math.floor(n / ch));
    for (let i = 0, o = 0; i + ch <= n; i += ch, o += 1) {
      let s = 0;
      for (let c = 0; c < ch; c += 1) s += data.readFloatLE((i + c) * 4);
      tmp[o] = s / ch;
    }
    mono = tmp;
  } else if (fmt === 1 && bits === 32) {
    const n = Math.floor(data.length / 4);
    const tmp = new Float32Array(Math.floor(n / ch));
    for (let i = 0, o = 0; i + ch <= n; i += ch, o += 1) {
      let s = 0;
      for (let c = 0; c < ch; c += 1) s += data.readInt32LE((i + c) * 4) / 2147483648;
      tmp[o] = s / ch;
    }
    mono = tmp;
  } else return null;
  return { samples: mono, sr };
}

function resampleLinear(x, sr, target) {
  if (sr === target) return x;
  const n = Math.max(1, Math.round(x.length * target / sr));
  const o = new Float32Array(n);
  const scale = (x.length - 1) / Math.max(1, n - 1);
  for (let i = 0; i < n; i += 1) {
    const p = i * scale;
    const j = Math.floor(p);
    const f = p - j;
    const a = x[j];
    const b = x[Math.min(j + 1, x.length - 1)];
    o[i] = a + (b - a) * f;
  }
  return o;
}

export function ffmpegPcm16k(file) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-f", "f32le", "-acodec", "pcm_f32le", "-ac", "1", "-ar", "16000", "pipe:1"], {
    maxBuffer: 80 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error(`ffmpeg failed on ${file}: ${(r.stderr || "").toString().slice(0, 400)}`);
  return new Float32Array(r.stdout.buffer, r.stdout.byteOffset, Math.floor(r.stdout.byteLength / 4));
}

export function readPcm16kSliceWav(file, t0, t1) {
  const pcm = readWavPcm16k(file);
  const a = Math.max(0, Math.floor(t0 * 16000));
  const b = Math.min(pcm.length, Math.ceil(t1 * 16000));
  return pcm.subarray(a, Math.max(a + 1, b));
}

let runner = null;
export async function getRunner() {
  if (!runner) {
    const model = fs.readFileSync(MODEL);
    if (ort.env) {
      ort.env.intraOpNumThreads = ORT_THREADS;
      ort.env.interOpNumThreads = 1;
    }
    const session = await ort.InferenceSession.create(model, {
      executionProviders: ["cpu"],
      graphOptimizationLevel: "all",
      intraOpNumThreads: ORT_THREADS,
      interOpNumThreads: 1,
    });
    runner = ZipformerRunner.fromSession(session, DEFAULT_ZIPFORMER_IO, ort.Tensor);
    log("ort session ready threads", ORT_THREADS);
  }
  return runner;
}

/** Streaming Zipformer log-posteriors, with a short flush pad so the last phones leave the encoder. */
export async function logprobs(pcm, padSamples = 16000) {
  const r = await getRunner();
  r.reset();
  const fb = new KaldiFbank();
  const L = [];
  let n = 0;
  const push = async (fr) => {
    if (!fr.length) return;
    const out = await r.accept(fr);
    if (out.frames) {
      L.push(out.logProbs.slice(0, out.frames * 251));
      n += out.frames;
    }
  };
  const STEP = 7680;
  for (let i = 0; i < pcm.length; i += STEP) await push(fb.acceptWaveform(pcm.subarray(i, i + STEP)));
  if (padSamples) await push(fb.acceptWaveform(new Float32Array(padSamples)));
  await push(fb.inputFinished());
  const t = L.reduce((s, a) => s + a.length, 0);
  const lp = new Float32Array(t);
  let k = 0;
  for (const a of L) { lp.set(a, k); k += a.length; }
  return { lp, T: n };
}

export function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj));
}

export function appendJsonl(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.appendFileSync(p, JSON.stringify(obj) + "\n");
}

export function log(...a) {
  const ts = new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "Asia/Riyadh" });
  fs.writeSync(1, `[${ts} Asia/Riyadh] ` + a.map(String).join(" ") + "\n");
}
