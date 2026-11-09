import fs from 'node:fs'; import {logprobs,readPcm} from './lp.mjs'; import {ayahTokens,forceAlign,tok,klass} from './align.mjs';
const R=process.argv[2]||'husary'; const A=JSON.parse(process.argv[3]||'[[2,1,41]]'); const all=[];
fs.mkdirSync('lpc',{recursive:true});
for(const [s,a0,a1] of A) for(let a=a0;a<=a1;a++){ const f=`audio/${R}-${s}-${a}.f32`; if(!fs.existsSync(f))continue;
  const cf=`lpc/${R}-${s}-${a}.bin`; let lp,T; if(fs.existsSync(cf)){const b=fs.readFileSync(cf);lp=new Float32Array(b.buffer,b.byteOffset,b.length/4);T=lp.length/251;} else {({lp,T}=await logprobs(readPcm(f))); fs.writeFileSync(cf,Buffer.from(lp.buffer));}
  const {ids,wi}=ayahTokens(s,a); const {seg}=forceAlign(lp,T,ids);
  ids.forEach((id,i)=>{ if(i===0||i===ids.length-1)return; const last=i===ids.length-2; all.push({s,a,i,t:tok(id),k:klass(tok(id)),final:wi[i]===wi[ids.length-1],d1:seg[i+1].s-seg[i].s,d2:seg[i+1].s-seg[i-1].s,d3:seg[i+1].s-seg[i-1].e});});}
fs.writeFileSync(`tok-${R}.json`,JSON.stringify(all));
const g={}; for(const x of all){const key=x.k+(x.final?'_F':''); (g[key]??=[]).push(x);}
const st=(v)=>{v=[...v].sort((a,b)=>a-b);const q=p=>v[Math.floor(p*(v.length-1))];return `${q(.1)}/${q(.5)}/${q(.9)}`;};
for(const [k,v] of Object.entries(g).sort()) console.log(k.padEnd(12),String(v.length).padStart(4),'d1',st(v.map(x=>x.d1)),'d2',st(v.map(x=>x.d2)),'d3',st(v.map(x=>x.d3)));
