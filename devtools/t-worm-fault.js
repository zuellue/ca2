// t-worm-fault: candidate wm_run_jsrnd (jsrnd binary): js_rnd throws at draw k -> degraded class (NOT parity): no JS redraw, step skipped, WC.wmRunDeg=1, WC.wmRunOff, draws consumed == k+1 (the throwing call counts), worms/food/wormStat/wormT unchanged (world has no eaten/short worms so the pre-pass is a no-op); next step runs the JS body.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var worms=[],food=[],wormT=0,wormStat={born:0,died:0,split:0,eaten:0};
${['postOffW','newWorm','wormGrowSplitJs','wormGrowSplit','stepWormsW','stepWorms'].map(fn).join('\n')}
return {step:stepWorms,st:function(v){if(v){worms=v.worms;food=v.food;wormT=v.wormT;wormStat=v.stat;}return {worms:worms,food:food,wormT:wormT,stat:wormStat}}};`;
const bin=process.argv[2];
async function inst(WC,thr){let n=0;const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;n++;if(thr&&n>thr)throw new Error('fault');return Math.random()}}})).instance.exports;Object.assign(WC,{e:E,mem:E.memory,jsrnd:true,ok:true,off:false,simOff:false})}
const cont={x:0,y:0,w:400,h:300},P={foodLifeMs:300,foodSize:4,foodDensity:0.002},clk={t:5000};
const mk=WC=>new Function('WC','P','cont','location','performance','Math',body)(WC,P,cont,{search:''},{now:()=>clk.t},Math);
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
let u=3;const r0=()=>{u=(u*1664525+1013904223)>>>0;return u/4294967296};
function world(){const worms=[],food=[];for(let i=0;i<10;i++){const wm={x:50+r0()*300,y:50+r0()*200,a:r0()*6,sp:0.5,fr:1,ph:1,d:[]};for(let k=0;k<(i%2?10:5);k++){const f={x:wm.x-k*3,y:wm.y,r:0.5,worm:wm};wm.d.push(f);food.push(f);}worms.push(wm);}return {worms,food,wormT:0,stat:{born:0,died:0,split:0,eaten:0}}}
const snap=R=>JSON.stringify([R.worms.map(x=>[x.x,x.y,x.a,x.d.length]),R.food.map(f=>[f.x,f.y,f.r]),R.wormT,R.stat]);
(async()=>{let res={},bad=0;const WC0={};await inst(WC0,0);const A=mk(WC0);A.st(world());const full=w(5,()=>A.step());
 let cases=0,fB=0,nxt=0;for(let k=1;k<Math.min(full.n,80);k++){const WC={};await inst(WC,k);const B=mk(WC);const S=world();B.st(S);const before=snap(B.st());const r=w(5,()=>B.step());cases++;
  const ok=WC.wmRunDeg===1&&WC.wmRunOff===true&&WC.rndN===k+1&&r.n===k&&snap(B.st())===before;if(!ok)fB++;
  const r2=w(7,()=>B.step());if(WC.fwWm)nxt++; }
 res={cases,bad:fB,drawsPerFullStep:full.n,kernelRunAfterFault:nxt};bad=fB+nxt;console.log(JSON.stringify(res));process.exit(bad?1:0)})();
