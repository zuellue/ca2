// t-habseed-jsrnd: Rust sim_hab_seed (habSeed + Cell ctor, jsrnd binary, draws via env.js_rnd=Math.random) vs the JS habSeed, same seeded Math.random.
// Compared: every cell field Object.is (x,y,vx,vy,radius,energy,gene,sv,maxSpeed,speedModifier,hostility,mutationRate,g.*,popD,life,shp.*) and the total draw count.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var UI_END=800,CELL_END=1300,frameT=0,cells=[],habStat={seed:0},ateHueV=null;
function clamp(v,a,b){return v<a?a:v>b?b:v}
${['rand2D','normCol','newShape','Cell','habSeed'].map(fn).join('\n')}
return {habSeed:habSeed,cells:cells,setAte:function(v){ateHueV=v}};`;
(async()=>{
const bin=process.argv[2]||'ca2core-jsrnd.wasm';
const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>Math.random()}})).instance.exports;
let s=99;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
function w(f,seed){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
const names=['x','y','vx','vy','radius','energy','gene','sv','maxSpeed','speedModifier','hostility','mutationRate'];
let tot=0,bad=0,fields=0,genes={};
for(let t=0;t<20000;t++){
 const P={habitatMut:r0()*0.3,habitatSeedR:0.3+r0(),GENE_MIN:-6+Math.floor(r0()*3),GENE_MAX:4+Math.floor(r0()*4),baseMutationRate:r0()*10,mutationRateRange:r0()*5,baseMaxSpeed:r0()*3,maxSpeedVariation:r0()*1.5,CELL_RADIUS:2+r0()*8,genomeOn:t%2,cellLife:t%3?0:1000+r0()*5000,cellLifeVar:r0()*0.5,genomeMut:0.1};
 const f={x:r0()*800,y:r0()*600};if(t%4){f.hr=r0();f.hg=r0();f.hb=r0();}
 const ate=t%5==0?null:[r0(),r0(),r0()];
 const H=new Function('P','WC','location',body)(P,{},{search:''});H.setAte(ate);
 const hue=f.hr!==undefined?[f.hr,f.hg,f.hb]:(ate||[1/3,1/3,1/3]);
 const seed=t*31+7;
 const a=w(()=>{H.habSeed(f);return H.cells[H.cells.length-1];},seed);
 const b=w(()=>{const I=new Float64Array(E.memory.buffer,E.sim_hab_in(),32);I.set([f.x,f.y,hue[0],hue[1],hue[2],P.habitatMut,P.habitatSeedR,P.GENE_MIN,P.GENE_MAX,P.baseMutationRate,P.mutationRateRange,P.baseMaxSpeed,P.maxSpeedVariation,P.CELL_RADIUS,P.genomeOn,P.cellLife,P.cellLifeVar]);E.sim_hab_seed();return Array.from(new Float64Array(E.memory.buffer,E.sim_hab_out(),29));},seed);
 const c=a.v,r=b.v;tot++;
 const exp=[c.x,c.y,c.vx,c.vy,c.radius,c.energy,c.gene,c.sv,c.maxSpeed,c.speedModifier,c.hostility,c.mutationRate,c.g.spd,c.g.app,c.g.bnd,c.g.col[0],c.g.col[1],c.g.col[2],c.popD,c.life,c.shp.t,c.shp.asp,c.shp.th,c.shp.wig,c.shp.wsp,c.shp.sat,c.shp.ph,c.shp.ph2,c.shp.dir];
 let ok=a.n===b.n;for(let i=0;i<29;i++){fields++;if(!Object.is(exp[i],r[i]))ok=false;}
 genes[c.gene]=(genes[c.gene]||0)+1;
 if(!ok){bad++;if(bad<4){console.log('BAD',t,a.n,b.n);for(let i=0;i<29;i++)if(!Object.is(exp[i],r[i]))console.log(' f',i,exp[i],r[i]);}}
}
console.log(JSON.stringify({checks:tot,fieldsCompared:fields,mismatch:bad,geneKinds:Object.keys(genes).length,binary:bin}));process.exit(bad?1:0);})();
