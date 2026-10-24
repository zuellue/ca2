// t-tr-baseline: REAL transPassW/stepComposition extracted from ca2.js. Wrapper = the stepTrans plan-path structure (transPassW, else the JS radius-drift loop + stepComposition); compSpawns stubbed (spawn path out of scope here). Route A: no WC.e (pure JS body). Route B: wasm tr_run candidate (jsrnd binary). Same seeded Math.random, identical cells; exact comparison of x,y,radius,alive,mutationRate, ev.death, open, draws.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`function clamp(v,a,b){return v<a?a:v>b?b:v}var ev={death:0},cells=[],trans=null;function compSpawns(){}
${['transPassW','stepComposition'].map(fn).join('\n')}
return {run:function(now,dt,plan){var open;if(plan){open=transPassW(now,dt,true);if(open===-2)open=trans.open||0;else if(open<0){for(var ii=0;ii<cells.length;ii++){var cc=cells[ii];cc.radius+=(P.CELL_RADIUS-cc.radius)*Math.min(1,0.004*cc.mutationRate);}open=stepComposition(now,dt);}}else{var trp=transPassW(now,dt,false);open=0;if(trp<0&&trp!==-2){for(var ii=0;ii<cells.length;ii++){var cc=cells[ii];cc.radius+=(P.CELL_RADIUS-cc.radius)*Math.min(1,0.004*cc.mutationRate);}}}return open},st:function(v){if(v){cells=v.cells;trans=v.trans;ev=v.ev}return {cells:cells,ev:ev}}};`;
const bin=process.argv[2];
async function inst(WC){const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;return Math.random()}}})).instance.exports;Object.assign(WC,{e:E,mem:E.memory,jsrnd:true,ok:true,off:false,simOff:false})}
let TE=null;if(process.env.TRIGWASM)TE=new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(process.env.TRIGWASM))).exports;
const SHM=TE?Object.assign(Object.create(Math),{sin:TE.s,cos:TE.c,atan2:TE.a}):Math;
function mk(WC,P,shim){return new Function('WC','P','location','Math',body)(WC,P,{search:''},shim?SHM:Math)}
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
let s=77;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
const names=['normal','early','near','late','nodst','dead','bend','nonfiniteXY','nanAttr','noplan','empty','zeroD'];
function world(cls,nowT){const n=cls===10?0:3+Math.floor(r0()*40);const cells=[];
 for(let i=0;i<n;i++){const c={x:r0()*500,y:r0()*400,radius:20+r0()*30,mutationRate:0.5+r0()*10,alive:r0()<0.9,dst:[r0()*500,r0()*400],dl:r0()*300,durK:0.5+r0(),pace:0.5+r0(),bend:r0()<0.5?0:r0()*2-1,dying:r0()<0.4};
  if(cls===1)c.dl=nowT+r0()*500;if(cls===2){c.dst=[c.x+r0()*20-10,c.y+r0()*20-10];c.dying=true;c.dl=0;}if(cls===3)c.dying=true;if(cls===4&&r0()<0.5)c.dst=null;if(cls===5)c.alive=r0()<0.3;if(cls===6)c.bend=r0()*2-1;
  if(cls===7&&r0()<0.15)c[r0()<0.5?'x':'y']=[NaN,Infinity,-Infinity][Math.floor(r0()*3)];
  if(cls===8&&r0()<0.3){const k=['pace','dl','durK','bend','mutationRate'][Math.floor(r0()*5)];c[k]=NaN;}
  if(cls===11){c.dst=[c.x,c.y];c.dying=r0()<0.5;}
  cells.push(c);}
 return cells}
const clone=cs=>cs.map(c=>({...c,dst:c.dst?c.dst.slice():c.dst}));
const RP=(k,v)=>typeof v==='number'&&!isFinite(v)?'N:'+v:(Object.is(v,-0)?'-0':v);
const sig=(R,o)=>JSON.stringify([R.cells.map(c=>[c.x,c.y,c.radius,c.mutationRate,c.alive,c.dst,c.dl,c.pace,c.bend]),R.ev.death,o],RP);
(async()=>{const byClass={};let drawBad=0,tot=0;const ex=[];
for(let t=0;t<6000;t++){const cls=t%12;const P={CELL_RADIUS:25+r0()*20};const t0=1000,dur=1500+r0()*1000;const now=t0+(cls===3?dur*1.6+r0()*500:r0()*dur*1.4),dt=8+r0()*30;const plan=cls!==9;
 const W0=world(cls,now-t0);const mkTr=()=>({t0,dur});
 const A=mk({},P,true),WC={};await inst(WC);const B=mk(WC,P,false);
 const SA={cells:clone(W0),trans:mkTr(),ev:{death:0}},SB={cells:clone(W0),trans:mkTr(),ev:{death:0}};A.st(SA);B.st(SB);
 const a=w(t*5+1,()=>A.run(now,dt,plan)),fw0=WC.fwTr||0,b=w(t*5+1,()=>B.run(now,dt,plan)),fell=(WC.fwTr||0)===fw0;
 const ok=sig(A.st(),a.v)===sig(B.st(),b.v),dr=a.n!==b.n;tot++;
 const c=byClass[names[cls]]=byClass[names[cls]]||{n:0,bad:0,drawBad:0,jsFallback:0};c.n++;if(fell)c.jsFallback++;if(!ok){c.bad++;if(process.env.DBG&&c.bad<=2&&(cls===8||cls===9)){const x=JSON.parse(sig(A.st(),a.v)),y=JSON.parse(sig(B.st(),b.v));for(let i=0;i<x[0].length;i++)if(JSON.stringify(x[0][i])!==JSON.stringify(y[0][i])){console.log('DIFF',t,names[cls],i,JSON.stringify(x[0][i]),JSON.stringify(y[0][i]));break}console.log('ev/open',JSON.stringify([x[1],x[2],y[1],y[2]]))}if(ex.length<3)ex.push({t,cls:names[cls],fell});}if(dr){c.drawBad++;drawBad++}}
console.log(JSON.stringify({binary:bin,scenarios:tot,byClass,mismatchTotal:Object.values(byClass).reduce((x,v)=>x+v.bad,0),drawCountMismatch:drawBad,examples:ex}));process.exit(0)})();
