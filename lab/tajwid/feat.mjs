// acoustic helpers: steady-region finder and cut with crossfade
const SR=16000, HOP=160, WIN=400;
function fftMag(x){const n=512;const re=new Float64Array(n),im=new Float64Array(n);for(let i=0;i<x.length&&i<n;i++)re[i]=x[i]*(0.54-0.46*Math.cos(2*Math.PI*i/(x.length-1)));
 for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]];}}
 for(let len=2;len<=n;len<<=1){const a=-2*Math.PI/len;for(let i=0;i<n;i+=len)for(let k=0;k<len/2;k++){const c=Math.cos(a*k),s=Math.sin(a*k);const xr=re[i+k+len/2]*c-im[i+k+len/2]*s,xi=re[i+k+len/2]*s+im[i+k+len/2]*c;re[i+k+len/2]=re[i+k]-xr;im[i+k+len/2]=im[i+k]-xi;re[i+k]+=xr;im[i+k]+=xi;}}
 const m=new Float64Array(64);for(let k=1;k<256;k++){const b=Math.min(63,Math.floor(64*Math.log(1+k)/Math.log(256)));m[b]+=re[k]*re[k]+im[k]*im[k];}return m.map(v=>Math.log(v+1e-9));}
export function frames(pcm,s0,s1){const out=[];for(let s=Math.max(0,s0);s+WIN<=Math.min(pcm.length,s1);s+=HOP){let e=0;for(let i=s;i<s+WIN;i++)e+=pcm[i]*pcm[i];out.push({s,e:10*Math.log10(e/WIN+1e-12),spec:fftMag(pcm.subarray(s,s+WIN))});}
 for(let i=1;i<out.length;i++){let d=0;for(let k=0;k<64;k++)d+=Math.abs(out[i].spec[k]-out[i-1].spec[k]);out[i].flux=d/64;} if(out[0])out[0].flux=9;return out;}
// longest steady voiced run in [s0,s1): returns [a,b] samples
export function steady(pcm,s0,s1,peakDb){const f=frames(pcm,s0,s1);let best=[0,0],cur=-1;
 for(let i=0;i<=f.length;i++){const ok=i<f.length&&f[i].e>peakDb-25&&f[i].flux<1.0; if(ok){if(cur<0)cur=i;} else if(cur>=0){if(i-cur>best[1]-best[0])best=[cur,i];cur=-1;}}
 if(best[1]===best[0])return null; return [f[best[0]].s+WIN/2, f[best[1]-1].s+WIN/2];}
export function peakDb(pcm){let mx=-200;for(let s=0;s+WIN<=pcm.length;s+=HOP*4){let e=0;for(let i=s;i<s+WIN;i++)e+=pcm[i]*pcm[i];mx=Math.max(mx,10*Math.log10(e/WIN+1e-12));}return mx;}
// remove `n` samples centred in [a,b] with 15 ms crossfade
export function cut(pcm,a,b,n){const X=240;const mid=Math.floor((a+b)/2);const c0=Math.max(a,mid-Math.floor(n/2)),c1=c0+n;const out=new Float32Array(pcm.length-n);
 out.set(pcm.subarray(0,c0));for(let i=0;i<X;i++){const w=i/X;out[c0-X+i]=pcm[c0-X+i]*(1-w)+pcm[c1-X+i]*w;}out.set(pcm.subarray(c1),c0);return out;}
