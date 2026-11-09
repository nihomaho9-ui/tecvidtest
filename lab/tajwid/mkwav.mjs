// Build continuous test recordings (16 kHz wav) of a run of ayahs, optionally with injected tajwid errors.
import fs from 'node:fs'; import {readPcm} from './lp.mjs'; import {lpFor} from './lpget.mjs'; import {analyse} from './det.mjs'; import {steady,peakDb,cut} from './feat.mjs';
const [R,s,a0,a1,F,EVERY,out]=process.argv.slice(2); const S=+s, F_=+F, every=+(EVERY||1); const L=4800,FR=640;
const parts=[new Float32Array(16000)]; const truth=[]; let n=0;
for(let a=+a0;a<=+a1;a++){ let pcm=readPcm(`audio/${R}-${S}-${a}.f32`);
  if(F_>0){ const {lp,T}=await lpFor(R,S,a); const base=analyse(lp,T,S,a); const pk=peakDb(pcm);
    const targets=base.t.filter(x=>x.r&&!x.final&&['madd4','ghunnaS','ikhfa'].includes(x.k));
    // apply cuts from the end so earlier sample positions stay valid
    const picks=targets.filter((_,i)=>i%every===0).sort((x,y)=>y.i-x.i);
    for(const x of picks){ const prev=base.t[x.i-1], next=base.t[x.i+1]; const st=steady(pcm,prev.s*FR-L,next.s*FR-L,pk); if(!st)continue;
      const want=F_*(x.k==='madd4'?(x.d2-base.unit)*FR:(x.d2-base.uo)*FR); const m=Math.min(Math.floor(want),Math.max(0,(st[1]-st[0])-1600)); if(m<800)continue;
      pcm=cut(pcm,st[0],st[1],m); truth.push({s:S,a,i:x.i,w:x.w,k:x.k}); } }
  parts.push(pcm, new Float32Array(9600)); n+=1; }
parts.push(new Float32Array(48000));
const len=parts.reduce((t,p)=>t+p.length,0); const pcm=new Float32Array(len); let o=0; for(const p of parts){pcm.set(p,o);o+=p.length;}
const buf=Buffer.alloc(44+len*2); buf.write('RIFF',0); buf.writeUInt32LE(36+len*2,4); buf.write('WAVEfmt ',8); buf.writeUInt32LE(16,16); buf.writeUInt16LE(1,20); buf.writeUInt16LE(1,22); buf.writeUInt32LE(16000,24); buf.writeUInt32LE(32000,28); buf.writeUInt16LE(2,32); buf.writeUInt16LE(16,34); buf.write('data',36); buf.writeUInt32LE(len*2,40);
for(let i=0;i<len;i++) buf.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(pcm[i]*32767))),44+i*2);
fs.mkdirSync('wav',{recursive:true}); fs.writeFileSync(`wav/${out}.wav`,buf); fs.writeFileSync(`wav/${out}.truth.json`,JSON.stringify(truth));
console.log(out,(len/16000).toFixed(1)+'s',n,'ayahs',truth.length,'injected');
