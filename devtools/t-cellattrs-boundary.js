// t-cellattrs-boundary: REAL compCellAttrsJs / compCellAttrs source extracted from ca2.js, jsrnd wasm vs the JS-only loop on identical cells/params and seeded Math.random.
// Compares pace, dl, durK, bend, cl, dst, dying, sym, energy (refreshResetEnergy on/off) for every cell (Object.is) and draw counts; cells include prior values to prove the reset assignments.
// Fault: throw at draw k -> degraded (documented, NOT parity): caDeg==1, postOff, k+1 import calls, fully drawn cells equal the reference prefix, later cells neutral (1,0,1,0).
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const bin=process.argv[2]||'wasm/target-jsrnd/wasm32-unknown-unknown/release/ca2core.wasm';
const body=`${fn('compCellAttrsJs')}\n${fn('compCellAttrs')}\nvar rnd=function(a,b){if(b===undefined){b=a;a=0}return a+Math.random()*(b-a)};return {js:compCellAttrsJs,w:compCellAttrs};`;
async function inst(thr,WC){let n=0;const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;n++;if(thr&&n>thr)throw new Error('fault');return Math.random()}}})).instance.exports;WC.e=E;WC.mem=E.memory;WC.jsrnd=true;return E}
function api(WC,P,cells,trans){return new Function('WC','P','cells','trans','postOffW',body)(WC,P,cells,trans,()=>!!WC.postOff)}
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
(async()=>{const WC0={};await inst(0,WC0);
let s=29;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};let tot=0,bad=0,drawBad=0,bend0=0,cellsTot=0;
for(let t=0;t<20000;t++){WC0.postOff=false;const m=Math.floor(r0()*100),P={refreshResetEnergy:t%2},trans={dur:100+r0()*4000};
 const mkc=()=>{s=t*11+1;const a=[];for(let i=0;i<m;i++)a.push({energy:r0()*20,cl:3,dst:[1,2],dying:true,pace:9,dl:9,durK:9,bend:9,sym:{}});return a};
 const c1=mkc(),c2=mkc();const A1=api(WC0,P,c1,trans),A2=api(WC0,P,c2,trans);
 const a=w(t*3+4,()=>A1.js()),b=w(t*3+4,()=>A2.w());
 tot++;cellsTot+=m;bend0+=c1.filter(c=>c.bend===0).length;let ok=a.n===b.n;if(!ok)drawBad++;
 for(let i=0;i<m&&ok;i++)for(const k of ['energy','cl','dying','pace','dl','durK','bend'])if(!Object.is(c1[i][k],c2[i][k])){ok=false;break}
 for(let i=0;i<m&&ok;i++)if(c1[i].dst!==c2[i].dst||c1[i].sym!==c2[i].sym)ok=false;
 if(!ok){bad++;if(bad<4)console.log('MISMATCH',t,m,a.n,b.n)}}
// fault: one cell uses 4 or 5 draws; derive the reference prefix from a seeded run
let fT=0,fB=0;for(let k=1;k<=60;k++){const WC={},Ef=await inst(k,WC);const m=20,P={refreshResetEnergy:1},trans={dur:1000};
 const mkc=()=>{const a=[];for(let i=0;i<m;i++)a.push({energy:0,cl:3,dst:[1],dying:true,pace:9,dl:9,durK:9,bend:9,sym:{}});return a};
 const cf=mkc(),cr=mkc();const Af=api(WC,P,cf,trans),Ar=api({},P,cr,trans);
 w(6,()=>Af.w());w(6,()=>Ar.js());fT++;
 // count fully drawn cells in the reference using the same seeded stream
 let st=6,draws=[];{let d=0,cnt=0;const rs=()=>{st=(st*1664525+1013904223)>>>0;return st/4294967296};let used=0;for(let i=0;i<m;i++){const need=(()=>{let u=4;/*bend test*/return u})();rs();rs();rs();const bt=rs();let extra=0;if(!(bt<0.25)){rs();extra=1}used+=4+extra;draws.push(used)}}
 const fully=draws.filter(u=>u<=k).length;
 let okd=WC.caDeg===1&&WC.postOff===true&&WC.rndN===k+1;
 for(let i=0;i<m&&okd;i++){const c=cf[i];if(i<fully){for(const q of ['pace','dl','durK','bend'])if(!Object.is(c[q],cr[i][q]))okd=false}else{if(!(c.pace===1&&c.dl===0&&c.durK===1&&c.bend===0))okd=false}if(c.cl!==0||c.dst!==null||c.dying!==false||c.sym!==null||c.energy!==12)okd=false}
 if(!okd)fB++}
console.log(JSON.stringify({scenarios:tot,cells:cellsTot,bendZero:bend0,mismatch:bad,drawCountMismatch:drawBad,faultCases:fT,faultBad:fB,binary:bin}));process.exit(bad||fB?1:0)})();
