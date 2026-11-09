// Error injection on Husary: shorten madd4 -> ~2 counts; shorten ghunna/ikhfa -> plain. Re-run model on edited audio and test detector.
import fs from 'node:fs'; import {readPcm} from './lp.mjs'; import {lpFor} from './lpget.mjs'; import {analyse,flags} from './det.mjs'; import {steady,peakDb,cut} from './feat.mjs';
const R=process.argv[2]||'husary'; const A0=+(process.argv[3]||6), A1=+(process.argv[4]||16), F=+(process.argv[5]||1); const L=4800, FR=640; const rows=[];
for(let a=A0;a<=A1;a++){ const f=`audio/${R}-2-${a}.f32`; if(!fs.existsSync(f))continue; const pcm=readPcm(f); const pk=peakDb(pcm);
 const {lp,T}=await lpFor(R,2,a); const base=analyse(lp,T,2,a);
 const targets=base.t.filter(x=>x.r&&!x.final&&['madd4','ghunnaS','ikhfa'].includes(x.k));
 for(const x of targets){ const prev=base.t[x.i-1], next=base.t[x.i+1];
  const w0=prev.s*FR-L, w1=next.s*FR-L; const st=steady(pcm,w0,w1,pk); if(!st){rows.push({a,i:x.i,k:x.k,skip:'nosteady'});continue;}
  const want = F*(x.k==="madd4" ? (x.d2-base.unit)*FR : (x.d2-base.uo)*FR);   // remove the extra length
  const n=Math.min(Math.floor(want), Math.max(0,(st[1]-st[0])-1600)); if(n<800){rows.push({a,i:x.i,k:x.k,skip:'short',st:st[1]-st[0],want});continue;}
  const ed=cut(pcm,st[0],st[1],n); const r2=await lpFor(R,2,a,ed); const res=analyse(r2.lp,r2.T,2,a);
  const y=res.t[x.i]; const fl=flags(res); const hit=fl.some(z=>z.i===x.i); const other=fl.filter(z=>z.i!==x.i).length;
  rows.push({a,i:x.i,k:x.k,t:x.t,r0:+x.r.toFixed(2),r1:+(y.r??0).toFixed(2),cutMs:Math.round(n/16),steadyMs:Math.round((st[1]-st[0])/16),hit,other});
  console.log(JSON.stringify(rows.at(-1))); }}
fs.writeFileSync(`inj-${R}-${A0}-${A1}-F${F}.json`,JSON.stringify(rows));
const by={}; for(const r of rows){const g=(by[r.k]??={n:0,hit:0,skip:0,other:0});if(r.skip){g.skip++;continue;}g.n++;if(r.hit)g.hit++;g.other+=r.other;} console.log(by);
