// CA-14: engine wall-time, wasm sim_step vs the extracted JS frame (update+checkSurvival+interact+keepIn+limit, deferred death sweep).
// Constant population (all conversion gates off) so ms/step is comparable at fixed N. Usage: node devtools/t-perf-engines.js [steps=200]
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..',process.env.CA_JS||'test/ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');if(i<0)throw name;let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
function vr(name){const i=src.indexOf('var '+name+' = ');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1)+';';}
const names=['rand2D','normCol','speedOf','mutGenome','mixGenome','newShape','mixShape','mutateGene','Cell','effR','birthCapF','clusterSize','joinCluster','fuseCells','interact','reproduce','checkSurvival','limit','misfit','update','organic','keepIn','divide','wallPull','carrySide'];
const code=`var frameT=0,frameDtf=16.7,UI_END=800,CELL_END=1300;
var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var clamp=function(v,a,b){return v<a?a:v>b?b:v;};var lerp=function(a,b,t){return a+(b-a)*t;};var map=function(v,a,b,c,d){return c+(d-c)*(v-a)/(b-a);};
${vr('P')}
var cells=[],food=[],ev={birth:0,death:0,hit:0,oob:0},clusterSeq=0,cmean={},cont={x:0,y:0,w:1e9,h:1e9,wvx0:0,wvx1:0,wvy0:0,wvy1:0},mouse={x:-1e9,y:-1e9,over:false},resizeDrag=false,env={spd:1,app:0.5,bnd:1,col:null};
function habAte(){}function habReap(){}
${names.map(fn).join('\n')}
return {P:P,Cell:Cell,cont:cont,get cells(){return cells;},set cells(v){cells=v;},ev:ev,
 frame:function(){for(var i=cells.length-1;i>=0;i--){var c=cells[i];update(c);checkSurvival(c);for(var k=i-1;k>=0;k--)interact(c,cells[k]);if(P.boundAware&&c.alive)keepIn(c);if(c.alive)limit(c,c.maxSpeed*c.speedModifier);if(!c.alive)ev.death++;}for(var i2=cells.length-1;i2>=0;i2--)if(!cells[i2].alive)cells.splice(i2,1);}};`;
