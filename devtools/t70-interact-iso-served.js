// SERVED-TEST variant of t70-interact-iso.js: defaults CA_JS=test/ca2.js WASM=test/ca2core.wasm; reads the cell stride from the wasm (sim_stride, 30 on the served build; the original hardcoded 24, which misaligned every cell and made "wasm death" a constant 30).
// frozen-input isolation: JS interact loop vs wasm sim_step (interact-only, p[56]=1) on identical cell sets.
// BIRTH=1 (CA-3, extended CA-13): full-step parity (p[56]=0) so the contact-birth (reproduce) and radius-gate divide paths run on both engines; the JS side runs the real extracted update/checkSurvival/interact/keepIn loop (same shape as t74) and birth+divide counters must be nonzero and match within 3%. CA-13: the JS loop defers death removal to a post-pass and counts clusters over alive+absorbed, 1:1 sim.rs step()/count_slots (a mid-pass splice was the eaten/death drift). merge/fuse/pair carry a 15% band: same-pass outcome coupling + ULP-level borderline contacts set a noise floor there (measured: sign-flipping 4-25% at 400x2, stable PASS at 800 trials x 4 states). Standard run: `BIRTH=1 node devtools/t70-interact-iso-served.js 800 40 160 4`; JS-side mutation (interact fuse gate x2) must FAIL. Round shapes only: the string swim is a JS post-pass outside sim.rs.
// BOUND=1 (CA-11): keepIn-only parity (p[56]=2): cells fired at/outside the walls (1/3 grown past CELL_RADIUS to cover the radius-wear path); JS keepIn vs wasm keep_in, per-cell readback of x,y,vx,vy,radius,sqS(press),crowd,envVx,envVy must match (tol 1% of box, stricter than the 3% contract); pressed-cell coverage must be nonzero.
// Note: the params view must be 97 wide like the live pack; an 80-wide view silently drops p[80-96] (wall-carry/squash/sensing/crowd), and the pack must write cell slots 24-27 (sq/crowd/envV) every step or wasm state leaks across trials - either bug fakes a keep_in skew. The branch-local wasm/src/sim.rs tree is STALE (pre-item-64); the served binary's byte-verified source is commit 51dce62.
// usage: node devtools/t70-interact-iso-served.js [trials] [ncells] [box]
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..',process.env.CA_JS||'test/ca2.js'),'utf8');
if(process.env.CA2TRIG)globalThis.CA2_TRIG_MSUN=1; // CA-34: enable the ca2.js msunTrig port (bit-exact served parity in rand2D)
function fn(name){const i=src.indexOf('function '+name+'(');if(i<0)throw name;let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
function vr(name){const i=src.indexOf('var '+name+' = ');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1)+';';}
const FULL=!!process.env.BIRTH||!!process.env.FULLST,BOUND=!!process.env.BOUND,FULLST=!!process.env.FULLST; // FULLST (CA-15): full-step multi-step state-channel parity (sq/sqS/crowd/envV distributions over live cells) on wall-fired constant-population states; the wasm side runs the app wasm-mode frame (pack -> step -> readback with sqS=max -> sweep -> stepSquash post-pass). Standard run: FULLST=1 STEPS=10; mutation: JS keepIn press x0.5 must FAIL. RESOLVED (devtools/evidence/trace2-framet-artifact-20261107.md): the STEPS=30 crowdPush/envV '2x drift' was a harness artifact - frameT was frozen, so the JS __ccT/__ccU pair-separation budget never reset (ca2.js:492) while the wasm used[] budget resets per step. The frame template now advances frameT per frame (1:1 app), resets it per trial, and packs cell slot 23 = age ms (1:1 ca2.js:1012). FULLST10/30 PASS vs the served binary; TRACE2 aligned-RNG per-cell diff is exact to the f64 noise floor over 30 steps.
const names=['rand2D','normCol','speedOf','mutGenome','mixGenome','newShape','mixShape','mutateGene','Cell','effR','birthCapF','clusterSize','joinCluster','fuseCells','interact','reproduce'].concat(FULL||BOUND?['checkSurvival','limit','misfit','update','organic','keepIn','divide','wallPull','carrySide','stepSquash']:['keepIn','wallPull','carrySide','stepSquash','effR','limit']); // default mode also references stepSquash in the return
const code=`var frameT=0,frameDtf=16.7,UI_END=800,CELL_END=1300
var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var clamp=function(v,a,b){return v<a?a:v>b?b:v;};var lerp=function(a,b,t){return a+(b-a)*t;};var map=function(v,a,b,c,d){return c+(d-c)*(v-a)/(b-a);};
${vr('P')}
var cells=[],food=[],ev={birth:0,death:0,hit:0,oob:0},clusterSeq=0,cmean={},cont={x:0,y:0,w:0,h:0,wvx0:0,wvx1:0,wvy0:0,wvy1:0},mouse={x:-1e9,y:-1e9,over:false},resizeDrag=false,env={spd:1,app:0.5,bnd:1,col:null};
function habAte(){}function habReap(){}
${names.map(fn).join('\n')}
return {P:P,Cell:Cell,cont:cont,get cells(){return cells;},set cells(v){cells=v;},get food(){return food;},set food(v){food=v;},ev:ev,get seq(){return clusterSeq;},set seq(v){clusterSeq=v;},stepSquash:stepSquash,get frameT(){return frameT;},set frameT(v){frameT=v;},
 frame:function(){frameT+=frameDtf;for(var i=cells.length-1;i>=0;i--){var c=cells[i];${process.env.DRAWLOG?'globalThis.__CM.push([i,globalThis.DRAWS.length]);':''}if(${FULL}){update(c);checkSurvival(c);}if(!${BOUND}){for(var k=i-1;k>=0;k--)interact(c,cells[k]);}if((${FULL}||${BOUND})&&P.boundAware&&c.alive){var ev0x=c.envVx,ev0y=c.envVy;keepIn(c);var dInx=Math.abs(c.envVx-ev0x),dIny=Math.abs(c.envVy-ev0y);if(dInx>1e-12){globalThis.__DJ.nx++;globalThis.__DJ.sx+=dInx;}if(dIny>1e-12){globalThis.__DJ.ny++;globalThis.__DJ.sy+=dIny;}}if(${FULL}&&c.alive)limit(c,c.maxSpeed*c.speedModifier);if(!c.alive)ev.death++;}for(var i2=cells.length-1;i2>=0;i2--)if(!cells[i2].alive)cells.splice(i2,1);}};`; // 1:1 sim.rs step() + the CA-13 JS loop: deaths counted in-pass, removal deferred to a post-pass (a mid-pass splice was the eaten/death drift); f10 limit() closes the step like the app (mouse far away, resizeDrag off -> factors 1)

// CA-30: bit-exact JS port of rust-lang/libm pow (FreeBSD e_pow.c) - the served wasm32
// binary's f64::powf. JS Math.pow differs by 1 ulp on some inputs; this port matches the
// Rust algorithm exactly (all arithmetic f64, bit ops via typed-array views).
const _pwBuf=new ArrayBuffer(8),_pwF=new Float64Array(_pwBuf),_pwU=new Uint32Array(_pwBuf);
function _hi(v){_pwF[0]=v;return _pwU[1]|0;}
function _lo(v){_pwF[0]=v;return _pwU[0]>>>0;}
function _setLo(v,w){_pwF[0]=v;_pwU[0]=w>>>0;return _pwF[0];}
function _setHi(v,w){_pwF[0]=v;_pwU[1]=w>>>0;return _pwF[0];}
function rustScalbn(x,n){ // fdlibm s_scalbn.c 1:1
 const TWO54=1.80143985094819840000e+16,TWOM54=5.55111512312578270212e-17,HUGE=1.0e300,TINY=1.0e-300;
 let hx=_hi(x),lx=_lo(x);let k=(hx&0x7ff00000)>>20;
 if(k===0){if(((lx|(hx&0xfffff))>>>0)===0)return x;x*=TWO54;hx=_hi(x);k=((hx&0x7ff00000)>>20)-54;if(n<-50000)return TINY*x;}
 if(k===0x7ff)return x+x;
 k=k+n|0;
 const cs=v=>hx<0?-v:v;
 if(k>0x7fe)return HUGE*cs(HUGE);
 if(k>0)return _setHi(x,((hx&0x800fffff)|(k<<20))>>>0);
 if(k<=-54)return n>50000?HUGE*cs(HUGE):TINY*cs(TINY);
 k=k+54|0;return _setHi(x,((hx&0x800fffff)|(k<<20))>>>0)*TWOM54;}
