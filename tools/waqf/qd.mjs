import fs from 'node:fs'; import { analyse } from './evalc.mjs'; import * as C from '/workspace/tecvidtest/src/tajwid-core.js';
const meta=JSON.parse(fs.readFileSync('qdat/meta.json')); const dir='qdat/audio'; const files=fs.readdirSync(dir);
let n=0,hard=0,soft=0,stopsAny=0; const list=[];
for(const m of meta){ const f=files.find(x=>x.startsWith(m.id)); if(!f) continue; let pcm;
  if(f.endsWith('.f32')){const b=fs.readFileSync(`${dir}/${f}`);pcm=new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));} else continue;
  const dbg=[]; const r=await analyse(pcm,'qdat-'+m.id,5,109,{...C.WAQF,debug:dbg},7); n++;
  if(r.runs.length) stopsAny++;
  for(const s of r.stops){ s.soft?soft++:hard++; list.push(`${m.id} w${s.w+7}${s.soft?'s':''} ${(s.len*.04).toFixed(2)}s next${s.next+7}`); } }
console.log(JSON.stringify({clips:n,withPause:stopsAny,hard,soft,flaggedClips:new Set(list.map(x=>x.split(' ')[0])).size})); console.log(list.join('\n'));
