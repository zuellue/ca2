// t-spore-baseline: REAL stepSpores/stepSporesW/newSpore/rnd/clamp extracted from ca2.js. Route A = JS body (no WC.e). Route B = wasm sp_run candidate (jsrnd binary). Seeded Math.random (same seed), identical state, exact comparison of spores[], food[] (order, fields), sporeStat, sporeLast, draw count.
// usage: node t-spore-baseline.js <wasm>
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};function clamp(v,a,b){return v<a?a:v>b?b:v}var spores=[],food=[],sporeLast=0,sporeStat={eaten:0,burst:0,died:0,settled:0,born:0};
${['newSpore','stepSporesW','stepSpores'].map(fn).join('\n')}
return {step:stepSpores,st:function(v){if(v){spores=v.spores;food=v.food;sporeLast=v.last;sporeStat=v.stat;}return {spores:spores,food:food,last:sporeLast,stat:sporeStat}}};`;
const bin=process.argv[2];
async function inst(WC){const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;return Math.random()}}})).instance.exports;Object.assign(WC,{e:E,mem:E.memory,jsrnd:true,ok:true,off:false,simOff:false})}
let TE=null;if(process.env.TRIGWASM)TE=new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(process.env.TRIGWASM))).exports;
const SHM=TE?Object.assign(Object.create(Math),{sin:TE.s,cos:TE.c,atan2:TE.a}):Math;
function mk(WC,P,cont,clk,shim){return new Function('WC','P','cont','location','performance','Math',body)(WC,P,cont,{search:''},{now:()=>clk.t},shim?SHM:Math)}
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
let s=4242;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
const names=['normal','burstdue','landing','crowded','empty','gone','nonfinite','rootsWant','edge','noLast','goneInFood'];
function world(cls,cont,cap){let n=cls===4?0:cls===3?cap+Math.floor(r0()*30):cls===7?Math.floor(r0()*10):5+Math.floor(r0()*60);const spores=[],food=[];
 for(let i=0;i<n;i++){const st=cls===7?0:(cls===2?1:(r0()<0.5?0:1));const sp={x:cont.x+r0()*cont.w,y:cont.y+r0()*cont.h,r:r0(),st,age:0,ph:r0()*6.2832,vx:st?(r0()-0.5)*2:0,vy:st?(r0()-0.5)*2:0,spore:1};
  sp.age=cls===1&&st===0?5000+sp.ph*1200+r0()*100:cls===2?1400+sp.ph*300-r0()*20:cls===3?(st===0?5000+sp.ph*1200+1:r0()*1500):r0()*(st?1500:6500);
  if(cls===8&&st&&r0()<0.5){sp.x=cont.x+(r0()<0.5?-1:cont.w+1)*r0()*0.3;sp.vx*=3;}
  let gn=false;if((cls===5||cls===10)&&r0()<0.3){sp.gone=1;gn=cls===5;}
  if(cls===6&&r0()<0.1){const v=[NaN,Infinity,-Infinity][Math.floor(r0()*3)];if(r0()<0.5)sp.x=v;else sp.y=v;}
  spores.push(sp);if(!gn)food.push(sp);if(r0()<0.3)food.push({x:r0()*50,y:r0()*50,r:r0()});}
 return {spores,food,last:cls===9?0:900,stat:{eaten:0,burst:0,died:0,settled:0,born:0}};}
function clone(W){const m=new Map();const sp=W.spores.map(x=>{const n={...x};m.set(x,n);return n});const fd=W.food.map(f=>m.get(f)||{...f});return {spores:sp,food:fd,last:W.last,stat:{...W.stat}}}
const RP=(k,v)=>typeof v==='number'&&!isFinite(v)?'N:'+v:(Object.is(v,-0)?'-0':v);
function sig(R){const si=new Map(R.spores.map((x,i)=>[x,i]));return JSON.stringify({s:R.spores.map(x=>[x.x,x.y,x.r,x.st,x.age,x.ph,x.vx,x.vy,x.gone||0]),f:R.food.map(f=>[f.x,f.y,f.r,f.spore?1:0,f.gone||0,si.has(f)?si.get(f):-1]),l:R.last,st:R.stat},RP)}
(async()=>{const byClass={};let tot=0,drawBad=0,fb={};const ex=[];
for(let t=0;t<5000;t++){const cls=t%11,cont={x:r0()*40,y:r0()*40,w:200+r0()*500,h:150+r0()*300};const P={foodDensity:0.0005+r0()*0.004};
 const cap=Math.max(60,Math.round(cont.w*cont.h*P.foodDensity/2/8));const W0=world(cls,cont,cap);const clk={t:1000+r0()*500};
 const A=mk({},P,cont,clk,true),WC={};await inst(WC);const B=mk(WC,P,cont,clk);A.st(clone(W0));B.st(clone(W0));
 const a=w(t*7+3,()=>A.step()),fw0=WC.fwSp||0,b=w(t*7+3,()=>B.step());const fell=(WC.fwSp||0)===fw0;
 const ok=sig(A.st())===sig(B.st()),dr=a.n!==b.n;tot++;
 const c=byClass[names[cls]]=byClass[names[cls]]||{n:0,bad:0,drawBad:0,jsFallback:0};c.n++;if(!ok){c.bad++;if(ex.length<4)ex.push({t,cls:names[cls],fell,draws:[a.n,b.n]});if(process.env.DBG&&(globalThis.__n=(globalThis.__n||0)+1)<=12&&(!fell||process.env.DBGF)){const x=JSON.parse(sig(A.st())),y=JSON.parse(sig(B.st()));let wh='?';for(const k of ['s','f','l','st']){if(JSON.stringify(x[k])!==JSON.stringify(y[k])){if(Array.isArray(x[k])){const L=Math.max(x[k].length,y[k].length);for(let i=0;i<L;i++)if(JSON.stringify(x[k][i])!==JSON.stringify(y[k][i])){wh=k+'['+i+'] lenA='+x[k].length+' lenB='+y[k].length+' A='+JSON.stringify(x[k][i])+' B='+JSON.stringify(y[k][i]);break}}else wh=k+' A='+JSON.stringify(x[k])+' B='+JSON.stringify(y[k]);break}}console.log('DIFF',t,names[cls],wh.slice(0,300))}}if(dr){c.drawBad++;drawBad++}if(fell)c.jsFallback++;}
console.log(JSON.stringify({binary:bin,scenarios:tot,byClass,mismatchTotal:Object.values(byClass).reduce((x,v)=>x+v.bad,0),drawCountMismatch:drawBad,examples:ex}));process.exit(0)})();