function rustPow(x,y){ // rust-lang/libm src/math/pow.rs 1:1
 const BP=[1.0,1.5],DP_H=[0.0,5.84962487220764160156e-01],DP_L=[0.0,1.35003920212974897128e-08];
 const TWO53=9007199254740992.0,HUGE=1.0e300,TINY=1.0e-300;
 const L1=5.99999999999994648725e-01,L2=4.28571428578550184252e-01,L3=3.33333329818377432918e-01,L4=2.72728123808534006489e-01,L5=2.30660745775561754067e-01,L6=2.06975017800338417784e-01;
 const P1=1.66666666666666019037e-01,P2=-2.77777777770155933842e-03,P3=6.61375632143793436117e-05,P4=-1.65339022054652515390e-06,P5=4.13813679705723846039e-08;
 const LG2=6.93147180559945286227e-01,LG2_H=6.93147182464599609375e-01,LG2_L=-1.90465429995776804525e-09,OVT=8.0085662595372944372e-017;
 const CP=9.61796693925975554329e-01,CP_H=9.61796700954437255859e-01,CP_L=-7.02846165095275826516e-09;
 const IVLN2=1.44269504088896338700e+00,IVLN2_H=1.44269502162933349609e+00,IVLN2_L=1.92596299112661746887e-08;
 let t1,t2;
 const hx=_hi(x),lx=_lo(x),hy=_hi(y),ly=_lo(y);
 let ix=hx&0x7fffffff;const iy=hy&0x7fffffff;
 if(((iy>>>0)|ly)===0)return 1.0;
 if(hx===0x3ff00000&&lx===0)return 1.0;
 if(ix>0x7ff00000||(ix===0x7ff00000&&lx!==0)||iy>0x7ff00000||(iy===0x7ff00000&&ly!==0))return x+y;
 let yisint=0,k,j;
 if(hx<0){
  if(iy>=0x43400000)yisint=2;
  else if(iy>=0x3ff00000){k=(iy>>20)-0x3ff;
   if(k>20){j=(ly>>>(52-k))|0;if(((j<<(52-k))|0)===(ly|0))yisint=2-(j&1);}
   else if(ly===0){j=iy>>(20-k);if(((j<<(20-k))|0)===iy)yisint=2-(j&1);}}}
 if(ly===0){
  if(iy===0x7ff00000){
   if(((ix-0x3ff00000)|(lx|0))===0)return 1.0;
   else if(ix>=0x3ff00000)return hy>=0?y:0.0;
   else return hy>=0?0.0:-y;}
  if(iy===0x3ff00000)return hy>=0?x:1.0/x;
  if(hy===0x40000000)return x*x;
  if(hy===0x3fe00000&&hx>=0)return Math.sqrt(x);}
 let ax=Math.abs(x);
 if(lx===0&&(ix===0x7ff00000||ix===0||ix===0x3ff00000)){
  let z=ax;if(hy<0)z=1.0/z;
  if(hx<0){if(((ix-0x3ff00000)|yisint)===0)z=(z-z)/(z-z);else if(yisint===1)z=-z;}
  return z;}
 let s=1.0;
 if(hx<0){if(yisint===0)return (x-x)/(x-x);if(yisint===1)s=-1.0;}
 if(iy>0x41e00000){
  if(iy>0x43f00000){
   if(ix<=0x3fefffff)return hy<0?HUGE*HUGE:TINY*TINY;
   if(ix>=0x3ff00000)return hy>0?HUGE*HUGE:TINY*TINY;}
  if(ix<0x3fefffff)return hy<0?s*HUGE*HUGE:s*TINY*TINY;
  if(ix>0x3ff00000)return hy>0?s*HUGE*HUGE:s*TINY*TINY;
  const t=ax-1.0,w=(t*t)*(0.5-t*(0.3333333333333333333333-t*0.25));
  const u=IVLN2_H*t,v=t*IVLN2_L-w*IVLN2;
  t1=_setLo(u+v,0);t2=v-(t1-u);
 }else{
  let n=0;
  if(ix<0x00100000){ax*=TWO53;n-=53;ix=_hi(ax);}
  n+=((ix>>20)-0x3ff);j=ix&0x000fffff;
  let kk;
  ix=(j|0x3ff00000)|0;
  if(j<=0x3988E)kk=0;
  else if(j<0xBB67A)kk=1;
  else{kk=0;n+=1;ix=(ix-0x00100000)|0;}
  ax=_setHi(ax,ix>>>0);
  const u=ax-BP[kk],v=1.0/(ax+BP[kk]);
  const ss=u*v,s_h=_setLo(ss,0);
  const t_h=_setHi(0.0,((((ix>>>0)>>1)|0x20000000)+0x00080000+((kk<<18)>>>0))>>>0);
  const t_l=ax-(t_h-BP[kk]);
  const s_l=v*((u-s_h*t_h)-s_h*t_l);
  const s2a=ss*ss;
  let r=s2a*s2a*(L1+s2a*(L2+s2a*(L3+s2a*(L4+s2a*(L5+s2a*L6)))));
  r+=s_l*(s_h+ss);
  const s2=s_h*s_h;
  const t_h2=_setLo(3.0+s2+r,0);
  const t_l2=r-((t_h2-3.0)-s2);
  const u2=s_h*t_h2,v2=s_l*t_h2+t_l2*ss;
  const p_h=_setLo(u2+v2,0),p_l=v2-(p_h-u2);
  const z_h=CP_H*p_h,z_l=CP_L*p_h+p_l*CP+DP_L[kk];
  const t=n*1.0;
  t1=_setLo(((z_h+z_l)+DP_H[kk])+t,0);
  t2=z_l-(((t1-t)-DP_H[kk])-z_h);}
 const y1=_setLo(y,0);
 const p_l=(y-y1)*t1+y*t2;
 let p_h=y1*t1;
 let z=p_l+p_h;
 j=_hi(z);const ii=_lo(z)|0;
 if(j>=0x40900000){
  if((((j-0x40900000)|0)|ii)!==0)return s*HUGE*HUGE;
  if(p_l+OVT>z-p_h)return s*HUGE*HUGE;
 }else if((j&0x7fffffff)>=0x4090cc00){
  if((((j>>>0)-0xc090cc00)|(ii>>>0))!==0)return s*TINY*TINY;
  if(p_l<=z-p_h)return s*TINY*TINY;}
 const iu=j&0x7fffffff;
 k=(iu>>20)-0x3ff;let n=0;
 if(iu>0x3fe00000){
  n=(j+(0x00100000>>(k+1)))|0;
  k=(((n&0x7fffffff)>>20)-0x3ff)|0;
  const t=_setHi(0.0,(n&~((0x000fffff>>k)>>>0))>>>0);
  n=(((n&0x000fffff)|0x00100000)>>(20-k))|0;
  if(j<0)n=-n;
  p_h-=t;}
 const t=_setLo(p_l+p_h,0);
 const u=t*LG2_H,v=(p_l-(t-p_h))*LG2+t*LG2_L;
 z=u+v;
 const w=v-(z-u);
 const tt=z*z;
 const t1b=z-tt*(P1+tt*(P2+tt*(P3+tt*(P4+tt*P5))));
 const r=(z*t1b)/(t1b-2.0)-(w+z*w);
 z=1.0-(r-z);
 j=(_hi(z)+(n<<20))|0;
 if((j>>20)<=0)z=rustScalbn(z,n);
 else z=_setHi(z,j>>>0);
 return s*z;}
if(process.env.POWRUST)Math.pow=rustPow; // CA-30 probe
if(process.env.HYSQRT)Math.hypot=(a,b)=>Math.sqrt(a*a+b*b); // CA-29 probe: Rust hyp() is (a*a+b*b).sqrt() (sim.rs:67), Math.hypot scales and rounds differently ~37% of draws
const J=new Function(code)();
// CA-40 FEED=<spacing>: deterministic food lattice refilled every step so fed aligned states
// survive past the ~200-step starvation horizon; lattice order fixed, refill identical on both
// engines, eating consumes aligned-stream draws symmetrically (JS iterates backward, wasm forward:
// same in-range set -> same roll count -> same per-cell energy/radius effect; food state is rebuilt
// each step so which dot was taken never persists).
const FEED=+process.env.FEED||0,FL=[];

