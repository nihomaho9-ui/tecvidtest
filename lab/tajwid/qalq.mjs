import fs from 'node:fs'; import {readPcm} from './lp.mjs'; import {lpFor} from './lpget.mjs'; import {analyse} from './det.mjs'; import {frames} from './feat.mjs'; import {TOKENS} from '@tilawa/core';
const id=Object.fromEntries(TOKENS.map((t,i)=>[t,i])); const L=4800,FR=640; const rows=[];
const list=fs.readdirSync('audio').filter(f=>f.startsWith('husary-')).map(f=>f.slice(7,-4).split('-').map(Number));
function gop(lp,T,x,next,prev){ const q=id[x.t], p=id[x.t.replace('ڇ','')]; let best=-1e9; for(let t=Math.max(0,prev.s+1);t<Math.min(T,next.s+1);t++){best=Math.max(best,lp[t*251+q]-lp[t*251+p]);} return best; }
for(const [s,a] of list){ const pcm=readPcm(`audio/husary-${s}-${a}.f32`); const {lp,T}=await lpFor('husary',s,a); const res=analyse(lp,T,s,a);
 for(const x of res.t){ if(x.k!=='qalqala'||x.i===0||x.i===res.t.length-1)continue; const prev=res.t[x.i-1], next=res.t[x.i+1];
  const g0=gop(lp,T,x,next,prev);
  // remove the release: find closure (min energy) in window, then cut 120 ms after it (unreleased stop + no echo)
  const w0=prev.s*FR-L+FR, w1=next.s*FR-L; const f=frames(pcm,w0,w1); if(f.length<10)continue; let mi=0; for(let j=0;j<f.length;j++) if(f[j].e<f[mi].e) mi=j;
  const c0=f[mi].s+200, n=Math.min(1920, (w1-c0)); if(n<640) continue; const ed=new Float32Array(pcm); for(let j=0;j<n;j++){ ed[c0+j]*= j<160? 1-j/160 : 0; } // silence the burst+echo
  const r2=await lpFor('husary',s,a,ed); const res2=analyse(r2.lp,r2.T,s,a); const y=res2.t[x.i]; const g1=gop(r2.lp,r2.T,y,res2.t[x.i+1],res2.t[x.i-1]);
  rows.push({s,a,t:x.t,final:x.final,g0:+g0.toFixed(2),g1:+g1.toFixed(2)}); console.log(JSON.stringify(rows.at(-1))); }}
fs.writeFileSync('qalq-husary.json',JSON.stringify(rows));