const J=new Function(code)();const P=J.P;
P.eatChance=0;P.mergeChance=0;P.reproChance=0;P.divideOn=0;P.habitatOn=0; // constant population: gates evaluated, never convert
const wasm=fs.readFileSync(path.join(__dirname,'..',process.env.WASM||'test/ca2core.wasm'));
const STEPS=+process.argv[2]||200, WARM=50;
const PI=['interactionRadius','slowDownRadius','speedReductionFactor','baseMaxSpeed','maxSpeedVariation','energyConsumptionRate','selectOn','genomeOn','selStrength','eatMergeOn','clusterCohesion','symbiosisOn','foodEatR','foodEnergyValue','foodGrow','foodGrowAmt','CELL_RADIUS','foodGrowMax','divideOn','divideAt','UNIVERSE_SIZE','foodShrink','boundAware','boundZone','boundForce','restless','eatRatio','eatChance','mergeGene','mergeChance','symbiogenesisOn','energyGainFromInteraction','GENE_MIN','GENE_MAX','minEnergyForReproduction','clusterMax','genomeMut','mutationRateRange','metaballStrength'];
function mkState(N,BOX){const cs=[];for(let i=0;i<N;i++){const c=new J.Cell(Math.random()*BOX,Math.random()*BOX,Math.round((Math.random()-0.5)*14),5);c.radius=P.CELL_RADIUS*(0.7+Math.random()*1.1);c.energy=3+Math.random()*12;c.shp={t:0,asp:1,th:1,wig:0,wsp:1,sat:0,ph:0,ph2:0,dir:0};c.sq=0;c.crowd=0;c.envVx=0;c.envVy=0;c.sqS=0;cs.push(c);}return cs;}
function clone(cs){return cs.map(c=>{const d=Object.create(Object.getPrototypeOf(c));Object.assign(d,c);d.g=JSON.parse(JSON.stringify(c.g));d.shp=JSON.parse(JSON.stringify(c.shp));d.sym=null;return d;});}
(async()=>{const E=(await WebAssembly.instantiate(wasm,{})).instance.exports;const ST=E.sim_stride();
function pack(E,cs,BOX){const n=cs.length,cap=n+256;E.sim_cells(cap);E.sim_food(2);E.sim_cm(2);const cp=E.sim_cells(cap);E.sim_food(2);const pp=E.sim_params();
 const buf=E.memory.buffer,cf=new Float64Array(buf,cp,cap*ST),p=new Float64Array(buf,pp,97);
 cs.forEach((c,i)=>{const b=i*ST,g=c.g;cf.set([c.x,c.y,c.vx,c.vy,c.radius,c.energy,c.gene,1,c.maxSpeed,c.speedModifier,c.hostility,c.mutationRate,c.sv,c.cl||0,-1,g.spd,g.app,g.bnd,g.col[0],g.col[1],g.col[2],c.comp||0,0,0],b);if(ST>=30)cf.set([c.sq||0,c.crowd||0,c.envVx||0,c.envVy||0,0,0],b+24);});
 E.sim_set_n(n);E.sim_set_nf(0);E.sim_cm_count(0);
 PI.forEach((k,i)=>{let v=P[k];p[i]=typeof v==='boolean'?(v?1:0):v;});p[39]=1;p[40]=0.5;p[41]=1;p[42]=0;p[46]=-1e9;p[47]=-1e9;p[48]=0;p[49]=0;p[50]=0;p[51]=BOX;p[52]=BOX;p[53]=0;p[54]=0;p[56]=0;
 p[58]=0;p[59]=0;p[67]=P.symEnergy;p[68]=P.symBreak;p[69]=P.symBreakDist;p[70]=P.eatDistF;p[71]=P.fuseDistF;p[72]=P.symDistF;p[73]=0;p[74]=0;p[75]=0;p[76]=P.divideAgeMs;p[77]=P.divideEnergy;p[78]=16.7;p[79]=1.5;
 p[84]=P.wallCarry;p[85]=P.wallSpread;p[86]=P.squashMax;p[87]=P.squashIn;p[88]=P.squashOut;p[89]=P.senseR;p[90]=P.senseSlow;p[91]=P.senseTurn;p[92]=P.senseDelay;p[93]=P.crowdGain;p[94]=P.crowdRel;p[95]=P.crowdSlow;p[96]=P.crowdPush;}
const out=[];
for(const N of [75,200,600]){const BOX=Math.round(160*Math.sqrt(N/40));const base=mkState(N,BOX);
 // wasm: step-only (engine) - pack once, then STEPS steps on the evolving buffer
 pack(E,clone(base),BOX);for(let s=0;s<WARM;s++)E.sim_step(s+1,s+2);
 let t0=process.hrtime.bigint();for(let s=0;s<STEPS;s++)E.sim_step(s+1,s+2);const wMs=Number(process.hrtime.bigint()-t0)/1e6/STEPS;
 // JS frame
 J.cells=clone(base);for(let s=0;s<WARM;s++)J.frame();
 t0=process.hrtime.bigint();for(let s=0;s<STEPS;s++)J.frame();const jMs=Number(process.hrtime.bigint()-t0)/1e6/STEPS;
 out.push({N,BOX,wasmMsPerStep:+wMs.toFixed(4),jsMsPerStep:+jMs.toFixed(4),ratio:+(jMs/wMs).toFixed(2)});}
out.forEach(r=>console.log('N='+r.N+' box='+r.BOX+': wasm '+r.wasmMsPerStep+' ms/step, js '+r.jsMsPerStep+' ms/step, js/wasm = '+r.ratio+'x'));
})();
