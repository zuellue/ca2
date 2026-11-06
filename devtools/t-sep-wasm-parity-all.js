// Node parity test: wasm sep_run vs the JS reference solver step (ca2.js separatorCollectivePass sample()),
// for BOTH wasm builds in BOTH trees (root = production, test = served /test). Run from repo root: node devtools/t-sep-wasm-parity-all.js
// Edge cases beyond t-sep-sampler-parity.js: no sources, no centres, point exactly on a source, stale MOVES reuse across runs, cutoff boundary.
const fs=require('fs');
function refT(src,pts,cs,th,th96){const nc=cs.length/3,mv=Array(nc*3).fill(0),parts=Array(nc);for(let k=0;k<nc;k++)mv[k*3+2]=1;let hit=0;
 for(let p=0;p<pts.length/4;p++){parts.fill(0);const[x,y,nx,ny]=pts.slice(p*4,p*4+4);let total=0;
  for(let q=0;q<src.length/5;q++){const z=q*5,dx=x-src[z],dy=y-src[z+1];if(Math.abs(dx)>src[z+3]||Math.abs(dy)>src[z+3])continue;const f=src[z+2]/(dx*dx+dy*dy+.0001);parts[src[z+4]]+=f;total+=f}
  if(total<=th)continue;hit++;
  for(let k=0;k<nc;k++){if(parts[k]<=th96)continue;const o=parts[k]/th;if(o>mv[k*3+2])mv[k*3+2]=o;const z=k*3,dx=cs[z]-x,dy=cs[z+1]-y;let mx,my;
   if(nx||ny){const s=dx*nx+dy*ny>=0?1:-1;mx=nx*s;my=ny*s}else{const d=Math.max(.0001,Math.hypot(dx,dy));mx=dx/d;my=dy/d}
   const step=Math.min(cs[z+2]+2,Math.max(1,cs[z+2]*(Math.sqrt(parts[k]/th)-1)));mv[k*3]+=mx*step;mv[k*3+1]+=my*step}}
 return{hit,mv}}
function ref(src,pts,cs,th){const nc=cs.length/3,mv=Array(nc*2).fill(0),parts=Array(nc);let hit=0;
 for(let p=0;p<pts.length/4;p++){parts.fill(0);const[x,y,nx,ny]=pts.slice(p*4,p*4+4);let total=0;
  for(let q=0;q<src.length/5;q++){const z=q*5,dx=x-src[z],dy=y-src[z+1];if(Math.abs(dx)>src[z+3]||Math.abs(dy)>src[z+3])continue;const f=src[z+2]/(dx*dx+dy*dy+.0001);parts[src[z+4]]+=f;total+=f}
  if(total<=th)continue;hit++;
  for(let k=0;k<nc;k++){if(parts[k]<=th*.002)continue;const z=k*3,dx=cs[z]-x,dy=cs[z+1]-y;let mx,my;
   if(nx||ny){const s=dx*nx+dy*ny>=0?1:-1;mx=nx*s;my=ny*s}else{const d=Math.max(.0001,Math.hypot(dx,dy));mx=dx/d;my=dy/d}
   const step=Math.min(cs[z+2]+2,Math.max(1,cs[z+2]*(Math.sqrt(total/th)-1)));
   if(Math.abs(mx*step)>Math.abs(mv[k*2]))mv[k*2]=mx*step;if(Math.abs(my*step)>Math.abs(mv[k*2+1]))mv[k*2+1]=my*step}}
 return{hit,mv}}
function run(e,src,pts,cs,th,th96){const W=th96!==undefined;const nc=cs.length/3,ns=src.length/5,np=pts.length/4;
 const sp=e.sep_alloc(0,src.length),pp=e.sep_alloc(1,pts.length),cp=e.sep_alloc(2,cs.length);
 new Float64Array(e.memory.buffer,sp,src.length).set(src);new Float64Array(e.memory.buffer,pp,pts.length).set(pts);new Float64Array(e.memory.buffer,cp,cs.length).set(cs);
 const hit=W?e.sep_run(ns,np,nc,th,th96):e.sep_run(ns,np,nc,th);return{hit,mv:Array.from(new Float64Array(e.memory.buffer,e.sep_moves(),nc*(W?3:2)))}}
let seed=12345;const R=()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296,rand=()=>R()*200-100;
function gen(nc,ns,np){const src=[],pts=[],cs=[];for(let k=0;k<nc;k++)cs.push(rand(),rand(),R()*20+1);
 for(let k=0;k<ns;k++)src.push(rand(),rand(),R()*10,60,k%nc);
 for(let p=0;p<np;p++){const a=R()*6.28;pts.push(rand(),rand(),p%3?Math.cos(a):0,p%3?Math.sin(a):0)}return{src,pts,cs}}
(async()=>{let fails=0,checks=0;const th=.19*.9,th96=.19*.96; // test/ ca2.js: sep_run(ns,np,nc,thr,thr96), 3 floats per cell (mx,my,over), contact gate parts>thr96, accumulated moves
 // root ca2.js: sep_run(ns,np,nc,thr), 2 floats per cell, per-axis max, share gate parts>thr*.002;
 for(const dir of ['.','test'])for(const f of ['ca2core.wasm','ca2core-simd.wasm']){
  const e=(await WebAssembly.instantiate(fs.readFileSync(dir+'/'+f))).instance.exports,tag=dir+'/'+f;let max=0,hits=0;
  const check=(name,src,pts,cs)=>{checks++;const T=dir==='test',a=run(e,src,pts,cs,th,T?th96:undefined),b=T?refT(src,pts,cs,th,th96):ref(src,pts,cs,th);let d=0;for(let i=0;i<b.mv.length;i++)d=Math.max(d,Math.abs(a.mv[i]-b.mv[i]));
   if(a.hit!==b.hit||d>1e-10||a.mv.some(v=>!isFinite(v))){fails++;console.log('FAIL',tag,name,{wasmHit:a.hit,refHit:b.hit,maxDiff:d})}max=Math.max(max,d);hits+=b.hit};
  for(let t=0;t<100;t++){const g=gen(12,36,100);check('rand'+t,g.src,g.pts,g.cs)}
  for(const[n,nc,ns,np]of[['dense',60,240,400]]){const g=gen(nc,ns,np);check(n,g.src,g.pts,g.cs)}
  check('no-sources',[],[0,0,1,0],[0,0,5]);
  check('no-points',[0,0,5,60,0],[],[0,0,5]);
  check('point-on-source',[10,10,5,60,0],[10,10,0,0],[0,0,5]);
  check('cutoff-edge',[0,0,5,60,0],[60,0,1,0,60,60.0001,0,1],[0,0,5]);
  // stale-moves: a hit run followed by a no-hit run must return zero moves
  check('hit-run',[0,0,50,60,0],[1,0,1,0],[0,0,5]);check('then-clean',[0,0,0.0001,60,0],[50,50,1,0],[0,0,5]);
  console.log(tag,{maxMoveDiff:max,hits})}
 console.log(fails?'FAILED '+fails+'/'+checks:'PASS '+checks+' checks');process.exit(fails?1:0)})();
