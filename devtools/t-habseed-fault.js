// t-habseed-fault (hook fault rule, degraded class, NOT parity). Based on t-habseed-jsrnd: Rust sim_hab_seed (habSeed + Cell ctor, jsrnd binary, draws via env.js_rnd=Math.random) vs the JS habSeed, same seeded Math.random.
// Compared: every cell field Object.is (x,y,vx,vy,radius,energy,gene,sv,maxSpeed,speedModifier,hostility,mutationRate,g.*,popD,life,shp.*) and the total draw count.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var UI_END=800,CELL_END=1300,frameT=0,cells=[],habStat={seed:0},ateHueV=null;
function clamp(v,a,b){return v<a?a:v>b?b:v}
${['rand2D','normCol','newShape','Cell','habSeed'].map(fn).join('\n')}
return {habSeed:habSeed,cells:cells,habStat:habStat};`;
function cn(o){return JSON.stringify(o,function(k,v){return v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce(function(a,q){a[q]=v[q];return a},{}):v})}
(async()=>{
const bin=process.argv[2]||'ca2core-jsrnd.wasm';
let thr=-1,c=0;const WC={ok:true,jsrnd:true};
const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{if(c===thr)throw new Error('fault');c++;WC.rndN=(WC.rndN||0)+1;return Math.random();}}})).instance.exports;WC.e=E;WC.mem=E.memory;
function w(f,seed){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
let bad=0,tot=0,fresh=0,cons=0,next=0;
for(let t=0;t<500;t++){for(const k of [0,1,5,12,20]){
 const P={habitatMut:0.1,habitatSeedR:0.5,GENE_MIN:-5,GENE_MAX:5,baseMutationRate:5,mutationRateRange:2,baseMaxSpeed:1,maxSpeedVariation:0.5,CELL_RADIUS:10,genomeOn:1,cellLife:0,cellLifeVar:0.2,genomeMut:0.1};
 const f={x:100+t,y:50,hr:0.3,hg:0.3,hb:0.4};
 WC.hsOff=false;WC.rndN=0;c=0;thr=k;
 const H=new Function('P','WC','location',body)(P,WC,{search:''}),J=new Function('P','WC','location',body)(P,{},{search:''});
 const seed=t*5+k;const h=w(()=>{H.habSeed(f);return H.cells.length},seed),j=w(()=>{J.habSeed(f);return J.cells.length},seed);tot++;
 let ok;
 if(!WC.hsOff) ok=h.n===j.n&&h.v===1&&cn(H.cells[0])===cn(J.cells[0]);
 else if(k===0){fresh++;ok=h.n===j.n&&h.v===1&&cn(H.cells[0])===cn(J.cells[0]);}
 else{cons++;ok=h.v===0&&h.n===k&&H.habStat.seed===0;}
 if(WC.hsOff){next++;const before=c;const h2=w(()=>{H.habSeed(f);return H.cells.length},seed+1),j2=w(()=>{J.habSeed(f);return J.cells.length},seed+1);if(c!==before||h2.n!==j2.n)ok=false;}
 if(!ok){bad++;if(bad<3)console.log('BAD',t,k,h,j,cn(H.cells[0]),cn(J.cells[0]));}
}}
console.log(JSON.stringify({checks:tot,faultBeforeAnyDraw:fresh,faultAfterDraws:cons,nextCallAfterFault:next,mismatch:bad,binary:bin}));process.exit(bad?1:0);})();
