// t-wormgrow-boundary: REAL wormGrowSplitJs / wormGrowSplit / postOffW extracted from ca2.js; jsrnd wasm (post_worm_step) vs JS loop. Seeded Math.random.
// Compares worms/food structure (Object.is on every number, d identity links, worm back-refs), wormStat, draw counts.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var worms=[],food=[],wormStat={split:0,born:0};
${['postOffW','wormGrowSplitJs','wormGrowSplit'].map(fn).join('\n')}
return {js:wormGrowSplitJs,w:wormGrowSplit,st:function(v){if(v){worms=v.worms;food=v.food;wormStat=v.stat;}return {worms:worms,food:food,stat:wormStat}}};`;
const bin=process.argv[2]||'wasm/target-jsrnd/wasm32-unknown-unknown/release/ca2core.wasm';
async function inst(thr,WC){let n=0;const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;n++;if(thr&&n>thr)throw new Error('fault');return Math.random()}}})).instance.exports;Object.assign(WC,{e:E,mem:E.memory,jsrnd:true,ok:true,off:false,simOff:false});return E}
const mk=WC=>new Function('WC','location',body)(WC,{search:''});
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
let s=11;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
function world(){const nW=Math.floor(r0()*r0()*140),worms=[],food=[];for(let i=0;i<nW;i++){const len=Math.floor(r0()*20)+1,wm={x:r0()*100,y:r0()*100,a:r0(),sp:r0(),fr:r0(),ph:r0(),d:[]};for(let k=0;k<len;k++){const f={x:r0()*100,y:r0()*100,r:r0(),worm:wm};wm.d.push(f);food.push(f);}worms.push(wm);}return {worms,food,stat:{split:0,born:0}};}
function clone(W){const m=new Map(),ws=W.worms.map(x=>{const n={...x,d:[]};m.set(x,n);return n}),fm=new Map();const fd=W.food.map(f=>{const n={...f,worm:m.get(f.worm)};fm.set(f,n);return n});W.worms.forEach((x,i)=>{ws[i].d=x.d.map(f=>fm.get(f))});return {worms:ws,food:fd,stat:{...W.stat}}}
function sig(W){const fi=new Map(W.food.map((f,i)=>[f,i])),wi=new Map(W.worms.map((x,i)=>[x,i]));return JSON.stringify({w:W.worms.map(x=>[x.x,x.y,x.a,x.sp,x.fr,x.ph,x.d.map(f=>fi.has(f)?fi.get(f):-1)]),f:W.food.map(f=>[f.x,f.y,f.r,wi.get(f.worm)]),st:W.stat})}
(async()=>{const WC0={};await inst(0,WC0);let tot=0,bad=0,drawBad=0,grow=0,split=0,cap=0;
for(let t=0;t<8000;t++){const W=world(),W2=clone(W);const A=mk(WC0),B=mk(WC0);A.st(W);B.st(W2);
 const a=w(t*5+2,()=>A.js()),b=w(t*5+2,()=>B.w());tot++;if(W.worms.length>=120)cap++;grow+=W.food.length;split+=W.stat.split;
 const ok=a.n===b.n&&sig(A.st())===sig(B.st());if(a.n!==b.n)drawBad++;if(!ok){bad++;if(bad<3)console.log('MISMATCH',t,a.n,b.n)}}
let fT=0,fB=0;
for(let t=0;t<150;t++){const W=world();if(W.worms.length<3)continue;const full=w(3,()=>{const A=mk(WC0);A.st(clone(W));A.js()});
 for(let k=1;k<full.n;k+=Math.max(1,Math.floor(full.n/4))){const WC={},E=await inst(k,WC);const B=mk(WC);B.st(clone(W));const r=w(3,()=>B.w());fT++;
  if(!(WC.wmDeg===1&&WC.wmOff===true&&WC.rndN===k+1&&r.n===k))fB++;}}
{const WC={};await inst(0,WC);WC.e=Object.assign({},WC.e,{post_worm_step:()=>{throw new Error('x')}});const W=world(),W2=clone(W);const A=mk(WC0),B=mk(WC);A.st(W);B.st(W2);const a=w(4,()=>A.js()),b=w(4,()=>B.w());if(!(WC.wmOff&&!WC.wmDeg&&a.n===b.n&&sig(A.st())===sig(B.st())))fB++;}
console.log(JSON.stringify({scenarios:tot,worlds_at_cap:cap,mismatch:bad,drawCountMismatch:drawBad,faultCases:fT,faultBad:fB}));process.exit(bad||fB?1:0)})();
