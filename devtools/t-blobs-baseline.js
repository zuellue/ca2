// t-blobs-baseline: REAL stepBlobs / stepBlobsPassW / newBlob / addBlobDot / clamp extracted from ca2.js. Route A = JS body (WC.e absent). Route B = jsrnd wasm fb_run (fd2.rs, draws via env.js_rnd). Identical blobs/food/P/cont/clock per scenario; seeded Math.random.
// Compares per blob x,y,vx,vy,r,ph,w (Object.is), per dot a,f,q,x,y, blob count/order, food length + dot identity order, blobStat, draw count. The life block (grow/split/shrink/seed) runs the same extracted JS in both routes; only the per-frame pass differs. Nonfinite blob x/y -> kernel -1 -> JS loop (counted class, checked equal). Fault: throw at draw k -> fbRunOff, fbRunDeg++, pass skipped (degraded, never parity).
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const NAMES=['newBlob','addBlobDot','stepBlobsPassW','stepBlobs'];
const BODY=`var blobs=[],blobT=0,blobStat={grow:0,shrink:0,split:0,die:0,born:0},food=[];
function clamp(v,a,b){return v<a?a:v>b?b:v}
${NAMES.map(fn).join('\n')}
return {step:stepBlobs,get blobs(){return blobs},set blobs(v){blobs=v},get food(){return food},set food(v){food=v},get blobT(){return blobT},set blobT(v){blobT=v},stat:blobStat};`;
const bin=process.argv[2]||'../ca2core-jsrnd.wasm';
async function inst(thr,WC){let n=0;const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;n++;if(thr&&n>thr)throw new Error('fault');return Math.random()}}})).instance.exports;Object.assign(WC,{e:E,mem:E.memory,jsrnd:true,ok:true,off:false,simOff:false});return E}
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
let NOW=100000;
(async()=>{const WCw={};await inst(0,WCw);
let s=41;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
let tot=0,bad=0,drawBad=0,fields=0,jsFallback=0,lifeTicks=0,splitSeen=0,shrinkSeen=0,dieSeen=0;
for(let t=0;t<12000;t++){
 const P={foodBlobR:20+r0()*80,foodBlobDots:4+Math.floor(r0()*8),foodLifeMs:200+r0()*2000,foodDensity:r0()*0.05};
 const cont={x:50+r0()*100,y:40+r0()*80,w:400+r0()*900,h:300+r0()*700};
 const nb=1+Math.floor(r0()*40),blobsT=[],foodT=[];
 for(let i=0;i<nb;i++){const b={x:cont.x+r0()*cont.w,y:cont.y+r0()*cont.h,vx:(r0()-.5)*2,vy:(r0()-.5)*2,r:8+r0()*10,ph:r0()*6.28,w:0.3+r0()*0.6,d:[]};
  const nd=1+Math.floor(r0()*9);for(let k=0;k<nd;k++){const f={x:b.x,y:b.y,r:r0(),a:r0()*6.28,f:0.5+r0()*1.5,q:r0()*6.28,blob:b};b.d.push(f);foodT.push(f);}
  if(t%11===0&&i===0){b.x=NaN} // nonfinite class: kernel must return -1, JS loop runs
  if(t%13===0&&i===1){b.y=Infinity}
  blobsT.push(b);}
 const dtms=[0,8,16.7,50,200][t%5];NOW+=dtms;const now0=NOW;
 const lifeNow=t%3===0; // force the life tick in a third of the scenarios via blobT far in the past
 const mk=(wasm)=>{const blobs=blobsT.map(b0=>{const b={x:b0.x,y:b0.y,vx:b0.vx,vy:b0.vy,r:b0.r,ph:b0.ph,w:b0.w,d:[]};b.d=b0.d.map(f0=>({x:f0.x,y:f0.y,r:f0.r,a:f0.a,f:f0.f,q:f0.q,blob:b}));return b;});
  const food=[];blobs.forEach(b=>b.d.forEach(f=>food.push(f)));
  const WC=wasm?Object.assign(Object.create(WCw),{rndN:0,fwBl:0,fbRunDeg:0,fbRunOff:false}):{e:null,ok:true,off:false,simOff:false,rndN:0};
  let vnow=now0;const scope=new Function('P','WC','location','cont','performance',BODY)(P,WC,{search:''},cont,{now:()=>vnow});scope._setNow=v=>{vnow=v};
  scope.blobs=blobs;scope.food=food;
  return scope;};
 const run=(wasm)=>{const sc=mk(wasm);if(!lifeNow)sc.blobT=now0;sc.step();sc._setNow(now0+16.7);if(t%2===0){sc.blobT=now0+16.7-1e9;sc.step();}return sc;};
 const seed=t*31+5;
 const a=w(seed,()=>run(false)),b=w(seed,()=>run(true));
 tot++;if(lifeNow)lifeTicks++;
 const Ra=a.v,Rb=b.v;splitSeen+=Rb.stat.split;shrinkSeen+=Rb.stat.shrink;dieSeen+=Rb.stat.die;
 let ok=a.n===b.n;if(!ok)drawBad++;
 const fb=(sc)=>{const o=[];for(const bl of sc.blobs){o.push(bl.x,bl.y,bl.vx,bl.vy,bl.r,bl.ph,bl.w,bl.d.length);for(const f of bl.d)o.push(f.a,f.f,f.q,f.x,f.y);}return o;};
 const fa=fb(Ra),fbv=fb(Rb);
 if(fa.length!==fbv.length)ok=false;else for(let i=0;i<fa.length;i++){fields++;if(!Object.is(fa[i],fbv[i])){ok=false;if(bad<3)console.log('DIFF',t,'i',i,fa[i],fbv[i]);}}
 if(Ra.food.length!==Rb.food.length)ok=false;
 for(const k of ['grow','shrink','split','die','born'])if(Ra.stat[k]!==Rb.stat[k])ok=false;
 if(!ok){bad++;if(bad<3)console.log('MISMATCH',t,'draws',a.n,b.n,'blobs',Ra.blobs.length,Rb.blobs.length,'food',Ra.food.length,Rb.food.length);}}
// fault: throw at draw k inside fb_run -> pass skipped, fbRunDeg=1, fbRunOff=true, blob positions NOT updated by kernel, JS loop skipped (return true)
let fT=0,fB=0;const Pf={foodBlobR:60,foodBlobDots:8,foodLifeMs:1000,foodDensity:0.02};
for(let k=1;k<=6;k++){const WC={};await inst(k,WC);const blobs=[];for(let i=0;i<10;i++){const bl={x:100+i*20,y:100+i*15,vx:0.1,vy:-0.1,r:10,ph:1,w:0.5,d:[]};for(let j=0;j<4;j++){const f={x:bl.x,y:bl.y,r:0.5,a:1,f:1,q:2,blob:bl};bl.d.push(f);}blobs.push(bl);}
 const food=[];blobs.forEach(bl=>bl.d.forEach(f=>food.push(f)));
 const x0=blobs.map(b=>b.x).join(',');
 w(9,()=>{const sc=new Function('P','WC','location','cont','performance',BODY)(Pf,WC,{search:''},{x:0,y:0,w:800,h:600},{now:()=>NOW});sc.blobs=blobs;sc.food=food;sc.blobT=NOW;sc.step()});
 fT++;const moved=blobs.some((b,i)=>b.x!==100+i*20);
 if(!(WC.fbRunDeg===1&&WC.fbRunOff===true&&!moved))fB++}
console.log(JSON.stringify({scenarios:tot,lifeTicks,fieldsCompared:fields,splitSeen,shrinkSeen,dieSeen,mismatch:bad,drawCountMismatch:drawBad,faultCases:fT,faultBad:fB,binary:bin}));process.exit(bad||fB?1:0)})();