const P=J.P;
if(process.env.EAT){P.eatMergeOn=1;P.symbiosisOn=1;P.symbiogenesisOn=1;P.divideOn=1;P.eatChance=1;P.mergeChance=1;P.reproChance=1;P.clusterCohesion=1;P.eatDistF=0.85;P.fuseDistF=0.6;P.symDistF=1.1;}
if(FULL||BOUND){if(P.wallCarry===undefined)P.wallCarry=1;if(P.wallSpread===undefined)P.wallSpread=0.5;if(P.squashMax===undefined)P.squashMax=0.18;if(P.squashIn===undefined)P.squashIn=0.45;if(P.squashOut===undefined)P.squashOut=0.08;if(P.senseR===undefined)P.senseR=1.6;if(P.senseSlow===undefined)P.senseSlow=0.25;if(P.senseTurn===undefined)P.senseTurn=0.12;if(P.senseDelay===undefined)P.senseDelay=0.5;if(P.crowdGain===undefined)P.crowdGain=0.12;if(P.crowdRel===undefined)P.crowdRel=0.02;if(P.crowdSlow===undefined)P.crowdSlow=0.5;if(P.crowdPush===undefined)P.crowdPush=0.3;}
if(FULL){P.reproChance=Math.max(P.reproChance||0,0.5);P.reproMinAgeMs=0;P.divideOn=1;P.divideAt=1.5;P.orgLifeDie=-0.005;P.orgLifeGrow=1.0025;P.orgBirth=1.005;P.orgDead=-0.0025;P.orgBrain=0.008;P.orgR90=0.0025;P.symEnergy=0.00075;P.symBreak=0.0002;P.symBreakDist=3;if(P.eatDistF===undefined)P.eatDistF=0.85;if(P.fuseDistF===undefined)P.fuseDistF=0.6;if(P.symDistF===undefined)P.symDistF=1.1;P.habitatOn=0;P.habitatBirthCap=2;}
if(FULLST){P.reproChance=0;P.divideOn=0;P.eatChance=0;P.mergeChance=0;P.habitatOn=0;} // constant population: channels comparable per-cell (index-stable), only the update() wander draws differ across engines
if(process.env.ZERO){process.env.ZERO.split(',').forEach(k=>{P[k]=0;});}
if(process.env.SET){process.env.SET.split(',').forEach(kv=>{const a=kv.split('=');P[a[0]]=+a[1];});} // symmetric override for bisection // symmetric gate: zero a P key on BOTH engines (JS reads J.P===P, wasm pack reads P) to bisect a drift to one subpath
const BORNTR=!!process.env.BORNTR||(FULLST&&!!P.divideOn); // CA-38c reconciliation: births MUST be read back whenever divides can fire (goreda's no-BORNTR divideOn=1 runs diverged at step 1 - the harness never saw wasm children; false divergence, not an engine mismatch)
const [trials,N,BOX]=[+process.argv[2]||3000,+process.argv[3]||75,+process.argv[4]||160];
if(FEED){for(let fy=FEED/2;fy<BOX;fy+=FEED)for(let fx=FEED/2;fx<BOX;fx+=FEED)FL.push({x:fx,y:fy});} // lattice lives past argv parsing (BOX)
J.cont.w=BOX;J.cont.h=BOX;
const wasm=fs.readFileSync(path.join(__dirname,'..',process.env.WASM||'test/ca2core.wasm'));
(async()=>{
const E=(await WebAssembly.instantiate(wasm,{})).instance.exports;const ST=E.sim_stride?E.sim_stride():24;
const PI=['interactionRadius','slowDownRadius','speedReductionFactor','baseMaxSpeed','maxSpeedVariation','energyConsumptionRate','selectOn','genomeOn','selStrength','eatMergeOn','clusterCohesion','symbiosisOn','foodEatR','foodEnergyValue','foodGrow','foodGrowAmt','CELL_RADIUS','foodGrowMax','divideOn','divideAt','UNIVERSE_SIZE','foodShrink','boundAware','boundZone','boundForce','restless','eatRatio','eatChance','mergeGene','mergeChance','symbiogenesisOn','energyGainFromInteraction','GENE_MIN','GENE_MAX','minEnergyForReproduction','clusterMax','genomeMut','mutationRateRange','metaballStrength'];
let SEQ=0;function mkState(){const cs=[];for(let i=0;i<N;i++){const c=new J.Cell(Math.random()*BOX,Math.random()*BOX,Math.round((Math.random()-0.5)*14),5);c.radius=P.CELL_RADIUS*(0.7+Math.random()*1.1);c.energy=3+Math.random()*12;if(FULL||BOUND){c.shp={t:0,asp:1,th:1,wig:0,wsp:1,sat:0,ph:0,ph2:0,dir:0};c.sq=0;c.crowd=0;c.envVx=0;c.envVy=0;c.sqS=0;}
  if(BOUND||FULLST){const side=Math.floor(Math.random()*4),rr=3+Math.random()*8;c.radius=rr;c.maxSpeed=2+Math.random()*6;const zz=70,dd=Math.random()*(zz+25)-10;
   if(side===0){c.x=dd;c.y=Math.random()*BOX}else if(side===1){c.x=BOX-dd;c.y=Math.random()*BOX}else if(side===2){c.y=dd;c.x=Math.random()*BOX}else{c.y=BOX-dd;c.x=Math.random()*BOX}
   const sp2=Math.random()*12,an=Math.random()*6.2832;c.vx=Math.cos(an)*sp2;c.vy=Math.sin(an)*sp2;if(i%3===0)c.radius=P.CELL_RADIUS*(1+Math.random()*1.5);}cs.push(c);}if(process.env.CL){let id=0;for(let i=0;i<N;){const sz=1+Math.floor(Math.random()*4);if(sz>1){id++;for(let k=0;k<sz&&i+k<N;k++)cs[i+k].cl=id;}i+=sz;}SEQ=id;}return cs;}
function clone(cs){return cs.map(c=>{const d=Object.create(Object.getPrototypeOf(c));Object.assign(d,c);d.g=JSON.parse(JSON.stringify(c.g));d.shp=JSON.parse(JSON.stringify(c.shp));d.sym=null;return d;});}
function pack(cs){const n=cs.length,cap=n+256;pack.cap=cap;const nf=FEED?FL.length:0;E.sim_cells(cap);E.sim_food(Math.max(2,nf+1));E.sim_cm(2);const cp=E.sim_cells(cap);const fxp=E.sim_food(Math.max(2,nf+1)),fyp=E.sim_food_y();const pp=E.sim_params();if(FEED){const buf0=E.memory.buffer,fx0=new Float64Array(buf0,fxp,nf+1),fy0=new Float64Array(buf0,fyp,nf+1);for(let fi=0;fi<nf;fi++){fx0[fi]=FL[fi].x;fy0[fi]=FL[fi].y;}}
 const buf=E.memory.buffer,cf=new Float64Array(buf,cp,cap*ST),p=new Float64Array(buf,pp,97); // 97 like the live pack: p[80-96] carry wall-carry/squash/sensing/crowd (an 80-wide view silently dropped them)
 cs.forEach((c,i)=>{const b=i*ST,g=c.g;cf.set([c.x,c.y,c.vx,c.vy,c.radius,c.energy,c.gene,1,c.maxSpeed,c.speedModifier,c.hostility,c.mutationRate,c.sv,c.cl||0,-1,g.spd,g.app,g.bnd,g.col[0],g.col[1],g.col[2],c.comp||0,0,J.frameT-(c.bornAt||0)],b);if(ST>=30)cf.set([c.sq||0,c.crowd||0,c.envVx||0,c.envVy||0,0,0],b+24);}); // slots 24-27 carry squash/crowd/envV state per frame (1:1 with the live pack); leaving them stale leaks state across trials
 E.sim_set_n(n);E.sim_set_nf(nf);E.sim_cm_count(0);pack.n=n;
 PI.forEach((k,i)=>{let v=P[k];p[i]=typeof v==='boolean'?(v?1:0):v;});p[39]=1;p[40]=0.5;p[41]=1;p[42]=0;p[46]=-1e9;p[47]=-1e9;p[48]=0;p[49]=0;p[50]=0;p[51]=1e9;p[52]=1e9;p[53]=0;p[54]=SEQ;p[56]=1;if(process.env.EAT){p[70]=P.eatDistF;p[71]=P.fuseDistF;p[72]=P.symDistF;}
 if(FULL||BOUND){p[80]=0;p[81]=0;p[82]=0;p[83]=0;p[84]=P.wallCarry;p[85]=P.wallSpread;p[86]=P.squashMax;p[87]=P.squashIn;p[88]=P.squashOut;p[89]=P.senseR;p[90]=P.senseSlow;p[91]=P.senseTurn;p[92]=P.senseDelay;p[93]=P.crowdGain;p[94]=P.crowdRel;p[95]=P.crowdSlow;p[96]=P.crowdPush;}
 if(BOUND){p[51]=BOX;p[52]=BOX;p[56]=2;p[78]=16.7;}
 if(FULL){p[51]=BOX;p[52]=BOX;p[56]=0;p[58]=P.reproMinAgeMs||0;p[59]=P.reproChance===undefined?0.02:P.reproChance;p[61]=P.orgLifeDie;p[62]=P.orgLifeGrow;p[63]=P.orgBirth;p[64]=P.orgDead;p[65]=P.orgBrain;p[66]=P.orgR90;p[67]=P.symEnergy;p[68]=P.symBreak;p[69]=P.symBreakDist;p[70]=P.eatDistF;p[71]=P.fuseDistF;p[72]=P.symDistF;p[73]=0;p[74]=P.habitatBirthCap;p[75]=P.divideMode?1:0;p[76]=P.divideAgeMs;p[77]=P.divideEnergy;p[78]=16.7;p[79]=P.foodEatRate===undefined?1.5:P.foodEatRate;}}
const K=['birth','divide','eaten','merge','fuse','pair','hit'];
const LOG={k1:0,k2:0,k3:0,bad:0,o0:0,o1:0,o4:0,steps:0};
const TR=!!process.env.TRACE,trJ=[],trW=[],DW={nx:0,sx:0,ny:0,sy:0};
const TR2=!!process.env.TRACE2; // aligned-RNG per-cell trace: identical xorshift128+ streams on both engines, per-step snapshot diff
function makeRng(s0,s1){const M=0xFFFFFFFFFFFFFFFFn;let X=((BigInt(s0)<<32n)|0x9E3779B9n)&M,Y=((BigInt(s1)<<32n)|0x85EBCA6Bn)&M;return function(){let x=X;const y=Y;X=y;x^=(x<<23n)&M;Y=(x^y^(x>>17n)^(y>>26n))&M;return Number(((Y+y)&M)>>11n)/9007199254740992;};}
const snap=c=>({x:c.x,y:c.y,vx:c.vx,vy:c.vy,ex:c.envVx||0,ey:c.envVy||0,cr:c.crowd||0,sq:c.sq||0,r:c.radius,en:c.energy,g:c.gene,age:J.frameT-(c.bornAt||0),spd:c.g.spd,app:c.g.app,bnd:c.g.bnd,ms:c.maxSpeed,sm:c.speedModifier,hst:c.hostility||0,sv:c.sv||0,mr:c.mutationRate||0,c0:(c.g.col&&c.g.col[0])||0,c1:(c.g.col&&c.g.col[1])||0,c2:(c.g.col&&c.g.col[2])||0});globalThis.__DJ={nx:0,sx:0,ny:0,sy:0};const DJ=globalThis.__DJ;function meanEnv(cs){let s=0,n=0;for(const c of cs){if(!c.alive)continue;s+=Math.abs(c.envVx||0)+Math.abs(c.envVy||0);n++;}return n?s/n:0;}function meanKey(cs,k){let s=0,n=0;for(const c of cs){if(!c.alive)continue;s+=c[k]||0;n++;}return n?s/n:0;}function liveN(cs){let n=0;for(const c of cs)if(c.alive)n++;return n;} // snap: birth-carried channels incl. mutGenome col draws (6 gene draws at divide: spd/app/bnd + col x3); cl/comp excluded: no contacts at interactionRadius=0 (merge/fuse counters in TR2CH prove inert)globalThis.__DJ={nx:0,sx:0,ny:0,sy:0};const DJ=globalThis.__DJ;function meanEnv(cs){let s=0,n=0;for(const c of cs){if(!c.alive)continue;s+=Math.abs(c.envVx||0)+Math.abs(c.envVy||0);n++;}return n?s/n:0;}function meanKey(cs,k){let s=0,n=0;for(const c of cs){if(!c.alive)continue;s+=c[k]||0;n++;}return n?s/n:0;}function liveN(cs){let n=0;for(const c of cs)if(c.alive)n++;return n;}
// CA-33: modern FreeBSD-msun cos/sin bit-exact port (r = z*(C1+z*(C2+z*C3)) + w*w*(C4+z*(C5+z*C6)), no-qx kcos,
// direct 1..4 x pio2_1 splits) - the served binary's trig family (40/40 uniquely-attributed CA-32 cells).
// COSMSUN=1 swaps Math.cos/sin around the JS frame only: raw 1-step seed rate must collapse if the attribution is right.
const MSUN=(()=>{const _ab=new ArrayBuffer(8),_af=new Float64Array(_ab),_au=new Uint32Array(_ab);
 const hi=x=>{_af[0]=x;return _au[1];};
 const S1=-1.66666666666666324348e-01,S2=8.33333333332248946124e-03,S3=-1.98412698298579493134e-04,S4=2.75573137070700676789e-06,S5=-2.50507602534068634195e-08,S6=1.58969099521155010221e-10;
 const C1=4.16666666666666019037e-02,C2=-1.38888888888741095749e-03,C3=2.48015872894767294178e-05,C4=-2.75573143513906633035e-07,C5=2.08757232129817482790e-09,C6=-1.13596475577881948265e-11;
 const pio2_1=1.57079632673412561417e+00,pio2_1t=6.07710050650619224932e-11;
 const ksin=(x,y,iy)=>{const z=x*x,w=z*z,r=S2+z*(S3+z*S4)+z*w*(S5+z*S6),v=z*x;return iy===0?x+v*(S1+z*r):x-((z*(0.5*y-v*r)-y)-v*S1);};
 const kcos=(x,y)=>{const z=x*x;let w=z*z;const r=z*(C1+z*(C2+z*C3))+w*w*(C4+z*(C5+z*C6)),hz=0.5*z;w=1.0-hz;return w+(((1.0-w)-hz)+(z*r-x*y));};
 const rem=x=>{const hx=hi(x),ix=hx&0x7fffffff;let z,y0,y1;
  if(ix<=0x400f6a7a){if(ix<=0x4002d97c){if(hx>0){z=x-pio2_1;y0=z-pio2_1t;y1=(z-y0)-pio2_1t;return[1,y0,y1];}z=x+pio2_1;y0=z+pio2_1t;y1=(z-y0)+pio2_1t;return[-1,y0,y1];}
   if(hx>0){z=x-2*pio2_1;y0=z-2*pio2_1t;y1=(z-y0)-2*pio2_1t;return[2,y0,y1];}z=x+2*pio2_1;y0=z+2*pio2_1t;y1=(z-y0)+2*pio2_1t;return[-2,y0,y1];}
  if(ix<=0x4015fdbc){if(hx>0){z=x-3*pio2_1;y0=z-3*pio2_1t;y1=(z-y0)-3*pio2_1t;return[3,y0,y1];}z=x+3*pio2_1;y0=z+3*pio2_1t;y1=(z-y0)+3*pio2_1t;return[-3,y0,y1];}
  if(hx>0){z=x-4*pio2_1;y0=z-4*pio2_1t;y1=(z-y0)-4*pio2_1t;return[4,y0,y1];}z=x+4*pio2_1;y0=z+4*pio2_1t;y1=(z-y0)+4*pio2_1t;return[-4,y0,y1];};
 return {cos:x=>{const ix=hi(x)&0x7fffffff;if(ix<=0x3fe921fb)return kcos(x,0);const[n,y0,y1]=rem(x);switch(n&3){case 0:return kcos(y0,y1);case 1:return -ksin(y0,y1,1);case 2:return -kcos(y0,y1);default:return ksin(y0,y1,1);}},
         sin:x=>{const ix=hi(x)&0x7fffffff;if(ix<=0x3fe921fb)return ksin(x,0,0);const[n,y0,y1]=rem(x);switch(n&3){case 0:return ksin(y0,y1,1);case 1:return kcos(y0,y1);case 2:return -ksin(y0,y1,1);default:return -kcos(y0,y1);}}};})();
function jframe(){if(process.env.COSMSUN){const oc=Math.cos,os=Math.sin;Math.cos=MSUN.cos;Math.sin=MSUN.sin;J.frame();Math.cos=oc;Math.sin=os;}else J.frame();}
const TC={c:0,s:0,n:0,byStep:{}};
if(process.env.ORACLE){ // CA-31/32: aligned-stream sweep over real mkState states, one step per seed; raw AND post-stepSquash bit compare; DRAWLOG=1: per-cell draw-boundary marks + full draw recording for seed attribution
 const N2=+process.env.ORACLE||200,DL=!!process.env.DRAWLOG;
 let rawMism=0,postMism=0,cellsN=0;const samples=[],attr=[],SOLVE={},REQ=[];
 const _bb=new ArrayBuffer(8),_bf=new Float64Array(_bb),_bu=new Uint32Array(_bb);
 const bits=v=>{_bf[0]=v;return (BigInt(_bu[1])<<32n)|BigInt(_bu[0]);};
 const snapC=c=>[c.x,c.y,c.vx,c.vy,c.energy];
 for(let i=0;i<N2;i++){
  const base=mkState();
  const s0=1000+i*2,s1=5000+i*2;
  J.cells=clone(base);J.seq=0;J.frameT=0;for(const c of J.cells)c.bornAt=0;for(const k of Object.keys(J.ev))J.ev[k]=0;
  if(DL)J.cells.forEach((c,j)=>c.__bi=j);
  globalThis.DRAWS=[];globalThis.__CM=[];
  const rng0=makeRng(s0,s1);Math.random=DL?()=>{const v=rng0();globalThis.DRAWS.push(v);return v;}:rng0;
  jframe();
  const rawJ=J.cells.map(snapC);const Jcells_raw=clone(J.cells);
  J.stepSquash();const postJ=J.cells.map(snapC);
  J.cells=clone(base);J.seq=0;J.frameT=0;for(const c of J.cells)c.bornAt=0;pack(J.cells);E.sim_step(s0,s1);
  const cf2=new Float64Array(E.memory.buffer,E.sim_cells(pack.cap),pack.cap*ST);
  for(let k=0;k<pack.n;k++){const bb=k*ST,c=J.cells[k];if(!c)continue;
   c.x=cf2[bb];c.y=cf2[bb+1];c.vx=cf2[bb+2];c.vy=cf2[bb+3];c.radius=cf2[bb+4];c.energy=cf2[bb+5];c.gene=cf2[bb+6];c.alive=cf2[bb+7]!==0;c.maxSpeed=cf2[bb+8];c.speedModifier=cf2[bb+9];c.hostility=cf2[bb+10];c.mutationRate=cf2[bb+11];c.sv=cf2[bb+12];c.cl=cf2[bb+13];
   c.sq=cf2[bb+24];c.crowd=cf2[bb+25];c.envVx=cf2[bb+26];c.envVy=cf2[bb+27];c.sqS=Math.max(c.sqS||0,cf2[bb+28]);}
  for(let k=J.cells.length-1;k>=0;k--)if(!J.cells[k].alive)J.cells.splice(k,1);
  const rawW=J.cells.map(snapC);const Wcells_raw=clone(J.cells);
  J.stepSquash();const postW=J.cells.map(snapC);
  cellsN+=Math.min(rawJ.length,rawW.length);
  const cmp=(A,B)=>{if(A.length!==B.length)return -2;for(let k=0;k<A.length;k++)for(let q=0;q<5;q++)if(A[k][q]!==B[k][q])return k;return -1;};
  const rb=cmp(rawJ,rawW),pb=cmp(postJ,postW);
  if(rb!==-1){rawMism++;if(samples.length<6&&rb>=0){const k=rb;samples.push(' seed#='+i+' cell='+k+' raw dvx='+(rawJ[k][2]-rawW[k][2]).toExponential(2)+' dvy='+(rawJ[k][3]-rawW[k][3]).toExponential(2)+' den='+(rawJ[k][4]-rawW[k][4]).toExponential(2));}}
  if(pb!==-1)postMism++;
  if(DL&&rb>=0){ // CA-32 draw-level attribution: match rb back to its base index by position, then brute-force which trig evals (wander/organic-d/organic-q cos+sin, shifts 0/+-1/+-2 ulp, 5^6 chains) reproduce the wasm post-step velocity bits exactly. Only nn=0 wall-clean cells (chain = wander -> limit1 -> organic t-bump -> q-lerp -> limit2 -> f10 limit; keepIn/interact provably inert there).
   const bj=Jcells_raw[rb].__bi!==undefined?Jcells_raw[rb].__bi:-1;
   const mk2=bj>=0?globalThis.__CM.find(e=>e[0]===bj):null;
   if(mk2){
    const d0=mk2[1],D=globalThis.DRAWS,b=base[bj];
    const a1=D[d0]*6.283185307,a2=D[d0+1]*6.283185307,uu=D[d0+2],a3=D[d0+3]*6.283185307;
    let nn=0;for(const o of base){if(o!==b&&o.alive){const ddx=o.x-b.x,ddy=o.y-b.y;if(ddx*ddx+ddy*ddy<P.interactionRadius*P.interactionRadius)nn++;}}
    const dx=rawJ[rb][2]-rawW[rb][2],dy=rawJ[rb][3]-rawW[rb][3];
    const Jc=Jcells_raw[rb],Wc=Wcells_raw[rb];
    const chd=[];for(const k in Jc){const va=Jc[k],vb=Wc[k];if(typeof va==='number'&&typeof vb==='number'&&va!==vb&&!(va!==va&&vb!==vb))chd.push(k+'='+va.toExponential(3)+'/'+vb.toExponential(3));}
    const z=Math.max(0,Math.min(P.boundZone*(P.genomeOn?b.g.bnd:1),BOX/2.5,BOX/2.5)),zs=z*(P.senseR===undefined?1.6:P.senseR);
    const mg=Math.max(zs,b.radius+2);
    const wallok=!P.boundAware||process.env.CLEANBB?(true):(b.x>mg&&BOX-b.x>mg&&b.y>mg&&BOX-b.y>mg);
    if(nn===0&&wallok){
     const frombits=bb=>{_bu[0]=Number(bb&0xFFFFFFFFn);_bu[1]=Number((bb>>32n)&0xFFFFFFFFn);return _bf[0];};
     const shifts=v=>{const b0=bits(v),o=[];for(const k of[-2n,-1n,0n,1n,2n])o.push(frombits(b0+k));return o;};
     const lim=(vx,vy,m)=>{const s2=Math.sqrt(vx*vx+vy*vy);if(s2>m&&s2>0){const f=m/s2;return[vx*f,vy*f];}return[vx,vy];};
     const spm=b.speedModifier,ms=b.maxSpeed;
     const t=P.orgLifeDie+(-0.1+uu*(0.1-(-0.1))); // nn=0: brain=r90=0 (exact adds), life=orgLifeDie
     const chain=(C1,S1,C2,S2,C3,S3)=>{
      let vx=b.vx+C1*0.2*1,vy=b.vy+S1*0.2*1,r2=lim(vx,vy,ms*1*spm*1);vx=r2[0];vy=r2[1];
      vx=vx+C2*t;vy=vy+S2*t;
      vx=vx+(C3*ms-vx)*0.04;vy=vy+(S3*ms-vy)*0.04;
      r2=lim(vx,vy,ms*1);vx=r2[0];vy=r2[1];
      r2=lim(vx,vy,ms*spm);vx=r2[0];vy=r2[1];
      return[vx,vy];};
     const C1a=shifts(Math.cos(a1)),S1a=shifts(Math.sin(a1)),C2a=shifts(Math.cos(a2)),S2a=shifts(Math.sin(a2)),C3a=shifts(Math.cos(a3)),S3a=shifts(Math.sin(a3));
     const z0=chain(C1a[2],S1a[2],C2a[2],S2a[2],C3a[2],S3a[2]);
     const jok=z0[0]===rawJ[rb][2]&&z0[1]===rawJ[rb][3];
     const hits=[];
     for(let i1=0;i1<5;i1++)for(let i2=0;i2<5;i2++)for(let i3=0;i3<5;i3++)for(let i4=0;i4<5;i4++)for(let i5=0;i5<5;i5++)for(let i6=0;i6<5;i6++){
      const r2=chain(C1a[i1],S1a[i2],C2a[i3],S2a[i4],C3a[i5],S3a[i6]);
      if(r2[0]===rawW[rb][2]&&r2[1]===rawW[rb][3])hits.push([i1-2,i2-2,i3-2,i4-2,i5-2,i6-2]);}
     // marginal admissibility: per channel, which shifts appear in some hit; and simplest-hit complexity (min # nonzero channels)
     const marg=[[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]];
     let minnz=99;for(const h of hits){let nz=0;for(let k=0;k<6;k++){marg[k][h[k]+2]=1;if(h[k]!==0)nz++;}if(nz<minnz)minnz=nz;}
     for(let k=0;k<6;k++)for(let sh=0;sh<5;sh++)if(marg[k][sh])SOLVE['m'+k+'s'+(sh-2)]=(SOLVE['m'+k+'s'+(sh-2)]||0)+1;
     // CA-33: required channels = shift 0 inadmissible (every hit perturbs that channel). Exactly one required channel + a single-draw hit = unique attribution: that channel's trig differs at that angle.
     const req=[];for(let k=0;k<6;k++)if(hits.length&&!marg[k][2])req.push(k);
     if(req.length===1&&minnz===1){
      const k=req[0],angs=[a1,a1,a2,a2,a3,a3][k];
      const shset={};for(const h of hits){let nz=0,nk=-1;for(let q=0;q<6;q++)if(h[q]!==0){nz++;nk=q;}if(nz===1&&nk===k)shset[h[k]]=1;}
      REQ.push({ch:'wC wS oC oS qC qS'.split(' ')[k],ang:angs,shifts:Object.keys(shset).map(Number).sort((a,b)=>a-b)});}
     const key=(jok?'':'CHAINFAIL! ')+(hits.length?('hits='+hits.length+' minnz='+minnz):'UNSOLVED');
     SOLVE[key]=(SOLVE[key]||0)+1;SOLVE.n=(SOLVE.n||0)+1;if(jok)SOLVE.jok=(SOLVE.jok||0)+1;
     if(hits.length)SOLVE['hitsAny']=(SOLVE['hitsAny']||0)+1;else SOLVE['unsolved']=(SOLVE['unsolved']||0)+1;
     if(minnz===0)SOLVE['zero-shift-explains']=(SOLVE['zero-shift-explains']||0)+1;
     if(minnz===1)SOLVE['single-draw-explains']=(SOLVE['single-draw-explains']||0)+1;
     if(attr.length<200)attr.push(' SOLVE seed#='+i+' cell='+bj+' dx='+dx.toExponential(2)+' dy='+dy.toExponential(2)+' -> '+key+' || '+chd.join(' '));
    } else {
     attr.push(' SKIP seed#='+i+' cell='+bj+' nn='+nn+' (not isolated/wall-clean) '+chd.join(' '));}}}
if(process.env.DRAWLOG)attr.push(' draws JS='+globalThis.DRAWS.length+' replay='+globalThis.DRAWLEN);
 }
 console.log('ORACLE '+N2+' seeds x '+(cellsN/N2).toFixed(1)+' cells: raw mismatched states '+rawMism+' ('+(100*rawMism/N2).toFixed(2)+'%); post-stepSquash '+postMism+' ('+(100*postMism/N2).toFixed(2)+'%); masked '+(rawMism?((1-postMism/rawMism)*100).toFixed(1):'-')+'%');
 for(const t of samples)console.log(t);
 for(const t of attr.slice(0,60))console.log(t);
 const sk=Object.keys(SOLVE).filter(k=>k!=='n'&&k!=='jok').sort((a,b)=>SOLVE[b]-SOLVE[a]);
 console.log('SOLVE tally over '+(SOLVE.n||0)+' clean isolated divergent cells (chain-validated JS '+(SOLVE.jok||0)+'):');for(const k of sk.slice(0,25))console.log('  '+SOLVE[k]+'x [wC,wS,oC,oS,qC,qS] '+k);
 console.log('REQ uniquely-attributed cells: '+REQ.length);
 const rq={};for(const r of REQ)rq[r.ch]=(rq[r.ch]||0)+1;console.log('REQ by channel: '+JSON.stringify(rq));
 for(const r of REQ.slice(0,40))console.log('  REQ '+r.ch+' ang='+r.ang.toPrecision(17)+' shifts='+r.shifts.join(','));
 process.exit(0);}
let tj=new Array(8).fill(0),tw=new Array(8).fill(0);
const J_ev=()=>[J.ev.birth,J.ev.divide||0,J.ev.eaten||0,J.ev.merge||0,J.ev.fuse||0,J.ev.pair||0,J.ev.hit,J.ev.death];
const nStates=+process.argv[5]||10; let S2j=new Array(8).fill(0),S2w=new Array(8).fill(0);
let gMax=0,gSum=0,gN=0,gPressed=0;
const CH=['sq','sqS','crowd','envVx','envVy'],chJ={},chW={};CH.forEach(k=>{chJ[k]=[];chW[k]=[];});let popJ=0,popW=0; // FULLST channel distributions
for(let s=0;s<nStates;s++){if(process.env.STATESEED){const __rs=makeRng(1000+2*(+process.env.STATESEED),5000+2*(+process.env.STATESEED));Math.random=__rs;}const base=mkState();if(process.env.STATESEED){/* state now deterministic per STATESEED */}tj.fill(0);tw.fill(0);let sMax=0;
 for(let t=0;t<trials;t++){
  if(FULLST){const nSteps=+process.env.STEPS||1;
   J.cells=clone(base);J.seq=SEQ;J.frameT=0;for(const c of J.cells)c.bornAt=0;for(const k of Object.keys(J.ev))J.ev[k]=0;J.ev.birth=0;J.ev.death=0;J.ev.hit=0;if(FEED)J.food=FL.map(f=>({x:f.x,y:f.y,r:0}));
   const snJ=[],snW=[];
   for(let st=0;st<nSteps;st++){globalThis.__step=st;if(TR2){const r2=makeRng(1000+st*2,5000+st*2);Math.random=process.env.TRIGCNT?()=>{const v=r2();const a=v*6.283185307;const dc=MSUN.cos(a)!==Math.cos(a)?1:0,ds=MSUN.sin(a)!==Math.sin(a)?1:0;TC.c+=dc;TC.s+=ds;TC.n++;TC.byStep[st]=(TC.byStep[st]||[0,0]);TC.byStep[st][0]+=dc;TC.byStep[st][1]+=ds;return v;}:r2;}if(process.env.RCCNT){globalThis.__rc=0;const __b2=Math.random;Math.random=()=>{globalThis.__rc++;return __b2();};}jframe();if(process.env.RCCNT)console.log('RCJ st='+st+' rc='+globalThis.__rc);if(FEED)J.food=FL.map(f=>({x:f.x,y:f.y,r:0}));const sqSJ=TR2?J.cells.map(c=>c.sqS||0):null;J.stepSquash();if(process.env.POPDIFF)console.log('POP st='+st+' js='+J.cells.length);if(TR2){for(const c of J.cells)if(c.shp&&c.shp.t===1){console.log('SHPGUARD FAIL step '+st+' side js: a compared cell has shp.t===1 - the string swim is JS-only, this config is not served-comparable');process.exit(3);}const a2=J.cells.map(snap);for(let q=0;q<a2.length;q++)a2[q].sqS=sqSJ[q];snJ.push(a2);}if(TR)trJ.push(liveN(J.cells)+':'+meanEnv(J.cells).toFixed(3)+'/'+meanKey(J.cells,'maxSpeed').toFixed(2)+'/'+meanKey(J.cells,'crowd').toFixed(3)+'/'+meanKey(J.cells,'sq').toFixed(3));} // sqS capture: pre-stepSquash (the post-pass zeroes sqS by design), index-aligned (stepSquash never splices); app JS-mode order: cell loop, then the squash post-pass (ca2.js:2302)
   let nj=0;for(const c of J.cells){if(!c.alive)continue;nj++;chJ.sq.push(c.sq||0);chJ.crowd.push(c.crowd||0);chJ.envVx.push(c.envVx||0);chJ.envVy.push(c.envVy||0);chJ.sqS.push(c.sqS||0);if((c.sq||0)>0.001)gPressed++;} // post-stepSquash sqS is 0 by design; the eased sq carries the press
   popJ+=nj;
   J.cells=clone(base);J.seq=SEQ;J.frameT=0;for(const c of J.cells)c.bornAt=0;
   for(let st=0;st<nSteps;st++){ // app wasm-mode frame: pack, step, read back (sqS = max accumulation), sweep dead, stepSquash post-pass
    J.frameT+=16.7; // 1:1 app frame(): frameT advances before the pack, so slot-23 ages and readback children bornAt match the JS side (goreda open item 1)
    const preEnv=TR?J.cells.map(c=>({x:c.envVx||0,y:c.envVy||0,a:c.alive})):null;
    pack(J.cells);if(BORNTR){const pre=new Float64Array(E.memory.buffer,E.sim_cells(pack.cap),pack.cap*ST);for(let i=pack.n;i<pack.cap;i++)pre[i*ST+7]=0;} // zero tail alive-flags before the step: any live slot past pack.n after the step is a FRESH birth - the wasm reuses truncated slots, so a high-water mark both re-appends stale children and skips fresh ones (CA-38c phantom fix, v2)
    pack(J.cells);if(TR2){E.sim_step(1000+st*2,5000+st*2);}else{E.sim_step(Math.floor(Math.random()*4294967296),Math.floor(Math.random()*4294967296));}
    if(TR){const oT=new Float64Array(E.memory.buffer,E.sim_out(),32);DW.ny+=oT[26];DW.sy+=oT[27];DW.nx+=oT[28];DW.sx+=oT[29];}
    const edkT=Math.pow(0.75,16.7*0.06);
    const cf2=new Float64Array(E.memory.buffer,E.sim_cells(pack.cap),pack.cap*ST);
    for(let i=0;i<pack.n;i++){const bb=i*ST,c=J.cells[i];if(!c)continue;
     c.x=cf2[bb];c.y=cf2[bb+1];c.vx=cf2[bb+2];c.vy=cf2[bb+3];c.radius=cf2[bb+4];c.energy=cf2[bb+5];c.gene=cf2[bb+6];c.alive=cf2[bb+7]!==0;c.maxSpeed=cf2[bb+8];c.speedModifier=cf2[bb+9];c.hostility=cf2[bb+10];c.mutationRate=cf2[bb+11];c.sv=cf2[bb+12];c.cl=cf2[bb+13];
     if(TR&&preEnv[i]&&preEnv[i].a){const ddx=cf2[bb+26]-preEnv[i].x*edkT,ddy=cf2[bb+27]-preEnv[i].y*edkT;if(Math.abs(ddx)>1e-9){DW.nx++;DW.sx+=Math.abs(ddx);}if(Math.abs(ddy)>1e-9){DW.ny++;DW.sy+=Math.abs(ddy);}}
     c.sq=cf2[bb+24];c.crowd=cf2[bb+25];c.envVx=cf2[bb+26];c.envVy=cf2[bb+27];c.sqS=Math.max(c.sqS||0,cf2[bb+28]);}
    if(BORNTR){for(let i=pack.n;i<pack.cap;i++){const bb=i*ST;if(cf2[bb+7]===0)continue;const c=new J.Cell(cf2[bb],cf2[bb+1],cf2[bb+6],5);c.vx=cf2[bb+2];c.vy=cf2[bb+3];c.radius=cf2[bb+4];c.energy=cf2[bb+5];c.maxSpeed=cf2[bb+8];c.speedModifier=cf2[bb+9];c.hostility=cf2[bb+10];c.mutationRate=cf2[bb+11];c.sv=cf2[bb+12];c.cl=cf2[bb+13];const gg=c.g;gg.spd=cf2[bb+15];gg.app=cf2[bb+16];gg.bnd=cf2[bb+17];gg.col=[cf2[bb+18],cf2[bb+19],cf2[bb+20]];if(cf2[bb+21]>0)c.comp=cf2[bb+21];c.sq=cf2[bb+24];c.crowd=cf2[bb+25];c.envVx=cf2[bb+26];c.envVy=cf2[bb+27];c.sqS=cf2[bb+28];c.bornAt=J.frameT;c.shp={t:0,asp:1,th:1,wig:0,wsp:1,sat:0,ph:0,ph2:0,dir:0};J.cells.push(c);}} // bornAt=J.frameT: served children start at age 0 like JS divide's bornAt:frameT; shp is JS-only (no served slots), comparison-excluded // CA-39: birth-enabled readback - wasm children occupy contiguous slots past pack.n (BORN=1 probe), append in slot order to mirror the JS cells.push in divide()
    for(let i2=J.cells.length-1;i2>=0;i2--)if(!J.cells[i2].alive)J.cells.splice(i2,1);
    if(process.env.BORN){let live=0,top=-1;for(let i=0;i<pack.cap;i++){if(cf2[i*ST+7]!==0){live++;top=i;}}console.log('BORN st='+st+' pack.n='+pack.n+' aliveSlots='+live+' topAlive='+top);{let dead=[];for(let i=0;i<=top;i++)if(cf2[i*ST+7]===0)dead.push(i);console.log('BDEAD st='+st+' dead='+dead.join(','));}if(st<=1){for(let i=0;i<pack.n;i++)console.log('BORNP st='+st+' slot='+i+' ms='+cf2[i*ST+8].toPrecision(17)+' age='+cf2[i*ST+23].toPrecision(17)+' x='+cf2[i*ST].toPrecision(17)+' y='+cf2[i*ST+1].toPrecision(17)+' r='+cf2[i*ST+4].toPrecision(17)+' en='+cf2[i*ST+5].toPrecision(17));}if(process.env.BORNC)for(let i=pack.n;i<=top;i++)console.log('BORNC st='+st+' slot='+i+' ms='+cf2[i*ST+8].toPrecision(17)+' sv='+cf2[i*ST+12].toPrecision(17)+' mr='+cf2[i*ST+11].toPrecision(17)+' x='+cf2[i*ST].toPrecision(17)+' y='+cf2[i*ST+1].toPrecision(17)+' r='+cf2[i*ST+4].toPrecision(17)+' en='+cf2[i*ST+5].toPrecision(17)+' vx='+cf2[i*ST+2].toPrecision(17)+' vy='+cf2[i*ST+3].toPrecision(17)+' host='+cf2[i*ST+10].toPrecision(17)+' smod='+cf2[i*ST+9].toPrecision(17)+' gene='+cf2[i*ST+6]+' spd='+cf2[i*ST+15].toPrecision(17)+' app='+cf2[i*ST+16].toPrecision(17)+' bnd='+cf2[i*ST+17].toPrecision(17)+' col='+cf2[i*ST+18].toPrecision(17)+','+cf2[i*ST+19].toPrecision(17)+','+cf2[i*ST+20].toPrecision(17));}
    const sqSW=TR2?J.cells.map(c=>c.sqS||0):null;J.stepSquash();if(process.env.POPDIFF)console.log('POP st='+st+' wasm='+J.cells.length);if(TR2){for(const c of J.cells)if(c.shp&&c.shp.t===1){console.log('SHPGUARD FAIL step '+st+' side wasm: a compared cell has shp.t===1 - the string swim is JS-only, this config is not served-comparable');process.exit(3);}const a2=J.cells.map(snap);for(let q=0;q<a2.length;q++)a2[q].sqS=sqSW[q];snW.push(a2);}if(TR)trW.push(liveN(J.cells)+':'+meanEnv(J.cells).toFixed(3)+'/'+meanKey(J.cells,'maxSpeed').toFixed(2)+'/'+meanKey(J.cells,'crowd').toFixed(3)+'/'+meanKey(J.cells,'sq').toFixed(3));}
   if(TR2){let firstDiv=-1;const seq=[];
    const cmpC=(a,b)=>(a.x-b.x)||(a.y-b.y)||(a.vx-b.vx)||(a.vy-b.vy)||(a.en-b.en)||(a.r-b.r)||(a.g-b.g)||(a.sqS-b.sqS)||(a.spd-b.spd)||(a.app-b.app)||(a.bnd-b.bnd)||(a.ms-b.ms)||(a.sm-b.sm)||(a.hst-b.hst)||(a.sv-b.sv)||(a.mr-b.mr)||(a.c0-b.c0)||(a.c1-b.c1)||(a.c2-b.c2); // sorted-state pairing (goreda open item 2): lexicographic by current compared state - NOT lineage identity; pairings survive different child append orders, length mismatch reported, never masked
    for(let st=0;st<snJ.length;st++){
     let mx=0,mi=-1;
     if(snJ[st].length!==snW[st].length){firstDiv=st;console.log('TR2 FIRST DIVERGENCE step '+st+' population js '+snJ[st].length+' wasm '+snW[st].length);seq.push('POP');break;}
     const sJ=snJ[st].slice().sort(cmpC),sW=snW[st].slice().sort(cmpC);
     for(let i2=0;i2<sJ.length;i2++){const a2=sJ[i2],b2=sW[i2];const d=Math.abs(a2.x-b2.x)+Math.abs(a2.y-b2.y)+Math.abs(a2.en-b2.en)+Math.abs(a2.g-b2.g)+Math.abs(a2.vx-b2.vx)+Math.abs(a2.vy-b2.vy)+Math.abs(a2.r-b2.r)+Math.abs(a2.ex-b2.ex)+Math.abs(a2.ey-b2.ey)+Math.abs(a2.cr-b2.cr)+Math.abs(a2.sq-b2.sq)+Math.abs(a2.age-b2.age)+Math.abs(a2.sqS-b2.sqS)+Math.abs(a2.spd-b2.spd)+Math.abs(a2.app-b2.app)+Math.abs(a2.bnd-b2.bnd)+Math.abs(a2.ms-b2.ms)+Math.abs(a2.sm-b2.sm)+Math.abs(a2.hst-b2.hst)+Math.abs(a2.sv-b2.sv)+Math.abs(a2.mr-b2.mr)+Math.abs(a2.c0-b2.c0)+Math.abs(a2.c1-b2.c1)+Math.abs(a2.c2-b2.c2);if(d>mx){mx=d;mi=i2;}} // every snapshot channel incl. sqS direct + post-birth spd/app/bnd/maxSpeed/speedModifier: a channel-only divergence can no longer read as mx=0 // full compared channel set incl. r, envV, crowd, squash, age: no single-channel divergence reads as mx=0
     seq.push(mx.toFixed(4));
     if(process.env.DD&&(+process.env.DD<0||st===+process.env.DD)){for(let i2=0;i2<sJ.length;i2++){const a2=sJ[i2],b2=sW[i2];const dd=Math.abs(a2.vx-b2.vx)+Math.abs(a2.vy-b2.vy);if(dd>0)console.log('DD st='+st+' i='+i2+' js='+JSON.stringify(a2)+' ws='+JSON.stringify(b2));}}
     if(firstDiv<0&&mx>0){firstDiv=st;const a=sJ[mi],b=sW[mi];
      console.log('TR2 FIRST DIVERGENCE step '+st+' cell '+mi+' |dp| '+mx.toExponential(2));
      console.log('  js   '+JSON.stringify(a));
      console.log('  wasm '+JSON.stringify(b));
      const dvs=sJ.map((c2,i2)=>{const w=sW[i2];return w?i2+':'+(Math.abs(c2.vx-w.vx)+Math.abs(c2.vy-w.vy)).toFixed(2):'?';});
      console.log('  per-cell |dv|: '+dvs.join(' '));
      const key=c2=>JSON.stringify(c2),cnt={};for(const c2 of sW)cnt[key(c2)]=(cnt[key(c2)]||0)+1;
      const onlyJ=[];for(const c2 of sJ){const k=key(c2);if(cnt[k])cnt[k]--;else onlyJ.push(c2);}
      const cnt2={};for(const c2 of sJ)cnt2[key(c2)]=(cnt2[key(c2)]||0)+1;
      const onlyW=[];for(const c2 of sW){const k=key(c2);if(cnt2[k])cnt2[k]--;else onlyW.push(c2);}
      console.log('  multiset-diff: only-js='+onlyJ.length+' only-wasm='+onlyW.length);
      onlyJ.slice(0,3).forEach(c2=>console.log('  ONLY-JS   '+JSON.stringify(c2)));
      onlyW.slice(0,3).forEach(c2=>console.log('  ONLY-WASM '+JSON.stringify(c2)));}}
    console.log('TR2CH js divide='+(J.ev.divide||0)+' birth='+(J.ev.birth||0)+' merge='+(J.ev.merge||0)+' fuse='+(J.ev.fuse||0)+'(cl/comp inert proof: 0 contacts)'+(J.ev.divide?'':' = divide gate NEVER fired: post-birth channels NOT exercised')+' (shp.t===1 guarded per step: SHPGUARD FAIL + exit 3)');
   if(FEED)console.log('FEED eats js='+(J.ev.ate||0)+(J.ev.ate?'':' = the eat path was NOT exercised: P.foodEatR is undefined without the app preset, set it via SET=foodEatR=<px>'));
   console.log('TR2 per-step max|dpos|: '+seq.join(' '));}
   if(process.env.TRIGCNT){const bs=Object.keys(TC.byStep).map(k=>k+':'+TC.byStep[k][0]+'/'+TC.byStep[k][1]);console.log('TRIGCNT draws='+TC.n+' cos-mism='+TC.c+' ('+(100*TC.c/TC.n).toFixed(3)+'%) sin-mism='+TC.s+' ('+(100*TC.s/TC.n).toFixed(3)+'%)');console.log('TRIGCNT per-step cos/sin: '+bs.join(' '));}
   for(const c of J.cells){chW.sq.push(c.sq||0);chW.crowd.push(c.crowd||0);chW.envVx.push(c.envVx||0);chW.envVy.push(c.envVy||0);chW.sqS.push(c.sqS||0);}
   popW+=J.cells.length;
   if(TR)console.log('KB '+(globalThis.__KB||0)+' KP '+(globalThis.__KP||0)+' KD '+(globalThis.__KD||0));
   if(TR)console.log('DRIFT js nx '+DJ.nx+' sx '+DJ.sx.toFixed(1)+' ny '+DJ.ny+' sy '+DJ.sy.toFixed(1)+' | wasm nx '+DW.nx+' sx '+DW.sx.toFixed(1)+' ny '+DW.ny+' sy '+DW.sy.toFixed(1));
   if(TR)console.log('TRACE per-step n:mean|envV|/maxSpeed/crowd/sq: js ['+trJ.join(' ')+'] wasm ['+trW.join(' ')+']');
   continue;}
  J.cells=clone(base);J.seq=SEQ;J.frameT=0;for(const c of J.cells)c.bornAt=0;for(const k of Object.keys(J.ev))J.ev[k]=0;J.ev.birth=0;J.ev.death=0;J.ev.hit=0;jframe();const a=J_ev();a.forEach((v,i)=>tj[i]+=v);
  {const cb=clone(base);for(const c of cb)c.bornAt=0;pack(cb);}E.sim_step(Math.floor(Math.random()*4294967296),Math.floor(Math.random()*4294967296));const o=new Float64Array(E.memory.buffer,E.sim_out(),32);
  const b=[o[0],o[1],o[2],o[3],o[4],o[5],o[6],o[9]];b.forEach((v,i)=>tw[i]+=v);
  if(process.env.LOGCHK){const lg=new Float64Array(E.memory.buffer,E.sim_log(),o[17]);let k1=0,k2=0,k3=0,kBad=0;
   for(let i=0;i<lg.length;i+=4){const k0=lg[i],p0=lg[i+1],p1=lg[i+2],kd=lg[i+3];
    if(kd===1)k1++;else if(kd===2)k2++;else if(kd===3)k3++;else kBad++;
    if(p0<0||p0>=pack.n+64||k0<0||k0>=pack.n+64)kBad++;if(kd===2&&p1<0)kBad++;} // indices must address the live buffer (+headroom for same-step births)
   LOG.k1+=k1;LOG.k2+=k2;LOG.k3+=k3;LOG.bad+=kBad;LOG.o0+=o[0];LOG.o1+=o[1];LOG.o4+=o[4];LOG.steps++;}
  if(BOUND&&!FULL){const nSteps=+process.env.STEPS||1;
   for(let st=1;st<nSteps;st++){jframe();E.sim_step(Math.floor(Math.random()*4294967296),Math.floor(Math.random()*4294967296));}
   const cf2=new Float64Array(E.memory.buffer,E.sim_cells(pack.cap),pack.cap*ST),jc=J.cells;let mx=0;
   {for(let i=0;i<pack.n;i++){const bb=i*ST,c=jc[i];if((c.sqS||0)>0.001)gPressed++;
    const pr=[[c.x,cf2[bb],'x'],[c.y,cf2[bb+1],'y'],[c.vx,cf2[bb+2],'vx'],[c.vy,cf2[bb+3],'vy'],[c.sqS||0,cf2[bb+28],'sqS'],[c.crowd||0,cf2[bb+25],'crowd'],[c.envVx||0,cf2[bb+26],'envVx'],[c.envVy||0,cf2[bb+27],'envVy'],[c.sq||0,cf2[bb+24],'sq'],[c.radius,cf2[bb+4],'radius']];
    for(const q of pr){const dd=Math.abs(q[0]-q[1]);if(process.env.DBG&&dd>0.05)console.log('DBG cell',i,'ch',q[2],'js',q[0],'wasm',q[1]);if(dd>mx)mx=dd;gSum+=dd;gN++;}}
   if(mx>sMax)sMax=mx;if(mx>gMax)gMax=mx;}}}
 if(BOUND&&!FULL)console.log('state',s,'maxAbsDiff',sMax);
 else console.log('state',s,K.concat('death').map((k,i)=>k+' js '+(tj[i]/trials).toFixed(4)+' wasm '+(tw[i]/trials).toFixed(4)+' ('+(tj[i]?((tw[i]/tj[i]-1)*100).toFixed(0):'-')+'%)').join(' | '));
 tj.forEach((v,i)=>S2j[i]+=v);tw.forEach((v,i)=>S2w[i]+=v);}
if(BOUND&&!FULL){const tol=BOX*0.01,mean=gN?gSum/gN:0;const bad=gMax>tol||gPressed<=0;
 console.log(bad?'FAIL keep_in parity: maxAbsDiff '+gMax+' > '+tol+' (1% of box) or no pressed cells ('+gPressed+')':'PASS js==wasm keep_in: maxAbsDiff '+gMax.toExponential(2)+' mean '+mean.toExponential(2)+' over '+gN+' values, '+gPressed+' pressed cells ('+nStates+' states x '+trials+' trials, tol 1% of box)');process.exit(bad?1:0)}
if(FULLST){let bad=[];const stat=a=>{if(!a.length)return[0,0];const b=a.map(Math.abs).sort((x,y)=>x-y);let m=0;for(const v of b)m+=v;return[m/b.length,b[Math.min(b.length-1,Math.floor(b.length*0.95))]];}; // mean|v| and p95|v|: signed means cancel on symmetric walls, max is heavy-tailed
 CH.forEach(k=>{const[mj,xj]=stat(chJ[k]),[mw,xw]=stat(chW[k]);if(Math.abs(mj-mw)>Math.max(0.02,mj*0.25)||Math.abs(xj-xw)>Math.max(0.05,xj*0.35))bad.push(k+' mean|v| js '+mj.toFixed(4)+' wasm '+mw.toFixed(4)+' | p95 js '+xj.toFixed(3)+' wasm '+xw.toFixed(3));});
 if(Math.abs(popJ-popW)>Math.max(2,popJ*0.05))bad.push('population js '+popJ+' wasm '+popW);if(gPressed<=0)bad.push('no pressed cells');
 console.log(bad.length?'FAIL full-step channel parity: '+bad.join('; '):'PASS js==wasm full-step channel distributions (sq/sqS/crowd/envVx/envVy mean+max) over '+popJ+' live cells ('+nStates+' states x '+trials+' trials x '+(+process.env.STEPS||1)+' steps), '+gPressed+' pressed');process.exit(bad.length?1:0)}
console.log('TOTAL',K.concat('death').map((k,i)=>k+' js '+(S2j[i]/trials/nStates).toFixed(4)+' wasm '+(S2w[i]/trials/nStates).toFixed(4)+' ('+(S2j[i]?((S2w[i]/S2j[i]-1)*100).toFixed(1):'-')+'%)').join('\n  '));
if(FULL&&(S2j[0]<=0||S2j[1]<=0||S2w[0]<=0||S2w[1]<=0)){console.log('FAIL BIRTH=1: birth or divide counter is zero (js birth '+S2j[0]+' divide '+S2j[1]+', wasm birth '+S2w[0]+' divide '+S2w[1]+')');process.exit(1)}
if(process.env.LOGCHK){const rows=['kind1(divide) log '+LOG.k1+' vs out[1] '+LOG.o1,'kind2(birth) log '+LOG.k2+' vs out[0] '+LOG.o0,'kind3(fuse) log '+LOG.k3+' vs out[4] '+LOG.o4,'malformed '+LOG.bad+' over '+LOG.steps+' steps'];
 const ok=LOG.k1===LOG.o1&&LOG.k3===LOG.o4&&LOG.bad===0&&LOG.o0>0&&LOG.k1>0&&LOG.k2===LOG.o0-LOG.o1; // kind2 logs reproduce-births only; out[0] counts ALL new cells incl. divide-births (sim.rs:179 out[0]+=out[1]+=1) so kind2 == out[0]-out[1] exactly // kind2 births: the served binary counts ~100x more births in out[0] than it logs - known gap, see devtools/evidence/simlog-birth-records-20261107.md
 console.log((ok?'PASS':'FAIL')+' sim_log records <-> out counters: '+rows.join(' | ')+' | kind2 logged '+(100*LOG.k2/Math.max(1,LOG.o0)).toFixed(1)+'% of counted');process.exit(ok?0:1)}
{let bad=[];const TOL=(process.env.EAT||FULL)?0.03:0.01,CTOL=(FULL||process.env.EAT)?0.15:TOL;S2j.forEach((v,i)=>{const t=((FULL||process.env.EAT)&&i>=3&&i<=5)?CTOL:TOL;if(Math.abs(S2w[i]-v)>Math.max(0.5,v*t))bad.push(K.concat('death')[i]+' js '+v+' wasm '+S2w[i]+' (tol '+(t*100)+'%)')});console.log(bad.length?'FAIL counters differ: '+bad.join('; '):'PASS js==wasm counters ('+nStates+' states x '+trials+' trials'+(FULL?', full-step birth/divide mode; merge/fuse/pair tol 15% (same-pass coupling floor), rest 3%':'')+')');process.exit(bad.length?1:0)}
})();
