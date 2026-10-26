// t136: CA-6 step-end velocity bound (f10). Dense fixture (t133-style, N=200 BOX=120), NORMAL step (p[56]=0), 220 steps.
// Three engines on identical frozen states:
//   A = baseline wasm (env WASM_A, REQUIRED - pre-f10 build of the same base commit, e.g. the 3b56151 pack build md5 8d522fe28eaf579e52b825fa460f2063)
//   B = candidate wasm with f10 (env WASM_B, default test/ca2core.wasm)
//   J = JS engine: the page's update/checkSurvival/interact/keepIn extracted live from test/ca2.js, frame loop mirrored 1:1 incl. the f10 close
// Invariant (f10): every processed alive cell ends the step with |v| <= maxSpeed*sm*speedModifier*(restlessDrag?1+restless*1.5:1) + eps.
// (Cells born mid-step are excluded: both engines deliberately birth at |v| = pre-spd maxSpeed - the Cell ctor and new_kid share that.)
// Asserts: ZERO invariant violations in B and J, every state, plus zero NaN. A is expected to violate (that is the defect f10 closes).
// Reports raw max/mean end |v|, overspeed events (|v|>maxSpeed), max single-step displacement, per engine. JS-vs-wasm divergence is
// descriptive only (RNG streams differ by design).
// usage: node devtools/t136-vel-step-end-bound.js [steps] [nstates]; env RD=1 restless-drag variant, N/BOX override, WASM_A/WASM_B
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const src=fs.readFileSync(path.join(__dirname,'..',process.env.CA_JS||'test/ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');if(i<0)throw name;let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
function vr(name){const i=src.indexOf('var '+name+' = ');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1)+';';}
const names=['rand2D','normCol','speedOf','mutGenome','mixGenome','newShape','mixShape','mutateGene','Cell','clusterSize','joinCluster','fuseCells','interact','reproduce','effR','birthCapF','limit','misfit','organic','update','keepIn','wallPull','carrySide','checkSurvival','divide'];
const code=`var UI_END=800,CELL_END=1300,frameT=0,resizeDrag=false;
var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var clamp=function(v,a,b){return v<a?a:v>b?b:v;};var lerp=function(a,b,t){return a+(b-a)*t;};var map=function(v,a,b,c,d){return c+(d-c)*(v-a)/(b-a);};
${vr('P')}
P.restless=3;P.crowdTol=0.5;P.orgLifeDie=-0.005;P.orgLifeGrow=1.0025;P.orgBirth=1.005;P.orgDead=-0.0025;P.orgBrain=0.008;P.orgR90=0.0025;P.cellLife=240;P.cellLifeVar=0.3;
var cells=[],ev={birth:0,death:0,hit:0,oob:0},clusterSeq=0,cmean={},food=[],frameDtf=16.7;
var mouse={x:-1e9,y:-1e9,over:false},cont={x:0,y:0,w:1e9,h:1e9,wvx0:0,wvx1:0,wvy0:0,wvy1:0};
var env={spd:1,app:0.5,bnd:1,col:0};
var habAte=function(){},habReap=function(){},logDeath=function(){};
${names.map(fn).join('\n')}
return {P:P,Cell:Cell,get cells(){return cells;},set cells(v){cells=v;},ev:ev,
 setRD:function(v){resizeDrag=v;},
 frame:function(){for(var i=cells.length-1;i>=0;i--){var c=cells[i];update(c);checkSurvival(c);
  for(var k=i-1;k>=0;k--)interact(c,cells[k]);
  if(resizeDrag&&c.alive){var ms2=(c.maxSpeed+1)*P.restless;c.vx+=(Math.random()-0.5)*ms2*2;c.vy+=(Math.random()-0.5)*ms2*2;}
  if(P.boundAware&&c.alive)keepIn(c);
  if(c.alive){var dmE=Math.hypot(c.x-mouse.x,c.y-mouse.y),smE=dmE<P.slowDownRadius?P.speedReductionFactor:1;limit(c,c.maxSpeed*smE*c.speedModifier*(resizeDrag?1+P.restless*1.5:1));}
  if(!c.alive){ev.death++;cells.splice(i,1);}}}};`;
