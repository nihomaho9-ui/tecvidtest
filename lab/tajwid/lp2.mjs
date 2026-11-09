// log-probs + encoder frames (512-d) for a clip, cached under cache2/<key>.{lp,enc}
import fs from 'node:fs'; import * as ort from 'onnxruntime-node'; import { KaldiFbank, ZipformerRunner, DEFAULT_ZIPFORMER_IO } from '@tilawa/core';
let runner=null; fs.mkdirSync(new URL('./cache2/',import.meta.url),{recursive:true});
export async function run(pcm,key){
  const base=new URL(`./cache2/${key}`,import.meta.url).pathname;
  if(key&&fs.existsSync(base+'.lp')){const b=fs.readFileSync(base+'.lp'),e=fs.readFileSync(base+'.enc');const lp=new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));const enc=new Float32Array(e.buffer.slice(e.byteOffset,e.byteOffset+e.length));return {lp,T:lp.length/251,enc,D:enc.length/(lp.length/251)};}
  if(!runner){runner=await ZipformerRunner.create(ort,fs.readFileSync(new URL('./model.onnx',import.meta.url)),DEFAULT_ZIPFORMER_IO,['cpu']);}
  runner.reset(); const fb=new KaldiFbank(); const L=[],E=[]; let n=0,ne=0;
  const push=async(fr)=>{if(!fr.length)return; const r=await runner.accept(fr); if(r.frames){L.push(r.logProbs.slice(0,r.frames*251));n+=r.frames;} if(r.encoder&&r.encoderFrames){E.push(r.encoder.slice());ne+=r.encoderFrames;}};
  for(let i=0;i<pcm.length;i+=7680) await push(fb.acceptWaveform(pcm.subarray(i,i+7680)));
  await push(fb.acceptWaveform(new Float32Array(24000))); await push(fb.inputFinished());
  const cat=(A)=>{const t=A.reduce((s,a)=>s+a.length,0);const o=new Float32Array(t);let k=0;for(const a of A){o.set(a,k);k+=a.length;}return o;};
  const lp=cat(L), enc=cat(E); if(key){fs.writeFileSync(base+'.lp',Buffer.from(lp.buffer));fs.writeFileSync(base+'.enc',Buffer.from(enc.buffer));}
  return {lp,T:n,enc,D:ne?enc.length/ne:0,ne};
}
