// fbank loudness per 10 ms frame for a clip, fed exactly like the app (7680-sample chunks)
import { KaldiFbank } from '@tilawa/core';
export function fbLoud(pcm){ const fb=new KaldiFbank(); const out=[];
  const push=(fr)=>{ for(const f of fr){ let s=0; for(let i=0;i<f.length;i++) s+=f[i]; out.push(s/f.length);} };
  for(let i=0;i<pcm.length;i+=7680) push(fb.acceptWaveform(pcm.subarray(i,i+7680)));
  push(fb.acceptWaveform(new Float32Array(24000))); push(fb.inputFinished());
  return Float32Array.from(out); }
