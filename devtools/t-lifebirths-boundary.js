// t-lifebirths-boundary: REAL lifeBirthsJs / lifeBirths / postOffW extracted from ca2.js; jsrnd wasm (post_life_births) vs JS body. Seeded Math.random, Object.is on x,y,r, draw counts, born counts, out order.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`${['postOffW','lifeBirthsJs','lifeBirths'].map(fn).join('\n')}\nreturn {js:lifeBirthsJs,w:lifeBirths};`;
const bin=process.argv[2]||'wasm/target-jsrnd/wasm32-unknown-unknown/release/ca2core.wasm';
async function inst(thr,WC){let n=0;const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;n++;if(thr&&n>thr)throw new Error('fault');return Math.random()}}})).instance.exports;Object.assign(WC,{e:E,mem:E.memory,jsrnd:true,ok:true,off:false,simOff:false});return E}
const mk=WC=>new Function('WC','location',body)(WC,{search:''});
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
(async()=>{const WC0={};await inst(0,WC0);const M=100003;
let s=5;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
function scen(){const gs=1+Math.floor(r0()*12),nk=Math.floor(r0()*60),counts=new Map(),map=new Map();const x0=r0()*50,x1=x0+50+r0()*400,y0=r0()*50,y1=y0+50+r0()*300;
 for(let i=0;i<nk;i++){const ix=Math.floor((r0()*1.3-0.15)*(x1/gs)),iy=Math.floor((r0()*1.3-0.15)*(y1/gs));const kk=(ix+20000)*M+(iy+20000);counts.set(kk,r0()<0.6?3:Math.floor(r0()*8));if(r0()<0.2)map.set(kk,{});}
 return {gs,counts,map,x0,x1,y0,y1};}
let tot=0,bad=0,drawBad=0,born=0,rej=0;
for(let t=0;t<20000;t++){const S=scen(),pre=[{x:1}],pre2=[{x:1}];const A=mk(WC0),B=mk(WC0);
 const a=w(t*3+1,()=>A.js(S.counts,S.map,M,0,0,S.gs,S.x0,S.x1,S.y0,S.y1,pre));
 const b=w(t*3+1,()=>B.w(S.counts,S.map,M,0,0,S.gs,S.x0,S.x1,S.y0,S.y1,pre2));
 tot++;let ok=a.n===b.n&&a.v===b.v&&pre.length===pre2.length;if(a.n!==b.n)drawBad++;born+=a.v;
 for(let i=0;i<pre.length&&ok;i++){for(const k of ['x','y','r'])if(!Object.is(pre[i][k],pre2[i][k]))ok=false;}
 if(!ok){bad++;if(bad<4)console.log('MISMATCH',t,a,b)}}
// non-zero origin takes the JS path (counted equal)
{const S=scen();const p1=[],p2=[];const a=w(9,()=>mk(WC0).js(S.counts,S.map,M,3,4,S.gs,S.x0,S.x1,S.y0,S.y1,p1)),b=w(9,()=>mk(WC0).w(S.counts,S.map,M,3,4,S.gs,S.x0,S.x1,S.y0,S.y1,p2));if(a.n!==b.n||JSON.stringify(p1)!==JSON.stringify(p2))bad++;}
// fault: throw at draw k (k>=1) -> degraded, births before k kept, lbDeg=1, no redraw, draws == k+1 consumed
let fT=0,fB=0;
for(let t=0;t<200;t++){const S=scen();const full=w(7,()=>mk(WC0).js(S.counts,S.map,M,0,0,S.gs,S.x0,S.x1,S.y0,S.y1,[]));if(full.v<2)continue;
 for(let k=1;k<full.v;k+=Math.max(1,Math.floor(full.v/3))){const WC={},E=await inst(k,WC);const out=[];const r=w(7,()=>mk(WC).w(S.counts,S.map,M,0,0,S.gs,S.x0,S.x1,S.y0,S.y1,out));fT++;
  if(!(WC.lbDeg===1&&WC.lbOff===true&&WC.rndN===k+1&&out.length===k&&r.n===k)){fB++;if(fB<3)console.log("F",k,WC.lbDeg,WC.lbOff,WC.rndN,out.length,r.n,WC.lbErr)}}}
// fault with zero draws consumed: throw before any draw is impossible via js_rnd, so the no-draw fallback is exercised by a missing export
{const WC={};await inst(0,WC);WC.e=Object.assign({},WC.e,{post_life_births:()=>{throw new Error('x')}});const S=scen();const p1=[],p2=[];const a=w(3,()=>mk(WC0).js(S.counts,S.map,M,0,0,S.gs,S.x0,S.x1,S.y0,S.y1,p1)),b=w(3,()=>mk(WC).w(S.counts,S.map,M,0,0,S.gs,S.x0,S.x1,S.y0,S.y1,p2));if(!(WC.lbOff&&!WC.lbDeg&&a.n===b.n&&JSON.stringify(p1)===JSON.stringify(p2)))fB++;}
console.log(JSON.stringify({scenarios:tot,born,mismatch:bad,drawCountMismatch:drawBad,faultCases:fT,faultBad:fB}));process.exit(bad||fB?1:0)})();