const J=new Function(code)();
const P=J.P;
const STEPS=+process.argv[2]||220, NSTATES=+process.argv[3]||6;
const N=+process.env.N||200, BOX=+process.env.BOX||120, RD=process.env.RD?1:0;
const ST=30;
// WASM_A is REQUIRED: the pre-f10 baseline build of the SAME base commit (never test/ca2core.wasm -
// the candidate build lands there and a default to it silently self-compares, F70 catch 2026-10-26).
// Refuse to run when A is unset or when A and B are byte-identical.
if(!process.env.WASM_A){console.error('FAIL: set WASM_A to the pre-f10 baseline wasm of the same base commit (candidate must not be the default).');process.exit(2);}
const wasmA=process.env.WASM_A;
const wasmB=process.env.WASM_B||path.join(__dirname,'..','test','ca2core.wasm');
{const ha=crypto.createHash('md5').update(fs.readFileSync(wasmA)).digest('hex'),hb=crypto.createHash('md5').update(fs.readFileSync(wasmB)).digest('hex');
 console.log('A(baseline)',wasmA,'md5',ha);console.log('B(candidate)',wasmB,'md5',hb);
 if(ha===hb){console.error('FAIL: A and B are byte-identical - non-discriminating comparison, refusing to report PASS.');process.exit(2);}}
