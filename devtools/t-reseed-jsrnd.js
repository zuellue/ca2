// t-reseed-jsrnd: page reseedFood with the Rust blob loop (jsrnd binary, draws via env.js_rnd=Math.random) vs the pure-JS reseedFood, same seeded Math.random.
// Compared: food list (x,y,r Object.is), budget, foodStat.born, total draw count. FAULT=1 additionally injects a js_rnd throw (separate class, reported separately).
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`var inkFrac={img:null,p:0},inkFree={img:null,idx:null},inkMaskUp=null,reseedBudget=0,foodStat={born:0,inflow:0},cells=[],food=[],W=800;
var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};
${['postOffW','inkW','foodInkOn','foodOnInk','foodInkFrac','foodFreeIdx','foodSpot','lowerBound','foodMaskPx','sepDiskHit','reseedFood'].map(fn).join('\n')}
return {set cells(v){cells=v},set food(v){food=v},get food(){return food},get budget(){return reseedBudget},set budget(v){reseedBudget=v},foodStat:foodStat,reseedFood:reseedFood};`;
(async()=>{
const bin=process.argv[2]||'ca2core-jsrnd.wasm';const FAULT=process.env.FAULT==='1';
let thr=-1,c=0;const WC={ok:true,jsrnd:true,postOff:false};
const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{if(c===thr)throw new Error('fault');c++;WC.rndN=(WC.rndN||0)+1;return Math.random();}}})).instance.exports;WC.e=E;WC.mem=E.memory;
let s=2025;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
function w(f,seed){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
let tot=0,bad=0,rsCalls=0,spawnedTot=0;
for(let t=0;t<600;t++){
 const mw=30+Math.floor(r0()*50),mh=15+Math.floor(r0()*30),img=new Uint8ClampedArray(mw*mh*4),dens=[0,0.02,0.3,0.5,0.7,0.95][t%6];
 for(let i=0;i<mw*mh;i++)img[i*4+3]=r0()<dens?255:(r0()<0.1?20:0);
 const P={separatorOn:(t%7)?1:0,showHud:1,foodSize:2+r0()*8,foodReseed:1,foodLifeCell:3+Math.floor(r0()*6),foodDensity:0.02+r0()*0.05,foodReseedMin:20,foodReseedFloor:0.5,foodReseedMax:200,foodReseedTries:[0,1,6,6.5][t%4],foodEatR:6};
 const cont={x:20,y:10,w:600,h:380},SEP={img,mw,mh};
 const cells=[];for(let i=0;i<Math.floor(r0()*60);i++)cells.push({x:cont.x+r0()*cont.w,y:cont.y+r0()*cont.h,radius:4+r0()*20});
 const A=new Function('P','SEP','cont','WC','location','W',body)(P,SEP,cont,{postOff:true},{search:''},800);
 WC.postOff=false;WC.rndN=0;c=0;thr=FAULT?(t%5):-1;
 const B=new Function('P','SEP','cont','WC','location','W',body)(P,SEP,cont,WC,{search:''},800);
 A.cells=cells;B.cells=cells;A.food=[];B.food=[];A.budget=B.budget=150;
 const seed=500+t;
 const a=w(()=>A.reseedFood(16),seed),b=w(()=>B.reseedFood(16),seed);tot++;
 let ok=true;
 if(!FAULT||!WC.postOff){ ok=a.n===b.n&&A.food.length===B.food.length&&Object.is(A.budget,B.budget)&&A.foodStat.born===B.foodStat.born;
  if(ok)for(let i=0;i<A.food.length;i++)if(!Object.is(A.food[i].x,B.food[i].x)||!Object.is(A.food[i].y,B.food[i].y)||!Object.is(A.food[i].r,B.food[i].r))ok=false;
  spawnedTot+=A.food.length; }
 else { ok=b.n===thr&&B.food.length===0&&B.foodStat.born===0; if(thr===0)ok=a.n===b.n&&A.food.length===B.food.length; } // degraded class, not parity
 if(!ok){bad++;if(bad<4)console.log('BAD',t,a.n,b.n,A.food.length,B.food.length,thr);}
}
console.log(JSON.stringify({scenarios:tot,rustBlobCalls:WC.rsN||0,foodDotsCompared:spawnedTot,mismatch:bad,fault:FAULT,binary:bin}));process.exit(bad?1:0);})();
