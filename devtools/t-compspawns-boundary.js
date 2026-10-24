// t-compspawns-boundary: REAL compSpawns (+ compChildJs/compChildW, Cell, newShape, mutGenome, mutateGene, speedOf, rand2D, normCol, postOffW) extracted from ca2.js. Route A: no wasm (WC.e=null -> JS 12-probe parent search + compChildJs). Route B: jsrnd wasm (post_comp_parent + sim_comp_child). Same seeded Math.random, identical cells/trans/P/now/dt.
// Compares every spawned child field Object.is, ev.birth, trans.pending remainder, draw counts. Fault: throw at draw k inside post_comp_parent (spawn skipped, cpPDeg++, degraded, never parity) and inside sim_comp_child (null child, ccDeg++, degraded).
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const NAMES=['rand2D','normCol','newShape','mutateGene','mutGenome','speedOf','Cell','compChildJs','compChildW','postOffW','compSpawns'];
const BODY=`var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var UI_END=800,CELL_END=1300,frameT=0;
function clamp(v,a,b){return v<a?a:v>b?b:v}
${NAMES.map(fn).join('\n')}
compSpawns(now, dt);`;
const bin=process.argv[2]||'../ca2core-jsrnd.wasm';
async function inst(thr,WC){let n=0;const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;n++;if(thr&&n>thr)throw new Error('fault');return Math.random()}}})).instance.exports;Object.assign(WC,{e:E,mem:E.memory,jsrnd:true,ok:true,off:false,simOff:false});return E}
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
const flat=c=>[c.x,c.y,c.vx,c.vy,c.radius,c.energy,c.gene,c.sv,c.maxSpeed,c.speedModifier,c.hostility,c.mutationRate,c.g.spd,c.g.app,c.g.bnd,c.g.col[0],c.g.col[1],c.g.col[2],c.popD,c.life,c.shp.t,c.shp.asp,c.shp.th,c.shp.wig,c.shp.wsp,c.shp.sat,c.shp.ph,c.shp.ph2,c.shp.dir,c.pace,c.dl,c.durK,c.bend,c.cl,c.age,c.alive?1:0,c.bornAt];
(async()=>{const WCw={};await inst(0,WCw);
let s=41;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};let tot=0,bad=0,drawBad=0,fields=0,kids=0,spawnsSeen=0;
for(let t=0;t<20000;t++){
 const P={GENE_MIN:-6+Math.floor(r0()*3),GENE_MAX:4+Math.floor(r0()*4),genomeMut:[0,0.05,0.12,0.5][t%4],mutationRateRange:r0()*5,baseMaxSpeed:r0()*3,maxSpeedVariation:r0()*1.5,CELL_RADIUS:2+r0()*8,genomeOn:t%2,cellLife:t%3?0:1000+r0()*5000,cellLifeVar:r0()*0.5};
 const n=1+Math.floor(r0()*120),dens=[0,0.1,0.5,0.9,1][t%5],cellsT=[];
 for(let i=0;i<n;i++)cellsT.push({x:r0()*800,y:r0()*600,alive:r0()<dens?false:true,gene:Math.floor(r0()*13)-6,mutationRate:r0()*25,radius:1+r0()*20,g:{spd:0.5+r0()*1.1,app:r0(),bnd:0.5+r0()*1.5,col:[0.1+r0()*0.5,0.1+r0()*0.5,0.1+r0()*0.5]},shp:{t:t%3,asp:1+r0()*6,th:0.25+r0()*0.85,wig:r0()*1.4,wsp:0.2+r0()*2.3,sat:t%3?Math.floor(r0()*4):0,ph:r0()*6.28,ph2:r0()*6.28,dir:r0()*6.28}});
 if(t%7===0){for(let i=1;i<n;i++){cellsT[i].x=cellsT[0].x;cellsT[i].y=cellsT[0].y}} // equal distances: strict '<' tie rule
 const np=1+Math.floor(r0()*30),pendT=[];for(let i=0;i<np;i++)pendT.push([r0()*800,r0()*600]);
 const dt=[0,0.001,0.016,0.1,1][t%5],dur=[80,400,2000,1e9][t%4],now=r0()*1e5;
 const run=(wasm)=>{const cells=JSON.parse(JSON.stringify(cellsT));const trans={pending:pendT.map(p=>p.slice()),dur};const ev={birth:0};
  const WC=wasm?Object.assign(Object.create(WCw),{rndN:0,cpP:0,cpPDeg:0,ccN:0,ccDeg:0,cchOff:false,postOff:false}):{e:null,jsrnd:true,ok:true,off:false,simOff:false,rndN:0};
  new Function('P','WC','location','cells','trans','ev','now','dt',BODY)(P,WC,{search:''},cells,trans,ev,now,dt);
  return{cells,trans,ev,WC}};
 const seed=t*13+7;
 const a=w(seed,()=>run(false)),b=w(seed,()=>run(true));
 tot++;spawnsSeen+=b.v.ev.birth;
 let ok=a.n===b.n;if(!ok)drawBad++;
 if(a.v.ev.birth!==b.v.ev.birth)ok=false;
 if(a.v.trans.pending.length!==b.v.trans.pending.length)ok=false;
 for(let i=0;i<a.v.trans.pending.length;i++){if(a.v.trans.pending[i][0]!==b.v.trans.pending[i][0]||a.v.trans.pending[i][1]!==b.v.trans.pending[i][1])ok=false}
 const na=a.v.cells.length,nb=b.v.cells.length;if(na!==nb)ok=false;
 for(let i=Math.max(0,na-a.v.ev.birth);i<na&&i<nb;i++){kids++;const fa=flat(a.v.cells[i]),fb=flat(b.v.cells[i]);for(let j=0;j<fa.length;j++){fields++;if(!Object.is(fa[j],fb[j]))ok=false}}
 if(!ok){bad++;if(bad<4)console.log('MISMATCH',t,'draws',a.n,b.n,'birth',a.v.ev.birth,b.v.ev.birth,'cells',na,nb)}}
// fault classes
const Pf={GENE_MIN:-6,GENE_MAX:6,genomeMut:0.12,genomeOn:1,mutationRateRange:2,baseMaxSpeed:1,maxSpeedVariation:0.5,CELL_RADIUS:5,cellLife:1000,cellLifeVar:0.2};
const mkFaultCells=()=>{const cells=[];for(let i=0;i<40;i++)cells.push({x:i*7,y:i*3,alive:true,gene:0,mutationRate:5,radius:6,g:{spd:1,app:.5,bnd:1,col:[.3,.3,.4]},shp:{t:2,asp:2,th:.5,wig:.3,wsp:1,sat:3,ph:1,ph2:2,dir:3}});return cells};
let fT=0,fB=0,fT2=0,fB2=0;
for(let k=1;k<=11;k++){const WC={};await inst(k,WC);const cells=mkFaultCells(),trans={pending:[[10,10]],dur:400},ev={birth:0};
 w(9,()=>{new Function('P','WC','location','cells','trans','ev','now','dt',BODY)(Pf,WC,{search:''},cells,trans,ev,1000,0.016)});
 fT++; // post_comp_parent makes 12 probe draws; a throw at k<=11 kills the probe (k=12: probe done, fault lands in the child) -> spawn skipped, cpPDeg=1, pending consumed, no birth
 if(!(ev.birth===0&&WC.cpPDeg===1&&WC.postOff===true&&trans.pending.length===0&&cells.length===40))fB++}
for(let k=12;k<=20;k++){const WC={};await inst(k,WC);const cells=mkFaultCells(),trans={pending:[[10,10]],dur:400},ev={birth:0};
 w(9,()=>{new Function('P','WC','location','cells','trans','ev','now','dt',BODY)(Pf,WC,{search:''},cells,trans,ev,1000,0.016)});
 fT2++; // probe done (12 draws), fault inside sim_comp_child -> null child, ccDeg=1, no birth
 if(!(ev.birth===0&&WC.ccDeg===1&&WC.cchOff===true&&trans.pending.length===0&&cells.length===40))fB2++}
console.log(JSON.stringify({scenarios:tot,spawnsSeen,childrenCompared:kids,childFields:fields,mismatch:bad,drawCountMismatch:drawBad,faultParent:{cases:fT,bad:fB},faultChild:{cases:fT2,bad:fB2},binary:bin}));process.exit(bad||fB||fB2?1:0)})();
