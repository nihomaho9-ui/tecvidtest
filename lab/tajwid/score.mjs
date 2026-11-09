import fs from 'node:fs';
const rd=f=>fs.readFileSync(f,'utf8').split('\n').filter(l=>l.startsWith('{"a"')).map(JSON.parse).filter(r=>!r.skip);
const F1=rd('injF1.log'), F05=rd('injF05.log');
const clean={}; for(const R of ['husary','minshawi','alafasy']) clean[R]=JSON.parse(fs.readFileSync(`clean-${R}.json`));
const TH={madd4:[1.8,2.0],ghunnaS:[1.45,1.6],ikhfa:[1.2,1.3]};
for(const [k,ths] of Object.entries(TH)) for(const th of ths){
 const det=(rows)=>{const v=rows.filter(r=>r.k===k);return `${v.filter(r=>r.r1<th).length}/${v.length}`;};
 const fa=R=>{const v=clean[R].filter(x=>x.k===k);return (100*v.filter(x=>x.r<th).length/v.length).toFixed(1)+'%';};
 console.log(k.padEnd(8),'th',th,'| full-removal',det(F1),'| half-removal',det(F05),'| clean FA husary',fa('husary'),'minshawi',fa('minshawi'),'alafasy',fa('alafasy'));
 const other=[...F1,...F05].filter(r=>r.k===k).reduce((s,r)=>s+r.other,0); }
console.log('extra flags elsewhere in edited ayahs:', [...F1,...F05].reduce((s,r)=>s+r.other,0), 'over', F1.length+F05.length,'edits');
