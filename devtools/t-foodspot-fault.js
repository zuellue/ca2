// t-foodspot-fault: the ca2.js foodSpot hook when env.js_rnd throws at the k-th draw (k=0 means before any draw). Rule under test: if any draw was consumed the hook returns null and JS must NOT draw again; if none, the JS body runs and equals the pure-JS result.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`var inkFrac={img:null,p:0},inkFree={img:null,idx:null},inkMaskUp=null,W=800;
${['postOffW','inkW','foodInkOn','foodOnInk','foodInkFrac','foodFreeIdx','foodSpot','lowerBound','foodMaskPx','sepDiskHit'].map(fn).join('\n')}
return {foodSpot:foodSpot};`;
function w2(f,seed){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
(async()=>{
const bin=process.argv[2]||'ca2core-jsrnd.wasm';
let thr=-1,c=0;const WC={ok:true,jsrnd:true,postOff:false};
const imp={env:{js_rnd:()=>{if(c===thr){throw new Error('fault')}c++;WC.rndN=(WC.rndN||0)+1;return Math.random();}}};
const E=(await WebAssembly.instantiate(fs.readFileSync(bin),imp)).instance.exports;WC.e=E;WC.mem=E.memory;
let s=7;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
let nextCalls=0,nextBad=0,tot=0,bad=0,consumedCases=0,freshCases=0;
for(let t=0;t<400;t++){
 const mw=40,mh=20,img=new Uint8ClampedArray(mw*mh*4),dens=[0,0.2,0.8][t%3];
 for(let i=0;i<mw*mh;i++)img[i*4+3]=r0()<dens?255:0;
 const P={separatorOn:t%3?1:0,showHud:1,foodSize:4},SEP={img,mw,mh},cont={x:10,y:10,w:500,h:300};
 const H=new Function('P','SEP','cont','WC','location','W',body)(P,SEP,cont,WC,{search:''},800);
 const J=new Function('P','SEP','cont','WC','location','W',body)(P,SEP,cont,{postOff:true},{search:''},800);
 for(const k of [0,1,2,3]){
  WC.postOff=false;WC.rndN=0;c=0;thr=k;
  const seed=t*13+k;
  function w(f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
  const h=w(()=>H.foodSpot(cont.x,cont.y,cont.w,cont.h));
  const j=w(()=>J.foodSpot(cont.x,cont.y,cont.w,cont.h));
  tot++;let ok;
  if(!WC.postOff){ ok=JSON.stringify(h.v)===JSON.stringify(j.v)&&h.n===j.n; } // fault never reached: normal path
  else if(k===0){freshCases++;ok=JSON.stringify(h.v)===JSON.stringify(j.v)&&h.n===j.n;} // before any draw: JS body, same result and draws
  else {consumedCases++;ok=h.v===null&&h.n===k&&WC.postOff;} // after k draws: null, exactly k draws total, no redraw
  if(WC.postOff){ // next invocation after any fault: must run the JS body (postOff), zero wasm draws, equal to pure JS
    const before=c,seed2=seed+991;
    const h2=w2(()=>H.foodSpot(cont.x,cont.y,cont.w,cont.h),seed2),j2=w2(()=>J.foodSpot(cont.x,cont.y,cont.w,cont.h),seed2);
    nextCalls++; if(c!==before||JSON.stringify(h2.v)!==JSON.stringify(j2.v)||h2.n!==j2.n){ok=false;nextBad++;}
  }
  if(!ok){bad++;if(bad<4)console.log('BAD',t,k,h,j,c);}
 }
}
console.log(JSON.stringify({checks:tot,faultBeforeAnyDraw:freshCases,faultAfterDraws:consumedCases,mismatch:bad,nextCallAfterFault:nextCalls,nextCallBad:nextBad,binary:bin}));process.exit(bad?1:0);})();
