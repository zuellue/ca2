// t-sw-fault: candidate sw_run (jsrnd binary): fault at js_rnd draw k (k>=1) -> degraded: no JS redraw, step skipped (food unchanged), WC.swRunDeg=1, WC.swRunOff, draws consumed == k+1; afterwards the JS body runs (kernel disabled).
// Also: grid-too-large (-1, no draws) falls to the JS body with the stream equal to the JS route.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`var food=[],swT=0,swStat={born:0,died:0};function clamp(v,a,b){return v<a?a:v>b?b:v}
${['swPackJs','swPackRust','stepSwarmW','stepSwarm'].map(fn).join('\n')}
return {step:stepSwarm,st:function(v){if(v){food=v.food;swT=v.swT;swStat=v.stat;}return {food:food,swT:swT,stat:swStat}}};`;
const bin=process.argv[2];
async function inst(WC,thr){let n=0;const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;n++;if(thr&&n>thr)throw new Error('fault');return Math.random()}}})).instance.exports;Object.assign(WC,{e:E,mem:E.memory,jsrnd:true,ok:true,off:false,simOff:false});return E}
const mk=(WC,P,cont,clk)=>new Function('WC','P','cont','location','performance',body)(WC,P,cont,{search:''},{now:()=>clk.t});
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
const P={foodLifeMs:300,foodDensity:0.0005},cont={x:0,y:0,w:2000,h:2000},clk={t:1000};
function dots(n,far){let q=7;const f=[];for(let i=0;i<n;i++){q=(q*1664525+1013904223)>>>0;const x=900+(q/4294967296)*200;q=(q*1664525+1013904223)>>>0;const y=900+(q/4294967296)*200;f.push({x:far&&i===0?1e9:x,y,r:0.5,vx:0.1,vy:-0.1});}return f}
const mkS=food=>({food:food.map(f=>({...f})),swT:0,stat:{born:0,died:0}});
const sig=R=>JSON.stringify([R.food.map(f=>[f.x,f.y,f.vx,f.vy,f.r]),R.stat,R.swT]);
(async()=>{let bad=0,res={};
 const WCf={};await inst(WCf,0);const A0=mk({},P,cont,clk);A0.st(mkS(dots(120)));const full=w(5,()=>{A0.step();return A0.st().food.length});
 let fT=0,fB=0;for(let k=1;k<Math.min(full.n,60);k++){const WC={},E=await inst(WC,k);const B=mk(WC,P,cont,clk);const S=mkS(dots(120));B.st(S);const r=w(5,()=>B.step());fT++;const R=B.st();
  if(!(WC.swRunDeg===1&&WC.swRunOff===true&&WC.rndN===k+1&&r.n===k&&R.food.length===S.food.length&&R.food.every((f,i)=>f.x===S.food[i].x&&f.y===S.food[i].y)))fB++;}
 res.fault={cases:fT,bad:fB,drawsPerStep:full.n};bad+=fB;
 // grid too large: one dot at 1e9 -> kernel -1 (no draws consumed by the kernel) -> JS body
 {const WC={};await inst(WC,0);const A=mk({},P,cont,clk),B=mk(WC,P,cont,clk);A.st(mkS(dots(60,true)));B.st(mkS(dots(60,true)));const a=w(9,()=>A.step()),b=w(9,()=>B.step());const ok=a.n===b.n&&sig(A.st())===sig(B.st());res.gridTooLarge={ok,drawsJS:a.n,drawsCand:b.n};if(!ok)bad++;}
 console.log(JSON.stringify(res));process.exit(bad?1:0)})();
