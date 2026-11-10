import fs from 'node:fs'; import { analyse, marksOf } from './evalc.mjs'; import * as C from '/workspace/tecvidtest/src/tajwid-core.js';
const rd=f=>{const b=fs.readFileSync(f);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));};
const cat=(...p)=>{const n=p.reduce((t,x)=>t+x.length,0);const o=new Float32Array(n);let i=0;for(const x of p){o.set(x,i);i+=x.length;}return o;};
const res={A:[0,0],B:[0,0],C:[0,0]}; const bad=[]; const SIL=+(process.env.SIL||1.2);
for(let a=1;a<=60;a++){ const f=`audio/husary-2-${a}.f32`; if(!fs.existsSync(f)) continue; const pcm=rd(f);
  const pj=JSON.parse(fs.readFileSync(`prep/ayah/2-${a}.json`)); const sg=typeof pj.seg==='string'?JSON.parse(pj.seg):pj.seg; if(!sg||sg.length<4) continue;
  const mk=marksOf(2,a); const room=pcm.subarray(800, Math.max(1600, Math.floor(sg[0][1]*16)-800));
  const sil=()=>{const n=Math.floor(SIL*16000),o=new Float32Array(n);for(let i=0;i<n;i++)o[i]=room[i%room.length];return o;};
  const last=sg.length-1; const cand={A:null,B:null,C:null};
  for(let k=1;k<last-1;k++){ const gap=sg[k+1][1]-sg[k][2]; if(gap>150) continue; const m=mk[k]||'';
    if(!m && !mk[k-1] && !cand.A) cand.A=k; if(/[jqms]/.test(m) && !cand.B) cand.B=k; }
  for(let k=last-2;k>=2;k--){ const gap=sg[k+1][1]-sg[k][2]; if(gap<=150 && !(mk[k]||'') && !mk[k-1] && k!==cand.A){ cand.C=k; break; } }
  for(const [kind,k] of Object.entries(cand)){ if(k==null) continue;
    const cut=Math.floor(((sg[k][2]+sg[k+1][1])/2)*16); let x;
    if(kind==='C'){ const r0=Math.floor(sg[k-1][1]*16)-400; x=cat(pcm.subarray(0,cut),sil(),pcm.subarray(r0)); }
    else x=cat(pcm.subarray(0,cut),sil(),pcm.subarray(cut));
    const r=await analyse(x,`syn${SIL}-${kind}-2-${a}-${k}`,2,a); const hit=r.stops.find(s=>s.w===k);
    let ok; if(kind==='A') ok=!!hit&&!hit.soft; else if(kind==='B') ok=r.stops.length===0; else ok=!!hit&&hit.soft;
    res[kind][0]+=ok?1:0; res[kind][1]++; if(!ok) bad.push(`${kind} 2:${a} k${k} mark=${mk[k]||'-'} got ${JSON.stringify(r.stops)}`); } }
console.log('SIL',SIL,JSON.stringify(res)); console.log(bad.join('\n'));
