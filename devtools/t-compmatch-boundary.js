// t-compmatch-boundary: REAL compMatchJs / compMatchW source extracted from ca2.js, jsrnd wasm vs the JS-only compMatchJs on identical cells/points and identical seeded Math.random.
// Compares per-cell dst (identity into pts), dying flag, the remaining free list (identity + order) and draw counts. Covers userAdded/spawnProtect, more cells than points (overflow draws), fewer cells than points, equal distances (tie rule), 1 point.
// Fault: throw at overflow draw k -> degraded (documented, NOT parity): WC.cmDeg==1, postOff set, cells past the last completed draw get pts[0].
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const bin=process.argv[2]||'wasm/target-jsrnd/wasm32-unknown-unknown/release/ca2core.wasm';
const body=`${fn('compMatchJs')}\n${fn('compMatchW')}\nreturn {js:compMatchJs,w:compMatchW};`;
async function inst(thr,WC){let n=0;const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;n++;if(thr&&n>thr)throw new Error('fault');return Math.random()}}})).instance.exports;WC.e=E;WC.mem=E.memory;WC.jsrnd=true;return E}
function api(WC,P){return new Function('WC','P','postOffW',body)(WC,P,()=>!!WC.postOff)}
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
(async()=>{
let s=21;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
let tot=0,bad=0,drawBad=0,over=0;
for(let t=0;t<20000;t++){const WC={};await (async()=>{})();if(t==0){global.E0=await inst(0,WC);global.WC0=WC}
 const WCx=global.WC0;WCx.postOff=false;const P={spawnProtect:t%3?1:0};const A=api(WCx,P);
 const m=Math.floor(r0()*80),np=1+Math.floor(r0()*(t%4==0?5:100)),tie=t%6==0;
 const mkCells=()=>{const r=[];s=t*7+1;for(let i=0;i<m;i++){const x=tie?10:r0()*800,y=tie?10:r0()*500;r.push({x,y,userAdded:r0()<0.3})}return r};
 s=t*13+5;const ptsBase=[];for(let i=0;i<np;i++)ptsBase.push([tie&&i%2?30:r0()*800,tie&&i%2?30:r0()*500]);
 const c1=mkCells(),c2=mkCells(),p1=ptsBase.map(x=>x.slice()),p2=ptsBase.map(x=>x.slice());
 const a=w(t*3+9,()=>A.js(c1,p1,p1.slice())),b=w(t*3+9,()=>A.w(c2,p2,p2.slice()));
 tot++;if(m>np)over++;let ok=a.n===b.n;if(!ok)drawBad++;
 const idx=(arr,pts)=>arr.map(c=>pts.indexOf(c.dst));
 if(JSON.stringify(idx(c1,p1))!==JSON.stringify(idx(c2,p2)))ok=false;
 if(JSON.stringify(c1.map(c=>!!c.dying))!==JSON.stringify(c2.map(c=>!!c.dying)))ok=false;
 if(JSON.stringify(a.v.map(q=>p1.indexOf(q)))!==JSON.stringify(b.v.map(q=>p2.indexOf(q))))ok=false;
 if(!ok){bad++;if(bad<4)console.log('MISMATCH',t,m,np,a.n,b.n)}}
let fT=0,fB=0;for(let k=1;k<=29;k++){const WC={},Ef=await inst(k,WC);const P={spawnProtect:1};const A=api(WC,P);const m=40,np=10;const cells=[];for(let i=0;i<m;i++)cells.push({x:i*10,y:5,userAdded:false});const pts=[];for(let i=0;i<np;i++)pts.push([i*40,5]);
 const out=w(2,()=>A.w(cells,pts,pts.slice()));fT++;const good=Math.min(m,np+k);// k completed draws before the throwing one (k+1 th call throws): cells np..np+k-1 drawn
 const okd=WC.cmDeg===1&&WC.postOff===true&&WC.rndN===k+1&&out.v.length===0&&cells.every((c,i)=>i<np+k?pts.indexOf(c.dst)>=0:c.dst===pts[0])&&cells.every((c,i)=>(i>=np)===!!c.dying);if(!okd)fB++;}
console.log(JSON.stringify({scenarios:tot,overflowScenarios:over,mismatch:bad,drawCountMismatch:drawBad,faultCases:fT,faultBad:fB,binary:bin}));process.exit(bad||fB?1:0)})();
