const ST=+process.env.ST||30; // f64 per cell, must equal wasm/src/sim.rs ST (the page packs 30)
// t134: JS-vs-wasm pair-budget parity (CA-5). One interact-only step (p[56]=1) on identical frozen states through BOTH engines:
//   JS   = the interact loop extracted live from test/ca2.js (override with CA_JS)
//   wasm = candidate build (WASM_B, default wasm/target/wasm32-unknown-unknown/release/ca2core.wasm)
// Asserts per-cell |dx,dy| <= maxSpeed+1 (+eps) in EACH engine. Reports raw max px divergence JS vs wasm (metrics only;
// the two RNG streams differ by design, so divergence is descriptive, never an assertion).
// usage: node devtools/t134-js-vs-wasm-pair-budget.js [ignored] [ncells] [box] [nstates]; RING=1 selects the controlled ring fixture.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..',process.env.CA_JS||'test/ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');if(i<0)throw name;let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
function vr(name){const i=src.indexOf('var '+name+' = ');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1)+';';}
const names=['rand2D','normCol','speedOf','mutGenome','mixGenome','newShape','mixShape','mutateGene','Cell','clusterSize','joinCluster','fuseCells','interact','reproduce','effR','birthCapF'];
const code=`var UI_END=800,CELL_END=1300,frameT=0;
var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var clamp=function(v,a,b){return v<a?a:v>b?b:v;};var lerp=function(a,b,t){return a+(b-a)*t;};var map=function(v,a,b,c,d){return c+(d-c)*(v-a)/(b-a);};
${vr('P')}
var cells=[],ev={birth:0,death:0,hit:0,oob:0},clusterSeq=0;
${names.map(fn).join('\n')}
return {P:P,Cell:Cell,get cells(){return cells;},set cells(v){cells=v;},ev:ev,get seq(){return clusterSeq;},set seq(v){clusterSeq=v;},
 frame:function(){for(var i=cells.length-1;i>=0;i--){var c=cells[i];for(var k=i-1;k>=0;k--)interact(c,cells[k]);if(!c.alive){ev.death++;cells.splice(i,1);}}}};`;
