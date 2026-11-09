import fs from 'node:fs'; import {lpFor} from './lpget.mjs'; import {analyse} from './det.mjs';
const R=process.argv[2]; const out=[];
for(let a=1;a<=41;a++){ if(!fs.existsSync(`audio/${R}-2-${a}.f32`))continue; const {lp,T}=await lpFor(R,2,a); const res=analyse(lp,T,2,a);
  for(const x of res.t) if(x.r&&!x.final&&x.k!=='other'&&x.k!=='qalqala') out.push({a,k:x.k,r:+x.r.toFixed(2)});}
const g={}; for(const x of out)(g[x.k]??=[]).push(x.r);
for(const [k,v] of Object.entries(g)){v.sort((a,b)=>a-b);const q=p=>v[Math.floor(p*(v.length-1))];console.log(R,k.padEnd(8),v.length,'p2',q(.02),'p10',q(.1),'p50',q(.5),'p90',q(.9));}
fs.writeFileSync(`clean-${R}.json`,JSON.stringify(out));
