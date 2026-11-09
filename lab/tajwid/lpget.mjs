import fs from 'node:fs'; import {logprobs,readPcm} from './lp.mjs';
export async function lpFor(R,s,a,pcm){const cf=`lpc/${R}-${s}-${a}.bin`; if(!pcm&&fs.existsSync(cf)){const b=fs.readFileSync(cf);const lp=new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));return {lp,T:lp.length/251};}
 const r=await logprobs(pcm||readPcm(`audio/${R}-${s}-${a}.f32`)); if(!pcm)fs.writeFileSync(cf,Buffer.from(r.lp.buffer)); return r;}
