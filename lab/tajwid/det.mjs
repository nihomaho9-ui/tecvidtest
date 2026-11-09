// tajwid duration detector on top of CTC forced alignment
import {ayahTokens,forceAlign,tok,klass} from './align.mjs';
const med=v=>{v=[...v].sort((a,b)=>a-b);return v.length?v[Math.floor(v.length/2)]:NaN;};
export function analyse(lp,T,s,a){const {ids,wi}=ayahTokens(s,a);const {seg,score}=forceAlign(lp,T,ids);const last=wi[ids.length-1];
 const t=ids.map((id,i)=>({i,t:tok(id),k:klass(tok(id)),final:wi[i]===last,w:wi[i],s:seg[i].s,e:seg[i].e}));
 for(let i=1;i<t.length-1;i++)t[i].d2=t[i+1].s-t[i-1].s;
 const m2=t.filter(x=>x.k==='madd2'&&!x.final&&x.d2).map(x=>x.d2), ot=t.filter(x=>x.k==='other'&&!x.final&&x.d2).map(x=>x.d2);
 const unit=m2.length>=3?med(m2):med(ot); const uo=med(ot);
 for(const x of t) if(x.d2){x.r=x.d2/(x.k.startsWith('madd')?unit:uo);} return {t,unit,uo,score};}
export const TH={madd4:1.8,madd6:2.6,ghunnaS:1.45,ikhfa:1.2};
export function flags(res,th=TH){return res.t.filter(x=>x.r&&!x.final&&th[x.k]&&x.r<th[x.k]);}
