// t135: CA-6 velocity attribution on the t133 dense fixture, NORMAL step (p[56]=0), 220 steps per state.
// Requires an instrumented wasm build: cargo build --release --target wasm32-unknown-unknown --features velattr
// (feature adds per-channel |dv| counters + |v|>maxSpeed argmax events; behavior is unchanged - t133/t134 PASS on the instrumented build).
// Channels: 0 upd_kick 1 upd_limit 2 organic 3 org_limit 4 cluster 5 symbiosis 6 food_seek 7 keepin 8 hostility 9 reflect 10 pair_kick 11 restless 12 newkid
// usage: node devtools/t135-vel-attribution.js [steps] [nstates]; env WASM_B (attr build), RD=1 (restless drag on), WALL=1 (plate = BOX: exercises keepin), N/BOX override
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..',process.env.CA_JS||'test/ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');if(i<0)throw name;let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
function vr(name){const i=src.indexOf('var '+name+' = ');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1)+';';}
const code=`var UI_END=800,CELL_END=1300,frameT=0;
var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var clamp=function(v,a,b){return v<a?a:v>b?b:v;};var lerp=function(a,b,t){return a+(b-a)*t;};var map=function(v,a,b,c,d){return c+(d-c)*(v-a)/(b-a);};
${vr('P')}
P.restless=3;
var cells=[],ev={birth:0,death:0,hit:0,oob:0},clusterSeq=0;
${['rand2D','normCol','newShape','Cell'].map(fn).join('\n')}
return {P:P,Cell:Cell};`;
const J=new Function(code)();
const P=J.P;
const STEPS=+process.argv[2]||220, NSTATES=+process.argv[3]||10;
const N=+process.env.N||200, BOX=+process.env.BOX||120;
const wasmPath=process.env.WASM_B||path.join(__dirname,'..','wasm','target','wasm32-unknown-unknown','release','ca2core.wasm');
(async()=>{
const E=(await WebAssembly.instantiate(fs.readFileSync(wasmPath),{})).instance.exports;
if(!E.sim_attr_ptr){console.log('FAIL: build has no velattr feature (cargo build --release --target wasm32-unknown-unknown --features velattr)');process.exit(1);}
const PI=['interactionRadius','slowDownRadius','speedReductionFactor','baseMaxSpeed','maxSpeedVariation','energyConsumptionRate','selectOn','genomeOn','selStrength','eatMergeOn','clusterCohesion','symbiosisOn','foodEatR','foodEnergyValue','foodGrow','foodGrowAmt','CELL_RADIUS','foodGrowMax','divideOn','divideAt','UNIVERSE_SIZE','foodShrink','boundAware','boundZone','boundForce','restless','eatRatio','eatChance','mergeGene','mergeChance','symbiogenesisOn','energyGainFromInteraction','GENE_MIN','GENE_MAX','minEnergyForReproduction','clusterMax','genomeMut','mutationRateRange','metaballStrength'];
let SEQ=0;
function mkState(){const cs=[];for(let i=0;i<N;i++){const c=new J.Cell(Math.random()*BOX,Math.random()*BOX,Math.round((Math.random()-0.5)*14),5);c.radius=P.CELL_RADIUS*(0.7+Math.random()*1.1);c.energy=3+Math.random()*12;cs.push(c);}return cs;}
function pack(cs){const n=cs.length,cap=n+256;const cp=E.sim_cells(cap);E.sim_food(2);E.sim_cm(2);const pp=E.sim_params();
 const buf=E.memory.buffer,cf=new Float64Array(buf,cp,cap*ST),p=new Float64Array(buf,pp,97);
 cs.forEach((c,i)=>{const b=i*ST,g=c.g;cf.set([c.x,c.y,c.vx,c.vy,c.radius,c.energy,c.gene,1,c.maxSpeed,c.speedModifier,c.hostility,c.mutationRate,c.sv,c.cl||0,-1,g.spd,g.app,g.bnd,g.col[0],g.col[1],g.col[2],c.comp||0,0,0,0,0,0,0,0,0],b);});
 E.sim_set_n(n);E.sim_set_nf(0);E.sim_cm_count(0);
 PI.forEach((k,i)=>{let v=P[k];p[i]=typeof v==='boolean'?(v?1:0):v;});
 p[39]=1;p[40]=0.5;p[41]=1;p[42]=0;p[46]=-1e9;p[47]=-1e9;p[48]=0;
 if(process.env.WALL){p[49]=0;p[50]=0;p[51]=BOX;p[52]=BOX;}else{p[49]=0;p[50]=0;p[51]=1e9;p[52]=1e9;}
 p[58]=5000;p[59]=0.02;p[60]=0.5;p[61]=-0.005;p[62]=1.0025;p[63]=1.005;p[64]=-0.0025;p[65]=0.008;p[66]=0.0025;p[78]=16.7; p[53]=process.env.RD?1:0;p[54]=0;p[56]=0;p[57]=0;
 return cp;}
const ST=30;
const CH=['upd_kick','upd_limit','organic','org_limit','cluster','symbiosis','food_seek','keepin','hostility','reflect','pair_kick','restless','newkid'];
const ALEN=E.sim_attr_len();
const agg=new Float64Array(ALEN);
let gMaxDisp=0, gMaxV=0, gEvents=0, gCellSteps=0, gMaxDispInfo=null;
for(let s=0;s<NSTATES;s++){
 const cs=mkState(); const cp=pack(cs);
 const ap=E.sim_attr_ptr(); new Float64Array(E.memory.buffer,ap,ALEN).fill(0);
 const S0=1000+s*7919, S1=2000+s*104729;
 for(let st=0;st<STEPS;st++){
   // pointers can move on buffer growth (births): re-anchor every step
   const cp2=E.sim_cells_ptr(); const pre=new Float64Array(E.memory.buffer,cp2,E.sim_cap()*ST).slice(0,cs.length*ST);
   E.sim_step(S0+st,S1+st);
   const cp3=E.sim_cells_ptr(); const cf=new Float64Array(E.memory.buffer,cp3,E.sim_cap()*ST);
   const n=E.sim_cap()>cs.length?cs.length:cs.length;
   for(let i=0;i<n;i++){const b=i*ST;
     if(!pre[b+7]||!cf[b+7]||pre[b+22]||cf[b+22])continue; // skip deaths/removals: index is not the same cell
     const dx0=cf[b]-pre[b],dy0=cf[b+1]-pre[b+1]; const d=Math.hypot(dx0,dy0); if(d>gMaxDisp){gMaxDisp=d;gMaxDispInfo={state:s,step:st,cell:i,d:d,dx:dx0,dy:dy0,b:b,pre:[pre[b],pre[b+1]],post:[cf[b],cf[b+1]]};}
     const v=Math.hypot(cf[b+2],cf[b+3]); if(v>gMaxV)gMaxV=v;
   }
 }
 const a=new Float64Array(E.memory.buffer,E.sim_attr_ptr(),ALEN);
 for(let k=0;k<ALEN;k++){ if(k%4===1&&k<52){ if(a[k]>agg[k])agg[k]=a[k]; } else if(k===53||k===54){ if(a[k]>agg[k])agg[k]=a[k]; } else agg[k]+=a[k]; }
 let nanStep=-1; for(let i=0;i<cs.length;i++){const b=i*ST;const cff=new Float64Array(E.memory.buffer,E.sim_cells_ptr(),E.sim_cap()*ST); if(Number.isNaN(cff[b+2])||Number.isNaN(cff[b+3])){nanStep=1;break;}}
 if(nanStep>=0)console.log('  state',s,'WARNING: NaN velocity present at end of run');
 gEvents+=a[52]; gCellSteps+=a[55];
 console.log('state',s,'overspeedEvents',a[52],'cellSteps',a[55],'maxEndV',a[53].toFixed(3),'maxOvershoot',a[54].toFixed(3),'meanEndV',(a[56]/Math.max(1,a[55])).toFixed(3));
}
console.log('\n=== aggregate over',NSTATES,'states x',STEPS,'steps, N='+N,'BOX='+BOX,'RD='+(process.env.RD?1:0),'WALL='+(process.env.WALL?1:0),'===');
console.log('channel        gross|dv|      maxSingle|dv|  writes        argmaxOverspeedEvents');
for(let c=0;c<13;c++){
 console.log(CH[c].padEnd(14), agg[c*4].toFixed(1).padStart(12), agg[c*4+1].toFixed(3).padStart(16), String(Math.round(agg[c*4+2])).padStart(12), String(Math.round(agg[c*4+3])).padStart(20));
}
console.log('agg maxEndV',agg[53].toFixed(3),'maxOvershoot',agg[54].toFixed(3));
console.log('\noverspeedEvents total',Math.round(gEvents),'of',Math.round(gCellSteps),'cell-steps ('+(100*gEvents/Math.max(1,gCellSteps)).toFixed(2)+'%)');
console.log('\nsigned contribution to overspeed |v| (sum of per-step channel projection onto final v, all overspeed events):');
for(let c=0;c<13;c++) console.log(CH[c].padEnd(14), agg[64+c].toFixed(1).padStart(14));
console.log('max end-of-step |v|',gMaxV.toFixed(3),' max single-step displacement px',gMaxDisp.toFixed(3));
if(gMaxDispInfo)console.log('maxDisp event:',JSON.stringify(gMaxDispInfo));
})();
