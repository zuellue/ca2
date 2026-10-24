// t-tr-fault: js_rnd throws at draw k -> degraded (NOT parity): no redraw, pass skipped (-2), cells/ev unchanged, WC.trRunDeg=1, WC.trRunOff, Math.random draws == k, rndN == k+1; next pass runs the JS loops.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`function clamp(v,a,b){return v<a?a:v>b?b:v}var ev={death:0},cells=[],trans=null;function compSpawns(){}
${['transPassW','stepComposition'].map(fn).join('\n')}
return {run:function(now,dt,plan){var open;if(plan){open=transPassW(now,dt,true);if(open===-2)open=trans.open||0;else if(open<0){for(var ii=0;ii<cells.length;ii++){var cc=cells[ii];cc.radius+=(P.CELL_RADIUS-cc.radius)*Math.min(1,0.004*cc.mutationRate);}open=stepComposition(now,dt);}}else{var trp=transPassW(now,dt,false);open=0;if(trp<0&&trp!==-2){for(var ii=0;ii<cells.length;ii++){var cc=cells[ii];cc.radius+=(P.CELL_RADIUS-cc.radius)*Math.min(1,0.004*cc.mutationRate);}}}return open},st:function(v){if(v){cells=v.cells;trans=v.trans;ev=v.ev}return {cells:cells,ev:ev}}};`;
const bin=process.argv[2];
async function inst(WC,thr){let n=0;const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;n++;if(thr&&n>thr)throw new Error('fault');return Math.random()}}})).instance.exports;Object.assign(WC,{e:E,mem:E.memory,jsrnd:true,ok:true,off:false,simOff:false})}
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
(async()=>{const P={CELL_RADIUS:30},t0=1000,dur=2000,now=2500,dt=16;const W0=world(0,now-t0);let u=0;
 const WC0={};await inst(WC0,0);const A0=mk(WC0,P,false);A0.st({cells:clone(W0),trans:{t0,dur},ev:{death:0}});const full=w(5,()=>A0.run(now,dt,true));
 let cases=0,bad=0,next=0;for(let k=1;k<full.n;k++){const WC={};await inst(WC,k);const B=mk(WC,P,false);const S={cells:clone(W0),trans:{t0,dur,open:7},ev:{death:0}};B.st(S);const before=JSON.stringify(S.cells);const r=w(5,()=>B.run(now,dt,true));cases++;
  const ok=WC.trRunDeg===1&&WC.trRunOff===true&&WC.rndN===k+1&&r.n===k&&JSON.stringify(B.st().cells)===before&&B.st().ev.death===0&&r.v===7;if(!ok){bad++;if(bad<3)console.log('BAD',k,WC.trRunDeg,WC.trRunOff,WC.rndN,r.n,r.v)}
  const fw=WC.fwTr||0;w(9,()=>B.run(now,dt,true));if((WC.fwTr||0)!==fw)next++;}
 console.log(JSON.stringify({cases,bad,drawsPerFullPass:full.n,kernelRunAfterFault:next}));process.exit(bad+next?1:0)})();
