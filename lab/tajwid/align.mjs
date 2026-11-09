import fs from 'node:fs';
import {TOKENS,BLANK_ID,encodePhonemes} from '@tilawa/core';
const C=251;
export const corpus=JSON.parse(fs.readFileSync(new URL('./corpus.json',import.meta.url)));
export function ayahTokens(s,a){ const w=corpus.surahs[s-1].ayahs[a-1].w; const txt=w.map(x=>x[1]).join('');
  const ids=encodePhonemes(txt); // map tokens to word index
  const bounds=[];let p=0; for(let i=0;i<w.length;i++){p+=[...w[i][1]].length;bounds.push(p);}
  let c=0; const wi=ids.map(id=>{const st=c; c+=[...TOKENS[id]].length; let k=0; while(k<bounds.length-1&&st>=bounds[k])k++; return k;});
  return {ids,wi,words:w.map(x=>x[2])}; }
// CTC Viterbi forced alignment. returns per token {s,e} first/last emission frame
export function forceAlign(lp,T,ids){
  const N=ids.length, S=2*N+1; const lab=i=>i%2===0?BLANK_ID:ids[(i-1)>>1];
  let prev=new Float64Array(S).fill(-Infinity); const bp=new Int8Array(T*S);
  prev[0]=lp[0*C+BLANK_ID]; prev[1]=lp[0*C+ids[0]];
  for(let t=1;t<T;t++){const cur=new Float64Array(S).fill(-Infinity);
    for(let s=0;s<S;s++){ let best=prev[s],b=0; if(s>0&&prev[s-1]>best){best=prev[s-1];b=1;}
      if(s>1&&s%2===1&&ids[(s-1)>>1]!==ids[(s-3)>>1]&&prev[s-2]>best){best=prev[s-2];b=2;}
      if(best===-Infinity)continue; cur[s]=best+lp[t*C+lab(s)]; bp[t*S+s]=b; }
    prev=cur;}
  let s=prev[S-1]>prev[S-2]?S-1:S-2; const score=Math.max(prev[S-1],prev[S-2]); const path=new Int32Array(T);
  for(let t=T-1;t>=0;t--){path[t]=s; s-=bp[t*S+s];}
  const seg=ids.map(()=>({s:-1,e:-1}));
  for(let t=0;t<T;t++){const st=path[t]; if(st%2===1){const k=(st-1)>>1; if(seg[k].s<0)seg[k].s=t; seg[k].e=t;}}
  return {seg,score,path};
}
export const tok=id=>TOKENS[id];
// tajwid class of a token
export function klass(t){
  if(/^(ا|ۥ|ۦ)+ۜ?$/.test(t)) { const n=[...t.replace('ۜ','')].length; return 'madd'+n; }
  if(/^(ممم|ننن|ممممَ|ممممُ|ممممِ|ننننَ|ننننُ|ننننِ)$/.test(t)) return 'ghunnaS'; // mushaddad / idgham with ghunna
  if(/^(ںںں|۾۾۾)$/.test(t)) return 'ikhfa';
  if(t.includes('ڇ')) return 'qalqala';
  return 'other';
}
