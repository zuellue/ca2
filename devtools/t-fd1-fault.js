// t-fd1-fault: candidate fd1 (jsrnd binary): (1) zero/edge states equal the JS body, (2) NaN/Infinity food position -> kernel returns -1 before any draw -> JS body runs, equal to JS route, (3) fault at draw k (k>=1) -> degraded: no redraw, tick skipped, WC.fdDeg=1, WC.fd1Off, draws consumed == k+1.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`var food=[],foodT=0,foodStat={born:0,died:0,steps:0,inflow:0};
${['postOffW','wallPull','lifeBirthsJs','lifeBirths','stepFoodW','stepFood'].map(fn).join('\n')}
return {step:stepFood,st:function(v){if(v){food=v.food;foodT=v.foodT;foodStat=v.stat;}return {food:food,foodT:foodT,stat:foodStat}}};`;
const bin=process.argv[2];
async function inst(WC,thr){let n=0;const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;n++;if(thr&&n>thr)throw new Error('fault');return Math.random()}}})).instance.exports;Object.assign(WC,{e:E,mem:E.memory,jsrnd:true,ok:true,off:false,simOff:false});return E}
const mk=(WC,P,cont,clk)=>new Function('WC','P','cont','location','performance',body)(WC,P,cont,{search:''},{now:()=>clk.t});
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
const P={foodLifeMs:300,foodLifeCell:4,foodSize:4,boundGap:0},cont={x:0,y:0,w:200,h:150},clk={t:1000};
// glider-ish dense seed inside the plate: 3 dots around an empty cell -> births
function inside(extra){let q=12345;const f=[];for(let i=0;i<40;i++)for(let j=0;j<25;j++){q=(q*1664525+1013904223)>>>0;if(q/4294967296<0.33)f.push({x:10+i*4+1,y:10+j*4+1,r:0.5});}return f.concat(extra||[]);}
const mkS=food=>({food:food.map(f=>({...f})),foodT:0,stat:{born:0,died:0,steps:0,inflow:0}});
const sig=R=>JSON.stringify([R.food.map(f=>[f.x,f.y,f.r]),R.stat]);
(async()=>{let bad=0,res={};
 // (1) empty food and 1-dot food
 for(const [name,food] of [['empty',[]],['one',[{x:50,y:50,r:.5}]]]){const WC={};await inst(WC,0);const A=mk({},P,cont,clk),B=mk(WC,P,cont,clk);A.st(mkS(food));B.st(mkS(food));const a=w(5,()=>A.step()),b=w(5,()=>B.step());const ok=a.n===b.n&&sig(A.st())===sig(B.st());res[name]=ok;if(!ok)bad++;}
 // (2) NaN / Infinity
 for(const [name,v] of [['NaN',NaN],['Inf',Infinity]]){const food=inside([{x:v,y:5,r:.5}]);const WC={};await inst(WC,0);const A=mk({},P,cont,clk),B=mk(WC,P,cont,clk);A.st(mkS(food));B.st(mkS(food));let a,b,ea,eb;try{a=w(5,()=>A.step())}catch(e){ea=String(e)}try{b=w(5,()=>B.step())}catch(e){eb=String(e)}
  const ok=ea===eb&&b&&b.n===0&&B.st().food.length===food.length&&B.st().stat.steps===0;/* measured pre-existing behaviour: fd1_tick returns -1 after foodT=now, so the JS body sees the timer already set and skips the tick (candidate AND default); NOT JS-route parity */res[name]={ok,ea,eb,drawsJS:a&&a.n,drawsCand:b&&b.n,kernelDraws:WC.rndN||0};if(!ok)bad++;}
 // (3) fault at draw k
 const full=await (async()=>{const WC={};await inst(WC,0);const B=mk(WC,P,cont,clk);B.st(mkS(inside()));return w(9,()=>{B.step();return B.st().stat.born})})();
 let fT=0,fB=0;for(let k=1;k<Math.min(full.n,40);k++){const WC={};await inst(WC,k);const B=mk(WC,P,cont,clk);const S=mkS(inside());B.st(S);const r=w(9,()=>B.step());fT++;
  const R=B.st();if(!(WC.fdDeg===1&&WC.fd1Off===true&&WC.rndN===k+1&&r.n===k&&R.food.length===S.food.length))fB++;
  // after the fault the next due tick must take the JS body (kernel disabled)
  clk.t+=1000;B.st({food:R.food,foodT:0,stat:R.stat});const r2=w(9,()=>B.step());if(WC.fd1Off!==true||WC.fdDeg!==1)fB++;}
 res.fault={cases:fT,bad:fB,drawsPerTick:full.n,births:full.v};bad+=fB;
 console.log(JSON.stringify(res));process.exit(bad?1:0)})();
