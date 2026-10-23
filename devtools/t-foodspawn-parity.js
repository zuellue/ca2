// t-foodspawn-parity: foodSpot / foodOnInk / reseedFood with the Rust ink-mask queries (post.rs) vs the pure-JS path, same seeded Math.random in both.
// Compared: returned spots (Object.is), food list from reseedFood, reseedBudget/foodStat.born, and the number of Math.random draws (conditional draw order preserved).
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`var inkFrac={img:null,p:0},inkFree={img:null,idx:null},inkMaskUp=null,reseedBudget=0,foodStat={born:0,inflow:0},cells=[],food=[],W=800;
var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};
${['postOffW','inkW','foodInkOn','foodOnInk','foodInkFrac','foodFreeIdx','foodSpot','lowerBound','foodMaskPx','sepDiskHit','reseedFood'].map(fn).join('\n')}
return {set cells(v){cells=v},set food(v){food=v},get food(){return food},get budget(){return reseedBudget},set budget(v){reseedBudget=v},foodStat:foodStat,foodSpot:foodSpot,reseedFood:reseedFood,invalidate:function(){inkFrac.img=null;inkFree.img=null;inkMaskUp=null;}};`;
const cnt0=0;(async()=>{
const E=(await WebAssembly.instantiate(fs.readFileSync(path.join(__dirname,'..',process.argv[2]||'ca2core.wasm')),{})).instance.exports;
function mk(useWasm,P,SEP,cont){const Ew=Object.assign({},E);Ew.post_on_ink=function(){cnt.oi++;return E.post_on_ink.apply(E,arguments)};Ew.post_rc_near=function(){cnt.rc++;return E.post_rc_near.apply(E,arguments)};Ew.post_free_at=function(){cnt.fa++;return E.post_free_at.apply(E,arguments)};const WC={e:useWasm?Ew:null,ok:true,off:false,simOff:false,mem:E.memory,postOff:false};
 return new Function('P','SEP','cont','WC','location','W',body)(P,SEP,cont,WC,{search:''},800);}
let s=2024;const rnd0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
const cnt={oi:0,rc:0,fa:0};let tot=0,bad=0,drawBad=0,spots=0;
for(let t=0;t<300;t++){
 const mw=30+Math.floor(rnd0()*50),mh=15+Math.floor(rnd0()*30),img=new Uint8ClampedArray(mw*mh*4),dens=[0.02,0.3,0.5,0.7,0.95,1][t%6];
 for(let i=0;i<mw*mh;i++)img[i*4+3]=rnd0()<dens?255:(rnd0()<0.1?20:0);
 const P={separatorOn:1,showHud:1,foodSize:2+rnd0()*8,foodReseed:1,foodLifeCell:3+Math.floor(rnd0()*6),foodDensity:0.02+rnd0()*0.05,foodReseedMin:20,foodReseedFloor:0.5,foodReseedMax:200,foodReseedTries:6,foodEatR:6};
 const cont={x:20,y:10,w:600,h:380};
 const cells=[];for(let i=0;i<Math.floor(rnd0()*40);i++)cells.push({x:cont.x+rnd0()*cont.w,y:cont.y+rnd0()*cont.h,radius:4+rnd0()*20});
 const mkS=()=>({img:img,mw:mw,mh:mh});
 const A=mk(false,Object.assign({},P),mkS(),cont),B=mk(true,Object.assign({},P),mkS(),cont);
 A.cells=cells;B.cells=cells;A.food=[];B.food=[];A.budget=B.budget=150;
 function withRng(seed,f){let st=seed,n=0;const orig=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return {r:f(),n:n};}finally{Math.random=orig;}}
 const seed=1000+t;
 const ra=withRng(seed,()=>{const out=[];for(let i=0;i<15;i++)out.push(A.foodSpot(cont.x,cont.y,cont.w,cont.h));A.reseedFood(16);return out;});
 const rb=withRng(seed,()=>{const out=[];for(let i=0;i<15;i++)out.push(B.foodSpot(cont.x,cont.y,cont.w,cont.h));B.reseedFood(16);return out;});
 tot++;let ok=ra.n===rb.n;if(!ok)drawBad++;
 for(let i=0;i<15;i++){spots++;const a=ra.r[i],b=rb.r[i];if(!(a===null&&b===null||a&&b&&Object.is(a.x,b.x)&&Object.is(a.y,b.y)))ok=false;}
 if(A.food.length!==B.food.length)ok=false;else for(let i=0;i<A.food.length;i++)if(!Object.is(A.food[i].x,B.food[i].x)||!Object.is(A.food[i].y,B.food[i].y)||!Object.is(A.food[i].r,B.food[i].r))ok=false;
 if(!Object.is(A.budget,B.budget)||A.foodStat.born!==B.foodStat.born)ok=false;
 if(!ok){bad++;if(bad<4)console.log('MISMATCH scenario',t,'draws',ra.n,rb.n,'food',A.food.length,B.food.length);}
}
console.log(JSON.stringify({scenarios:tot,spotsCompared:spots,wasmCalls:cnt,mismatch:bad,drawCountMismatch:drawBad,binary:process.argv[2]||'ca2core.wasm'}));process.exit(bad?1:0);})();
