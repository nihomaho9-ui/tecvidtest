// Compute per-frame CTC log-probs (25 Hz) for a 16k f32 clip using the app's Zipformer model; cached to lp/*.bin
import fs from 'node:fs';
import * as ort from 'onnxruntime-node';
import { KaldiFbank, ZipformerRunner, DEFAULT_ZIPFORMER_IO } from '@tilawa/core';
let runner=null;
export async function getRunner(){ if(!runner){const m=fs.readFileSync(new URL('./model.onnx',import.meta.url)); runner=await ZipformerRunner.create(ort,m,DEFAULT_ZIPFORMER_IO,['cpu']);} return runner; }
export async function logprobs(pcm){
  const r=await getRunner(); r.reset(); const fb=new KaldiFbank();
  const out=[]; let n=0;
  const push=async(frames)=>{ if(!frames.length) return; const res=await r.accept(frames); if(res.frames){out.push(res.logProbs.slice(0,res.frames*251)); n+=res.frames;} };
  const CH=7680; for(let i=0;i<pcm.length;i+=CH) await push(fb.acceptWaveform(pcm.subarray(i,i+CH)));
  // tail flush with 1.5 s silence
  await push(fb.acceptWaveform(new Float32Array(24000))); await push(fb.inputFinished());
  const all=new Float32Array(n*251); let o=0; for(const a of out){all.set(a,o);o+=a.length;}
  return {lp:all,T:n};
}
export function readPcm(p){const b=fs.readFileSync(p); return new Float32Array(b.buffer,b.byteOffset,b.byteLength/4);}
