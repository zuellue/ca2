// frozen-input isolation: JS interact loop vs wasm sim_step (interact-only, p[56]=1) on identical cell sets.
// usage: node devtools/t70-interact-iso.js [trials] [ncells] [box]
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');if(i<0)throw name;let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
function vr(name){const i=src.indexOf('var '+name+' = ');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1)+';';}
const names=['rand2D','normCol','speedOf','mutGenome','mixGenome','newShape','mixShape','mutateGene','Cell','clusterSize','joinCluster','fuseCells','interact','reproduce'];
const code=`var UI_END=800,CELL_END=1300;
var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var clamp=function(v,a,b){return v<a?a:v>b?b:v;};var lerp=function(a,b,t){return a+(b-a)*t;};var map=function(v,a,b,c,d){return c+(d-c)*(v-a)/(b-a);};
${vr('P')}
var cells=[],ev={birth:0,death:0,hit:0,oob:0},clusterSeq=0;
${names.map(fn).join('\n')}
return {P:P,Cell:Cell,get cells(){return cells;},set cells(v){cells=v;},ev:ev,get seq(){return clusterSeq;},set seq(v){clusterSeq=v;},
 frame:function(){for(var i=cells.length-1;i>=0;i--){var c=cells[i];for(var k=i-1;k>=0;k--)interact(c,cells[k]);if(!c.alive){ev.death++;cells.splice(i,1);}}}};`;
const J=new Function(code)();
const P=J.P;
const [trials,N,BOX]=[+process.argv[2]||3000,+process.argv[3]||75,+process.argv[4]||160];
const wasm=fs.readFileSync(path.join(__dirname,'..','wasm','target','wasm32-unknown-unknown','release','ca2core.wasm'));
(async()=>{
const E=(await WebAssembly.instantiate(wasm,{})).instance.exports;
const PI=['interactionRadius','slowDownRadius','speedReductionFactor','baseMaxSpeed','maxSpeedVariation','energyConsumptionRate','selectOn','genomeOn','selStrength','eatMergeOn','clusterCohesion','symbiosisOn','foodEatR','foodEnergyValue','foodGrow','foodGrowAmt','CELL_RADIUS','foodGrowMax','divideOn','divideAt','UNIVERSE_SIZE','foodShrink','boundAware','boundZone','boundForce','restless','eatRatio','eatChance','mergeGene','mergeChance','symbiogenesisOn','energyGainFromInteraction','GENE_MIN','GENE_MAX','minEnergyForReproduction','clusterMax','genomeMut','mutationRateRange','metaballStrength'];
let SEQ=0;function mkState(){const cs=[];for(let i=0;i<N;i++){const c=new J.Cell(Math.random()*BOX,Math.random()*BOX,Math.round((Math.random()-0.5)*14),5);c.radius=P.CELL_RADIUS*(0.7+Math.random()*1.1);c.energy=3+Math.random()*12;cs.push(c);}if(process.env.CL){let id=0;for(let i=0;i<N;){const sz=1+Math.floor(Math.random()*4);if(sz>1){id++;for(let k=0;k<sz&&i+k<N;k++)cs[i+k].cl=id;}i+=sz;}SEQ=id;}return cs;}
function clone(cs){return cs.map(c=>{const d=Object.create(Object.getPrototypeOf(c));Object.assign(d,c);d.g=JSON.parse(JSON.stringify(c.g));d.shp=JSON.parse(JSON.stringify(c.shp));d.sym=null;return d;});}
function pack(cs){const n=cs.length,cap=n+256;E.sim_cells(cap);E.sim_food(2);E.sim_cm(2);const cp=E.sim_cells(cap);E.sim_food(2);const pp=E.sim_params();
 const buf=E.memory.buffer,cf=new Float64Array(buf,cp,cap*25),p=new Float64Array(buf,pp,80);
 cs.forEach((c,i)=>{const b=i*25,g=c.g;cf.set([c.x,c.y,c.vx,c.vy,c.radius,c.energy,c.gene,1,c.maxSpeed,c.speedModifier,c.hostility,c.mutationRate,c.sv,c.cl||0,-1,g.spd,g.app,g.bnd,g.col[0],g.col[1],g.col[2],c.comp||0,0,0,0],b);});
 E.sim_set_n(n);E.sim_set_nf(0);E.sim_cm_count(0);
 PI.forEach((k,i)=>{let v=P[k];p[i]=typeof v==='boolean'?(v?1:0):v;});p[39]=1;p[40]=0.5;p[41]=1;p[42]=0;p[46]=-1e9;p[47]=-1e9;p[48]=0;p[49]=0;p[50]=0;p[51]=1e9;p[52]=1e9;p[53]=0;p[54]=SEQ;p[56]=1;}
const K=['birth','divide','eaten','merge','fuse','pair','hit'];
const mean=(a)=>a.map(x=>x);
let tj=new Array(8).fill(0),tw=new Array(8).fill(0);
const J_ev=()=>[J.ev.birth,0,J.ev.eaten||0,J.ev.merge||0,J.ev.fuse||0,J.ev.pair||0,J.ev.hit,J.ev.death];
const nStates=+process.argv[5]||10; let S2j=new Array(8).fill(0),S2w=new Array(8).fill(0);
for(let s=0;s<nStates;s++){const base=mkState();tj.fill(0);tw.fill(0);
 for(let t=0;t<trials;t++){
  J.cells=clone(base);J.seq=SEQ;for(const k of Object.keys(J.ev))J.ev[k]=0;J.ev.birth=0;J.ev.death=0;J.ev.hit=0;J.frame();const a=J_ev();a.forEach((v,i)=>tj[i]+=v);
  pack(clone(base));E.sim_step(Math.floor(Math.random()*4294967296),Math.floor(Math.random()*4294967296));const o=new Float64Array(E.memory.buffer,E.sim_out(),32);
  const b=[o[0],o[1],o[2],o[3],o[4],o[5],o[6],o[9]];b.forEach((v,i)=>tw[i]+=v);}
 console.log('state',s,K.concat('death').map((k,i)=>k+' js '+(tj[i]/trials).toFixed(4)+' wasm '+(tw[i]/trials).toFixed(4)+' ('+(tj[i]?((tw[i]/tj[i]-1)*100).toFixed(0):'-')+'%)').join(' | '));
 tj.forEach((v,i)=>S2j[i]+=v);tw.forEach((v,i)=>S2w[i]+=v);}
console.log('TOTAL',K.concat('death').map((k,i)=>k+' js '+(S2j[i]/trials/nStates).toFixed(4)+' wasm '+(S2w[i]/trials/nStates).toFixed(4)+' ('+(S2j[i]?((S2w[i]/S2j[i]-1)*100).toFixed(1):'-')+'%)').join('\n  '));
})();