(async()=>{
const EA=(await WebAssembly.instantiate(fs.readFileSync(wasmA),{})).instance.exports;
const EB=(await WebAssembly.instantiate(fs.readFileSync(wasmB),{})).instance.exports;
const PI=['interactionRadius','slowDownRadius','speedReductionFactor','baseMaxSpeed','maxSpeedVariation','energyConsumptionRate','selectOn','genomeOn','selStrength','eatMergeOn','clusterCohesion','symbiosisOn','foodEatR','foodEnergyValue','foodGrow','foodGrowAmt','CELL_RADIUS','foodGrowMax','divideOn','divideAt','UNIVERSE_SIZE','foodShrink','boundAware','boundZone','boundForce','restless','eatRatio','eatChance','mergeGene','mergeChance','symbiogenesisOn','energyGainFromInteraction','GENE_MIN','GENE_MAX','minEnergyForReproduction','clusterMax','genomeMut','mutationRateRange','metaballStrength'];
function mkState(){const cs=[];for(let i=0;i<N;i++){const c=new J.Cell(Math.random()*BOX,Math.random()*BOX,Math.round((Math.random()-0.5)*14),5);c.radius=P.CELL_RADIUS*(0.7+Math.random()*1.1);c.energy=3+Math.random()*12;cs.push(c);}return cs;}
function clone(cs){return cs.map(c=>{const d=Object.create(Object.getPrototypeOf(c));Object.assign(d,c);d.g=JSON.parse(JSON.stringify(c.g));d.shp=JSON.parse(JSON.stringify(c.shp));d.sym=null;return d;});}
function pack(E,cs){const n=cs.length,cap=n+256;const cp=E.sim_cells(cap);E.sim_food(2);E.sim_cm(2);const pp=E.sim_params();
 const cf=new Float64Array(E.memory.buffer,cp,cap*ST),p=new Float64Array(E.memory.buffer,pp,97);
 cs.forEach((c,i)=>{const b=i*ST,g=c.g;cf.set([c.x,c.y,c.vx,c.vy,c.radius,c.energy,c.gene,1,c.maxSpeed,c.speedModifier,c.hostility,c.mutationRate,c.sv,c.cl||0,-1,g.spd,g.app,g.bnd,g.col[0],g.col[1],g.col[2],c.comp||0,0,0,0,0,0,0,0,0],b);});
 E.sim_set_n(n);E.sim_set_nf(0);E.sim_cm_count(0);
 PI.forEach((k,i)=>{let v=P[k];p[i]=typeof v==='boolean'?(v?1:0):v;});
 p[39]=1;p[40]=0.5;p[41]=1;p[42]=0;p[46]=-1e9;p[47]=-1e9;p[48]=0;p[49]=0;p[50]=0;p[51]=1e9;p[52]=1e9;p[58]=5000;p[59]=0.02;p[60]=0.5;p[61]=-0.005;p[62]=1.0025;p[63]=1.005;p[64]=-0.0025;p[65]=0.008;p[66]=0.0025;p[78]=16.7; p[53]=RD;p[54]=0;p[56]=0;p[57]=0;}
const rf=RD?1+P.restless*1.5:1;
function runWasm(E,cs0,S0){
 pack(E,clone(cs0));
 let maxV=0,sumV=0,cntV=0,over=0,maxDisp=0,viol=0,nan=0;
 for(let st=0;st<STEPS;st++){
  const cp2=E.sim_cells_ptr();const n0=cs0.length;const pre=new Float64Array(E.memory.buffer,cp2,E.sim_cap()*ST).slice(0,n0*ST);
  E.sim_step(S0+st,S0+st+1);
  const cf=new Float64Array(E.memory.buffer,E.sim_cells_ptr(),E.sim_cap()*ST);
  for(let i=0;i<n0;i++){const b=i*ST;
   if(!pre[b+7]||!cf[b+7]||pre[b+22]||cf[b+22])continue;
   const vx=cf[b+2],vy=cf[b+3];if(Number.isNaN(vx)||Number.isNaN(vy)){nan++;continue;}
   const v=Math.hypot(vx,vy);const ms=cf[b+8],lim=ms*cf[b+9]*rf;
   if(v>maxV)maxV=v;sumV+=v;cntV++;if(v>ms)over++;
   if(v>lim+1e-6*Math.max(1,lim))viol++;
   const d=Math.hypot(cf[b]-pre[b],cf[b+1]-pre[b+1]);if(d>maxDisp)maxDisp=d;}
 }
 return{maxV,meanV:sumV/Math.max(1,cntV),over,cellSteps:cntV,maxDisp,viol,nan};}
function runJS(cs0){
 J.cells=clone(cs0);J.setRD(!!RD);
 let maxV=0,sumV=0,cntV=0,over=0,maxDisp=0,viol=0,nan=0;
 for(let st=0;st<STEPS;st++){
  const before=J.cells.map(c=>({c,x:c.x,y:c.y,alive:c.alive}));
  J.frame();
  for(const r of before){const c=r.c;
   if(!r.alive||!c.alive)continue;
   const vx=c.vx,vy=c.vy;if(Number.isNaN(vx)||Number.isNaN(vy)){nan++;continue;}
   const v=Math.hypot(vx,vy);const lim=c.maxSpeed*c.speedModifier*rf;
   if(v>maxV)maxV=v;sumV+=v;cntV++;if(v>c.maxSpeed)over++;
   if(v>lim+1e-6*Math.max(1,lim))viol++;
   const d=Math.hypot(c.x-r.x,c.y-r.y);if(d>maxDisp)maxDisp=d;}
 }
 return{maxV,meanV:sumV/Math.max(1,cntV),over,cellSteps:cntV,maxDisp,viol,nan};}
let totB=0,totJ=0,nanB=0,nanJ=0;
for(let s=0;s<NSTATES;s++){
 const base=mkState();const S0=1000+s*7919;
 const a=runWasm(EA,base,S0),b=runWasm(EB,base,S0),j=runJS(base);
 totB+=b.viol;totJ+=j.viol;nanB+=b.nan;nanJ+=j.nan;
 console.log('state',s,
  '| A(base) maxV',a.maxV.toFixed(2),'over',a.over,'viol',a.viol,'nan',a.nan,'maxDisp',a.maxDisp.toFixed(1),
  '| B(f10) maxV',b.maxV.toFixed(2),'over',b.over,'viol',b.viol,'nan',b.nan,'maxDisp',b.maxDisp.toFixed(1),
  '| J(f10) maxV',j.maxV.toFixed(2),'over',j.over,'viol',j.viol,'nan',j.nan,'maxDisp',j.maxDisp.toFixed(1));
}
console.log('RD='+RD,'steps='+STEPS,'states='+NSTATES,'N='+N,'BOX='+BOX);
const ok=totB===0&&totJ===0&&nanB===0&&nanJ===0;
console.log(ok?('PASS: f10 invariant holds in candidate wasm and JS (0 violations, 0 NaN)'):('FAIL: B viol='+totB+' J viol='+totJ+' B nan='+nanB+' J nan='+nanJ));
process.exit(ok?0:1);
})();
