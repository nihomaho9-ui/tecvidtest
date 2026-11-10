// like evalc but the clip is preceded by the previous ayah + 0.6 s gap (as in the app's window)
import fs from 'node:fs'; import { analyse } from './evalc.mjs'; import * as C from '/workspace/tecvidtest/src/tajwid-core.js';
const rd=f=>{const b=fs.readFileSync(f);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));};
let n=0,h=0,sf=0; const list=[];
for(const f of process.argv.slice(2)){ const key=f.split('/').pop().replace('.f32',''); const [r,s,a]=key.split('-'); const pf=f.replace(`-${s}-${a}.f32`,`-${s}-${a-1}.f32`);
  if(!+s||!fs.existsSync(pf)) continue; const p=rd(pf), x=rd(f); const pcm=new Float32Array(p.length+9600+x.length); pcm.set(p,0); pcm.set(x,p.length+9600);
  const res=await analyse(pcm,'pv-'+key,+s,+a); if(!res) continue; n++; for(const q of res.stops){ q.soft?sf++:h++; list.push(`${key} w${q.w}${q.soft?'s':''} ${(q.len*.04).toFixed(2)}s next${q.next}`);} }
console.log(JSON.stringify({ayahs:n,hard:h,soft:sf})); console.log(list.join('\n'));
