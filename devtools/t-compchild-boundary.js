// t-compchild-boundary: REAL compChildJs / compChildW source extracted from ca2.js (+ Cell, newShape, mutGenome, mutateGene, speedOf, rand2D, normCol), jsrnd wasm (sim_comp_child) vs the JS-only compChildJs on identical parents and seeded Math.random.
// Compares every child field Object.is (x,y,vx,vy,radius,energy,gene,sv,maxSpeed,speedModifier,hostility,mutationRate,g.*,popD,life,shp.*,dst identity,pace,dl,durK,bend,cl,age,alive) and draw counts.
// Parents: shape t in {0,1(legacy),2}, genomeOn on/off, cellLife on/off, gene at the clamp edges. Non-number parent fields take the JS path (counted, checked equal). Fault: throw at draw k -> degraded (null, WC.ccDeg=1), not parity.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var UI_END=800,CELL_END=1300,frameT=0;
function clamp(v,a,b){return v<a?a:v>b?b:v}
${['rand2D','normCol','newShape','mutateGene','mutGenome','speedOf','Cell','compChildJs','compChildW'].map(fn).join('\n')}
return {js:compChildJs,w:compChildW};`;
const bin=process.argv[2]||'wasm/target-jsrnd/wasm32-unknown-unknown/release/ca2core.wasm';
async function inst(thr,WC){let n=0;const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;n++;if(thr&&n>thr)throw new Error('fault');return Math.random()}}})).instance.exports;Object.assign(WC,{e:E,mem:E.memory,jsrnd:true,ok:true,off:false,simOff:false});return E}
function mk(WC,P){return new Function('P','WC','location',body)(P,WC,{search:''})}
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
const flat=c=>[c.x,c.y,c.vx,c.vy,c.radius,c.energy,c.gene,c.sv,c.maxSpeed,c.speedModifier,c.hostility,c.mutationRate,c.g.spd,c.g.app,c.g.bnd,c.g.col[0],c.g.col[1],c.g.col[2],c.popD,c.life,c.shp.t,c.shp.asp,c.shp.th,c.shp.wig,c.shp.wsp,c.shp.sat,c.shp.ph,c.shp.ph2,c.shp.dir,c.pace,c.dl,c.durK,c.bend,c.cl,c.age,c.alive?1:0,c.bornAt];
(async()=>{const WC0={};await inst(0,WC0);
let s=41;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};let tot=0,bad=0,drawBad=0,fields=0,jsPath=0,shapes={},bend0=0;
for(let t=0;t<30000;t++){
 const P={GENE_MIN:-6+Math.floor(r0()*3),GENE_MAX:4+Math.floor(r0()*4),genomeMut:[0,0.05,0.12,0.5][t%4],mutationRateRange:r0()*5,baseMaxSpeed:r0()*3,maxSpeedVariation:r0()*1.5,CELL_RADIUS:2+r0()*8,genomeOn:t%2,cellLife:t%3?0:1000+r0()*5000,cellLifeVar:r0()*0.5};
 const A=mk(WC0,P),B=mk(WC0,P);
 const tt=[0,1,2][t%3];const par=()=>({x:r0()*800,y:r0()*600,gene:Math.floor(r0()*13)-6,mutationRate:r0()*25,radius:1+r0()*20,g:{spd:0.5+r0()*1.1,app:r0(),bnd:0.5+r0()*1.5,col:[0.1+r0()*0.5,0.1+r0()*0.5,0.1+r0()*0.5]},shp:{t:tt,asp:1+r0()*6,th:0.25+r0()*0.85,wig:r0()*1.4,wsp:0.2+r0()*2.3,sat:tt?Math.floor(r0()*4):0,ph:r0()*6.28,ph2:r0()*6.28,dir:r0()*6.28}});
 s=t*19+3;const p1=par();s=t*19+3;const p2=par();
 const bad_in=t%97===0;if(bad_in){delete p1.shp.sat;delete p2.shp.sat}
 const pt=[1,2],pt2=[1,2];
 const a=w(t*7+5,()=>A.js(p1,pt)),b=w(t*7+5,()=>B.w(p2,pt2));
 tot++;shapes[tt]=(shapes[tt]||0)+1;if(bad_in)jsPath++;if(a.v.bend===0)bend0++;
 let ok=a.n===b.n;if(!ok)drawBad++;const fa=flat(a.v),fb=flat(b.v);for(let i=0;i<fa.length;i++){fields++;if(!Object.is(fa[i],fb[i]))ok=false}
 if(b.v.dst!==pt2||a.v.dst!==pt)ok=false;
 if(!ok){bad++;if(bad<4){console.log('MISMATCH',t,a.n,b.n);for(let i=0;i<fa.length;i++)if(!Object.is(fa[i],fb[i]))console.log(' f',i,fa[i],fb[i])}}}
const mkPar=()=>({x:1,y:2,gene:0,mutationRate:5,radius:6,g:{spd:1,app:.5,bnd:1,col:[.3,.3,.4]},shp:{t:2,asp:2,th:.5,wig:.3,wsp:1,sat:3,ph:1,ph2:2,dir:3}});
const PP={GENE_MIN:-6,GENE_MAX:6,genomeMut:0.12,mutationRateRange:2,baseMaxSpeed:1,maxSpeedVariation:0.5,CELL_RADIUS:5,genomeOn:1,cellLife:1000,cellLifeVar:0.2};const totN=w(8,()=>mk(WC0,PP).w(mkPar(),[0,0])).n;
let fT=0,fB=0;for(let k=1;k<totN;k++){const WC={},Ef=await inst(k,WC);const P={GENE_MIN:-6,GENE_MAX:6,genomeMut:0.12,mutationRateRange:2,baseMaxSpeed:1,maxSpeedVariation:0.5,CELL_RADIUS:5,genomeOn:1,cellLife:1000,cellLifeVar:0.2};
 const B=mk(WC,P);const par={x:1,y:2,gene:0,mutationRate:5,radius:6,g:{spd:1,app:.5,bnd:1,col:[.3,.3,.4]},shp:{t:2,asp:2,th:.5,wig:.3,wsp:1,sat:3,ph:1,ph2:2,dir:3}};
 let out;w(8,()=>{out=B.w(par,[0,0])});fT++;if(!(out===null&&WC.ccDeg===1&&WC.cchOff===true&&WC.rndN===k+1))fB++}
console.log(JSON.stringify({scenarios:tot,fields,shapeTypes:shapes,bendZero:bend0,jsPathScenarios:jsPath,mismatch:bad,drawCountMismatch:drawBad,faultCases:fT,drawsPerChildInFaultCase:totN,faultBad:fB,binary:bin}));process.exit(bad||fB?1:0)})();
