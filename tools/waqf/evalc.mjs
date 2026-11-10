// usage: node waqf/evalc.mjs <minRun> <files...>   per-ayah clips named reciter-s-a.f32
import fs from 'node:fs'; import { run } from '../lp2.mjs'; import { fbLoud } from './loud.mjs';
import { TOKENS, encodePhonemes } from '@tilawa/core';
import * as C from '/workspace/tecvidtest/src/tajwid-core.js';
C.setEquivalence(TOKENS);
const corpus=JSON.parse(fs.readFileSync('/workspace/tecvidtest/public/corpus.json'));
const W=JSON.parse(fs.readFileSync(new URL('./waqf.json',import.meta.url))).t;
export const marksOf=(s,a)=>{const o={}; for(const x of (W[s-1][a-1]||'').split(',').filter(Boolean)){const m=/^(\d+)(\D+)$/.exec(x); o[+m[1]]=m[2];} return o;};
const rd=f=>{const b=fs.readFileSync(f);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));};
export function decLoud(L,T){const d=new Float32Array(T); for(let t=0;t<T;t++){let m=-Infinity; for(let j=0;j<4;j++){const k=4*t+j; if(k<L.length&&L[k]>m)m=L[k];} d[t]=m;} return d;}
export async function analyse(pcm,key,s,a,opt=C.WAQF,sub=null){
  const {lp,T}=await run(pcm,key); const loud=decLoud(fbLoud(pcm),T);
  let ay=corpus.surahs[s-1].ayahs[a-1]; let marks=marksOf(s,a);
  if(sub){ ay={...ay,w:ay.w.slice(sub)}; const m={}; for(const [k,v] of Object.entries(marks)) if(+k>=sub) m[+k-sub]=v; marks=m; }
  const at=C.ayahTokens(ay,encodePhonemes,TOKENS); if(!at) return null;
  const al=C.alignAyah(lp,T,at.ids); if(!al) return null;
  const N=at.ids.length; let fl=N-1; while(fl>0&&at.wi[fl-1]===at.wi[N-1]) fl--;
  const runs=C.quietRuns(loud,T,al.from,al.start[fl],{...opt,minRun:8});
  const stops=C.findStops(lp,T,loud,at,al,marks,opt);
  return {stops,runs,marks,at,al,T,lp,loud};
}
if (import.meta.url===`file://${process.argv[1]}`){
  const minRun=+process.argv[2]; const opt={...C.WAQF,minRun};
  let n=0,hard=0,soft=0; const flagged=[]; const lens=[];
  for(const f of process.argv.slice(3)){ const key=f.split('/').pop().replace('.f32',''); const [r,s,a]=key.split('-'); if(!+s) continue;
    const res=await analyse(rd(f),key,+s,+a,opt); if(!res) continue; n++;
    for(const r0 of res.runs) lens.push(r0.e-r0.s);
    for(const x of res.stops){ if(x.soft) soft++; else hard++; flagged.push(`${key} w${x.w}${x.soft?'s':''} ${(x.len*0.04).toFixed(2)}s next${x.next}`); } }
  const h={}; for(const l of lens){const b=Math.min(40,Math.floor(l/2)*2); h[b]=(h[b]||0)+1;}
  console.log(JSON.stringify({minRun,ayahs:n,hard,soft,rate:+((hard+soft)/Math.max(1,n)).toFixed(3),runHist:h}));
  console.log(flagged.slice(0,40).join('\n'));
}