const J=new Function(code)();
const P=J.P;
const [N,BOX]=[+process.argv[3]||200,+process.argv[4]||120];
const wasmPath=process.env.WASM_B||path.join(__dirname,'..','wasm','target','wasm32-unknown-unknown','release','ca2core.wasm');
(async()=>{
const E=(await WebAssembly.instantiate(fs.readFileSync(wasmPath),{})).instance.exports;
const PI=['interactionRadius','slowDownRadius','speedReductionFactor','baseMaxSpeed','maxSpeedVariation','energyConsumptionRate','selectOn','genomeOn','selStrength','eatMergeOn','clusterCohesion','symbiosisOn','foodEatR','foodEnergyValue','foodGrow','foodGrowAmt','CELL_RADIUS','foodGrowMax','divideOn','divideAt','UNIVERSE_SIZE','foodShrink','boundAware','boundZone','boundForce','restless','eatRatio','eatChance','mergeGene','mergeChance','symbiogenesisOn','energyGainFromInteraction','GENE_MIN','GENE_MAX','minEnergyForReproduction','clusterMax','genomeMut','mutationRateRange','metaballStrength'];
let SEQ=0;function mkState(){const cs=[];for(let i=0;i<N;i++){const c=new J.Cell(Math.random()*BOX,Math.random()*BOX,Math.round((Math.random()-0.5)*14),5);c.radius=P.CELL_RADIUS*(0.7+Math.random()*1.1);c.energy=3+Math.random()*12;cs.push(c);}if(process.env.CL){let id=0;for(let i=0;i<N;){const sz=1+Math.floor(Math.random()*4);if(sz>1){id++;for(let k=0;k<sz&&i+k<N;k++)cs[i+k].cl=id;}i+=sz;}SEQ=id;}return cs;}
function clone(cs){return cs.map(c=>{const d=Object.create(Object.getPrototypeOf(c));Object.assign(d,c);d.g=JSON.parse(JSON.stringify(c.g));d.shp=JSON.parse(JSON.stringify(c.shp));d.sym=null;return d;});}
function pack(cs){const n=cs.length,cap=n+256;E.sim_cells(cap);E.sim_food(2);E.sim_cm(2);const cp=E.sim_cells(cap);E.sim_food(2);const pp=E.sim_params();
 const buf=E.memory.buffer,cf=new Float64Array(buf,cp,cap*ST),p=new Float64Array(buf,pp,80);
 cs.forEach((c,i)=>{const b=i*ST,g=c.g;cf.set([c.x,c.y,c.vx,c.vy,c.radius,c.energy,c.gene,1,c.maxSpeed,c.speedModifier,c.hostility,c.mutationRate,c.sv,c.cl||0,-1,g.spd,g.app,g.bnd,g.col[0],g.col[1],g.col[2],c.comp||0,0,0],b);});
 E.sim_set_n(n);E.sim_set_nf(0);E.sim_cm_count(0);
 PI.forEach((k,i)=>{let v=P[k];p[i]=typeof v==='boolean'?(v?1:0):v;});p[39]=1;p[40]=0.5;p[41]=1;p[42]=0;p[46]=-1e9;p[47]=-1e9;p[48]=0;p[49]=0;p[50]=0;p[51]=1e9;p[52]=1e9;p[53]=0;p[54]=SEQ;p[56]=1;(process.env.OFFP||"").split(",").filter(Boolean).forEach(i=>p[+i]=0);}
const nStates=+process.argv[5]||10;
const EPS=1e-9;
function runJS(base){const cs=clone(base);cs.forEach((c,i)=>{c.__i134=i;c.__x0=c.x;c.__y0=c.y;c.__cap0=(c.maxSpeed||0)+1;});J.cells=cs;J.frame();let worst=0,over=0,worstRatio=0;const after={};
 for(const c of J.cells){if(c.__i134===undefined)continue;after[c.__i134]=c;if(!c.alive)continue;const d=Math.hypot(c.x-c.__x0,c.y-c.__y0);worst=Math.max(worst,d);if(d>c.__cap0+EPS)over++;worstRatio=Math.max(worstRatio,d/c.__cap0);}
 return{worst,over,worstRatio,after};}
function runWasm(base){pack(clone(base));const cp=E.sim_cells_ptr();const cf0=new Float64Array(E.memory.buffer,cp,base.length*ST).slice();
 E.sim_step(12345,67890);const cf=new Float64Array(E.memory.buffer,E.sim_cells_ptr(),base.length*ST);let worst=0,over=0,worstRatio=0;
 for(let i=0;i<base.length;i++){const b=i*ST;if(!cf[b+7]||cf[b+23]<0)continue;const d=Math.hypot(cf[b]-cf0[b],cf[b+1]-cf0[b+1]);worst=Math.max(worst,d);const cap=cf0[b+8]+1;if(d>cap+EPS)over++;worstRatio=Math.max(worstRatio,d/cap);}return{worst,over,worstRatio,cf};}
const out=[];for(let s=0;s<nStates;s++){const base=mkState();if(process.env.ZEROV)base.forEach(c=>{c.vx=0;c.vy=0;});if(process.env.MS0)base.forEach(c=>{c.maxSpeed=0;});if(process.env.RADEQ)base.forEach(c=>{c.radius=base[0].radius;});if(process.env.RING){const R0=base[0].radius;base.length=13;base.forEach((c,i)=>{c.vx=0;c.vy=0;c.maxSpeed=0;c.cl=0;if(i==0){c.x=60;c.y=60;}else{const a=i*Math.PI/6;c.x=60+Math.cos(a)*R0*0.9;c.y=60+Math.sin(a)*R0*0.9;c.radius=R0;}});}
 const j=runJS(base),w=runWasm(base);let maxDiv=0,matched=0;
 for(let i=0;i<base.length;i++){const c=j.after[i];if(!c||!c.alive)continue;const b=i*ST;if(!w.cf[b+7]||w.cf[b+23]<0)continue;matched++;const dv=Math.hypot(c.x-w.cf[b],c.y-w.cf[b+1]);if(dv>maxDiv)maxDiv=dv;}
 out.push({j,w});console.log('state',s,'JS worst px',j.worst.toFixed(3),'over',j.over,'ratio',j.worstRatio.toFixed(2),'| wasm worst px',w.worst.toFixed(3),'over',w.over,'ratio',w.worstRatio.toFixed(2),'| max JS-vs-wasm divergence px',maxDiv.toFixed(3),'matched',matched);}
const jFail=out.some(o=>o.j.over>0),wFail=out.some(o=>o.w.over>0);
console.log(jFail||wFail?('FAIL: per-cell budget exceeded ('+[jFail?'JS':null,wFail?'wasm':null].filter(Boolean).join('+')+')'):'PASS: per-cell budget holds in both engines (all states)');process.exit(jFail||wFail?1:0);
})();
