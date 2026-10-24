// t-spore-fault: candidate sp_run_jsrnd (jsrnd binary): js_rnd throws at draw k -> degraded class (NOT parity): no JS redraw, step skipped, WC.spRunDeg=1, WC.spRunOff, draws consumed == k+1 (the throwing call counts), spores/food/sporeStat unchanged; next step runs the JS body.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};function clamp(v,a,b){return v<a?a:v>b?b:v}var spores=[],food=[],sporeLast=0,sporeStat={eaten:0,burst:0,died:0,settled:0,born:0};
${['newSpore','stepSporesW','stepSpores'].map(fn).join('\n')}
return {step:stepSpores,st:function(v){if(v){spores=v.spores;food=v.food;sporeLast=v.last;sporeStat=v.stat;}return {spores:spores,food:food,last:sporeLast,stat:sporeStat}}};`;
const bin=process.argv[2];
async function inst(WC,thr){let n=0;const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;n++;if(thr&&n>thr)throw new Error('fault');return Math.random()}}})).instance.exports;Object.assign(WC,{e:E,mem:E.memory,jsrnd:true,ok:true,off:false,simOff:false})}
const cont={x:0,y:0,w:400,h:300},P={foodDensity:0.002},clk={t:5000};
const mk=WC=>new Function('WC','P','cont','location','performance',body)(WC,P,cont,{search:''},{now:()=>clk.t});
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
let u=3;const r0=()=>{u=(u*1664525+1013904223)>>>0;return u/4294967296};
function world(){const spores=[],food=[];for(let i=0;i<40;i++){const st=i%2;const sp={x:20+r0()*350,y:20+r0()*250,r:r0(),st,age:st?1500:5500+i*100,ph:0.5,vx:0.2,vy:0.1,spore:1};spores.push(sp);food.push(sp);}return {spores,food,last:900,stat:{eaten:0,burst:0,died:0,settled:0,born:0}}}
const snap=R=>JSON.stringify([R.spores.map(x=>[x.x,x.y,x.r,x.st,x.age,x.vx,x.vy]),R.food.length,R.stat]);
(async()=>{let res={},bad=0;const WC0={};await inst(WC0,0);const A=mk(WC0);A.st(world());const full=w(5,()=>A.step());
 let cases=0,fB=0,nxt=0;for(let k=1;k<full.n;k++){const WC={};await inst(WC,k);const B=mk(WC);const S=world();B.st(S);const before=snap(B.st());const r=w(5,()=>B.step());cases++;
  const ok=WC.spRunDeg===1&&WC.spRunOff===true&&WC.rndN===k+1&&r.n===k&&snap(B.st())===before;if(!ok)fB++;
  const r2=w(7,()=>B.step());if(WC.fwSp)nxt++; }
 res={cases,bad:fB,drawsPerFullStep:full.n,kernelRunAfterFault:nxt};bad=fB+nxt;console.log(JSON.stringify(res));process.exit(bad?1:0)})();
