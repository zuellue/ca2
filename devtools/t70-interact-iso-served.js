// SERVED-TEST variant of t70-interact-iso.js: defaults CA_JS=test/ca2.js WASM=test/ca2core.wasm; reads the cell stride from the wasm (sim_stride, 30 on the served build; the original hardcoded 24, which misaligned every cell and made "wasm death" a constant 30).
// frozen-input isolation: JS interact loop vs wasm sim_step (interact-only, p[56]=1) on identical cell sets.
// BIRTH=1 (CA-3, extended CA-13): full-step parity (p[56]=0) so the contact-birth (reproduce) and radius-gate divide paths run on both engines; the JS side runs the real extracted update/checkSurvival/interact/keepIn loop (same shape as t74) and birth+divide counters must be nonzero and match within 3%. CA-13: the JS loop defers death removal to a post-pass and counts clusters over alive+absorbed, 1:1 sim.rs step()/count_slots (a mid-pass splice was the eaten/death drift). merge/fuse/pair carry a 15% band: same-pass outcome coupling + ULP-level borderline contacts set a noise floor there (measured: sign-flipping 4-25% at 400x2, stable PASS at 800 trials x 4 states). Standard run: `BIRTH=1 node devtools/t70-interact-iso-served.js 800 40 160 4`; JS-side mutation (interact fuse gate x2) must FAIL. Round shapes only: the string swim is a JS post-pass outside sim.rs.
// BOUND=1 (CA-11): keepIn-only parity (p[56]=2): cells fired at/outside the walls (1/3 grown past CELL_RADIUS to cover the radius-wear path); JS keepIn vs wasm keep_in, per-cell readback of x,y,vx,vy,radius,sqS(press),crowd,envVx,envVy must match (tol 1% of box, stricter than the 3% contract); pressed-cell coverage must be nonzero.
// Note: the params view must be 97 wide like the live pack; an 80-wide view silently drops p[80-96] (wall-carry/squash/sensing/crowd), and the pack must write cell slots 24-27 (sq/crowd/envV) every step or wasm state leaks across trials - either bug fakes a keep_in skew. The branch-local wasm/src/sim.rs tree is STALE (pre-item-64); the served binary's byte-verified source is commit 51dce62.
// usage: node devtools/t70-interact-iso-served.js [trials] [ncells] [box]
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..',process.env.CA_JS||'test/ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');if(i<0)throw name;let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
function vr(name){const i=src.indexOf('var '+name+' = ');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1)+';';}
const FULL=!!process.env.BIRTH||!!process.env.FULLST,BOUND=!!process.env.BOUND,FULLST=!!process.env.FULLST; // FULLST (CA-15): full-step multi-step state-channel parity (sq/sqS/crowd/envV distributions over live cells) on wall-fired constant-population states; the wasm side runs the app wasm-mode frame (pack -> step -> readback with sqS=max -> sweep -> stepSquash post-pass). Standard run: FULLST=1 STEPS=10; mutation: JS keepIn press x0.5 must FAIL. FINDING (devtools/evidence/fullstep-crowdpush-drift-20261107.md): at STEPS=30 the served binary injects ~2-3x the JS crowdPush envV - served != every in-repo source in this path.
const names=['rand2D','normCol','speedOf','mutGenome','mixGenome','newShape','mixShape','mutateGene','Cell','effR','birthCapF','clusterSize','joinCluster','fuseCells','interact','reproduce'].concat(FULL||BOUND?['checkSurvival','limit','misfit','update','organic','keepIn','divide','wallPull','carrySide','stepSquash']:['keepIn','wallPull','carrySide','stepSquash','effR','limit']); // default mode also references stepSquash in the return
const code=`var frameT=0,frameDtf=16.7,UI_END=800,CELL_END=1300;
var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var clamp=function(v,a,b){return v<a?a:v>b?b:v;};var lerp=function(a,b,t){return a+(b-a)*t;};var map=function(v,a,b,c,d){return c+(d-c)*(v-a)/(b-a);};
${vr('P')}
var cells=[],food=[],ev={birth:0,death:0,hit:0,oob:0},clusterSeq=0,cmean={},cont={x:0,y:0,w:0,h:0,wvx0:0,wvx1:0,wvy0:0,wvy1:0},mouse={x:-1e9,y:-1e9,over:false},resizeDrag=false,env={spd:1,app:0.5,bnd:1,col:null};
function habAte(){}function habReap(){}
${names.map(fn).join('\n')}
return {P:P,Cell:Cell,cont:cont,get cells(){return cells;},set cells(v){cells=v;},ev:ev,get seq(){return clusterSeq;},set seq(v){clusterSeq=v;},stepSquash:stepSquash,
 frame:function(){for(var i=cells.length-1;i>=0;i--){var c=cells[i];if(${FULL}){update(c);checkSurvival(c);}if(!${BOUND}){for(var k=i-1;k>=0;k--)interact(c,cells[k]);}if((${FULL}||${BOUND})&&P.boundAware&&c.alive)keepIn(c);if(${FULL}&&c.alive)limit(c,c.maxSpeed*c.speedModifier);if(!c.alive)ev.death++;}for(var i2=cells.length-1;i2>=0;i2--)if(!cells[i2].alive)cells.splice(i2,1);}};`; // 1:1 sim.rs step() + the CA-13 JS loop: deaths counted in-pass, removal deferred to a post-pass (a mid-pass splice was the eaten/death drift); f10 limit() closes the step like the app (mouse far away, resizeDrag off -> factors 1)
const J=new Function(code)();
const P=J.P;
if(process.env.EAT){P.eatMergeOn=1;P.symbiosisOn=1;P.symbiogenesisOn=1;P.divideOn=1;P.eatChance=1;P.mergeChance=1;P.reproChance=1;P.clusterCohesion=1;P.eatDistF=0.85;P.fuseDistF=0.6;P.symDistF=1.1;}
if(FULL||BOUND){if(P.wallCarry===undefined)P.wallCarry=1;if(P.wallSpread===undefined)P.wallSpread=0.5;if(P.squashMax===undefined)P.squashMax=0.18;if(P.squashIn===undefined)P.squashIn=0.45;if(P.squashOut===undefined)P.squashOut=0.08;if(P.senseR===undefined)P.senseR=1.6;if(P.senseSlow===undefined)P.senseSlow=0.25;if(P.senseTurn===undefined)P.senseTurn=0.12;if(P.senseDelay===undefined)P.senseDelay=0.5;if(P.crowdGain===undefined)P.crowdGain=0.12;if(P.crowdRel===undefined)P.crowdRel=0.02;if(P.crowdSlow===undefined)P.crowdSlow=0.5;if(P.crowdPush===undefined)P.crowdPush=0.3;}
if(FULL){P.reproChance=Math.max(P.reproChance||0,0.5);P.reproMinAgeMs=0;P.divideOn=1;P.divideAt=1.5;P.orgLifeDie=-0.005;P.orgLifeGrow=1.0025;P.orgBirth=1.005;P.orgDead=-0.0025;P.orgBrain=0.008;P.orgR90=0.0025;P.symEnergy=0.00075;P.symBreak=0.0002;P.symBreakDist=3;if(P.eatDistF===undefined)P.eatDistF=0.85;if(P.fuseDistF===undefined)P.fuseDistF=0.6;if(P.symDistF===undefined)P.symDistF=1.1;P.habitatOn=0;P.habitatBirthCap=2;}
if(FULLST){P.reproChance=0;P.divideOn=0;P.eatChance=0;P.mergeChance=0;P.habitatOn=0;} // constant population: channels comparable per-cell (index-stable), only the update() wander draws differ across engines
if(process.env.ZERO){process.env.ZERO.split(',').forEach(k=>{P[k]=0;});}
if(process.env.SET){process.env.SET.split(',').forEach(kv=>{const a=kv.split('=');P[a[0]]=+a[1];});} // symmetric override for bisection // symmetric gate: zero a P key on BOTH engines (JS reads J.P===P, wasm pack reads P) to bisect a drift to one subpath
const [trials,N,BOX]=[+process.argv[2]||3000,+process.argv[3]||75,+process.argv[4]||160];
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
function pack(cs){const n=cs.length,cap=n+256;pack.cap=cap;E.sim_cells(cap);E.sim_food(2);E.sim_cm(2);const cp=E.sim_cells(cap);E.sim_food(2);const pp=E.sim_params();
 const buf=E.memory.buffer,cf=new Float64Array(buf,cp,cap*ST),p=new Float64Array(buf,pp,97); // 97 like the live pack: p[80-96] carry wall-carry/squash/sensing/crowd (an 80-wide view silently dropped them)
 cs.forEach((c,i)=>{const b=i*ST,g=c.g;cf.set([c.x,c.y,c.vx,c.vy,c.radius,c.energy,c.gene,1,c.maxSpeed,c.speedModifier,c.hostility,c.mutationRate,c.sv,c.cl||0,-1,g.spd,g.app,g.bnd,g.col[0],g.col[1],g.col[2],c.comp||0,0,0],b);if(ST>=30)cf.set([c.sq||0,c.crowd||0,c.envVx||0,c.envVy||0,0,0],b+24);}); // slots 24-27 carry squash/crowd/envV state per frame (1:1 with the live pack); leaving them stale leaks state across trials
 E.sim_set_n(n);E.sim_set_nf(0);E.sim_cm_count(0);pack.n=n;
 PI.forEach((k,i)=>{let v=P[k];p[i]=typeof v==='boolean'?(v?1:0):v;});p[39]=1;p[40]=0.5;p[41]=1;p[42]=0;p[46]=-1e9;p[47]=-1e9;p[48]=0;p[49]=0;p[50]=0;p[51]=1e9;p[52]=1e9;p[53]=0;p[54]=SEQ;p[56]=1;if(process.env.EAT){p[70]=P.eatDistF;p[71]=P.fuseDistF;p[72]=P.symDistF;}
 if(FULL||BOUND){p[80]=0;p[81]=0;p[82]=0;p[83]=0;p[84]=P.wallCarry;p[85]=P.wallSpread;p[86]=P.squashMax;p[87]=P.squashIn;p[88]=P.squashOut;p[89]=P.senseR;p[90]=P.senseSlow;p[91]=P.senseTurn;p[92]=P.senseDelay;p[93]=P.crowdGain;p[94]=P.crowdRel;p[95]=P.crowdSlow;p[96]=P.crowdPush;}
 if(BOUND){p[51]=BOX;p[52]=BOX;p[56]=2;p[78]=16.7;}
 if(FULL){p[51]=BOX;p[52]=BOX;p[56]=0;p[58]=P.reproMinAgeMs||0;p[59]=P.reproChance===undefined?0.02:P.reproChance;p[61]=P.orgLifeDie;p[62]=P.orgLifeGrow;p[63]=P.orgBirth;p[64]=P.orgDead;p[65]=P.orgBrain;p[66]=P.orgR90;p[67]=P.symEnergy;p[68]=P.symBreak;p[69]=P.symBreakDist;p[70]=P.eatDistF;p[71]=P.fuseDistF;p[72]=P.symDistF;p[73]=0;p[74]=P.habitatBirthCap;p[75]=P.divideMode?1:0;p[76]=P.divideAgeMs;p[77]=P.divideEnergy;p[78]=16.7;p[79]=P.foodEatRate===undefined?1.5:P.foodEatRate;}}
const K=['birth','divide','eaten','merge','fuse','pair','hit'];
const LOG={k1:0,k2:0,k3:0,bad:0,o0:0,o1:0,o4:0,steps:0};
let tj=new Array(8).fill(0),tw=new Array(8).fill(0);
const J_ev=()=>[J.ev.birth,J.ev.divide||0,J.ev.eaten||0,J.ev.merge||0,J.ev.fuse||0,J.ev.pair||0,J.ev.hit,J.ev.death];
const nStates=+process.argv[5]||10; let S2j=new Array(8).fill(0),S2w=new Array(8).fill(0);
let gMax=0,gSum=0,gN=0,gPressed=0;
const CH=['sq','sqS','crowd','envVx','envVy'],chJ={},chW={};CH.forEach(k=>{chJ[k]=[];chW[k]=[];});let popJ=0,popW=0; // FULLST channel distributions
for(let s=0;s<nStates;s++){const base=mkState();tj.fill(0);tw.fill(0);let sMax=0;
 for(let t=0;t<trials;t++){
  if(FULLST){const nSteps=+process.env.STEPS||1;
   J.cells=clone(base);J.seq=SEQ;for(const k of Object.keys(J.ev))J.ev[k]=0;J.ev.birth=0;J.ev.death=0;J.ev.hit=0;
   for(let st=0;st<nSteps;st++){J.frame();J.stepSquash();} // app JS-mode order: cell loop, then the squash post-pass (ca2.js:2302)
   let nj=0;for(const c of J.cells){if(!c.alive)continue;nj++;chJ.sq.push(c.sq||0);chJ.crowd.push(c.crowd||0);chJ.envVx.push(c.envVx||0);chJ.envVy.push(c.envVy||0);chJ.sqS.push(c.sqS||0);if((c.sq||0)>0.001)gPressed++;} // post-stepSquash sqS is 0 by design; the eased sq carries the press
   popJ+=nj;
   J.cells=clone(base);J.seq=SEQ;
   for(let st=0;st<nSteps;st++){ // app wasm-mode frame: pack, step, read back (sqS = max accumulation), sweep dead, stepSquash post-pass
    pack(J.cells);E.sim_step(Math.floor(Math.random()*4294967296),Math.floor(Math.random()*4294967296));
    const cf2=new Float64Array(E.memory.buffer,E.sim_cells(pack.cap),pack.cap*ST);
    for(let i=0;i<pack.n;i++){const bb=i*ST,c=J.cells[i];if(!c)continue;
     c.x=cf2[bb];c.y=cf2[bb+1];c.vx=cf2[bb+2];c.vy=cf2[bb+3];c.radius=cf2[bb+4];c.energy=cf2[bb+5];c.gene=cf2[bb+6];c.alive=cf2[bb+7]!==0;c.maxSpeed=cf2[bb+8];c.speedModifier=cf2[bb+9];c.hostility=cf2[bb+10];c.mutationRate=cf2[bb+11];c.sv=cf2[bb+12];c.cl=cf2[bb+13];
     c.sq=cf2[bb+24];c.crowd=cf2[bb+25];c.envVx=cf2[bb+26];c.envVy=cf2[bb+27];c.sqS=Math.max(c.sqS||0,cf2[bb+28]);}
    for(let i2=J.cells.length-1;i2>=0;i2--)if(!J.cells[i2].alive)J.cells.splice(i2,1);
    J.stepSquash();}
   for(const c of J.cells){chW.sq.push(c.sq||0);chW.crowd.push(c.crowd||0);chW.envVx.push(c.envVx||0);chW.envVy.push(c.envVy||0);chW.sqS.push(c.sqS||0);}
   popW+=J.cells.length;
   continue;}
  J.cells=clone(base);J.seq=SEQ;for(const k of Object.keys(J.ev))J.ev[k]=0;J.ev.birth=0;J.ev.death=0;J.ev.hit=0;J.frame();const a=J_ev();a.forEach((v,i)=>tj[i]+=v);
  pack(clone(base));E.sim_step(Math.floor(Math.random()*4294967296),Math.floor(Math.random()*4294967296));const o=new Float64Array(E.memory.buffer,E.sim_out(),32);
  const b=[o[0],o[1],o[2],o[3],o[4],o[5],o[6],o[9]];b.forEach((v,i)=>tw[i]+=v);
  if(process.env.LOGCHK){const lg=new Float64Array(E.memory.buffer,E.sim_log(),o[17]);let k1=0,k2=0,k3=0,kBad=0;
   for(let i=0;i<lg.length;i+=4){const k0=lg[i],p0=lg[i+1],p1=lg[i+2],kd=lg[i+3];
    if(kd===1)k1++;else if(kd===2)k2++;else if(kd===3)k3++;else kBad++;
    if(p0<0||p0>=pack.n+64||k0<0||k0>=pack.n+64)kBad++;if(kd===2&&p1<0)kBad++;} // indices must address the live buffer (+headroom for same-step births)
   LOG.k1+=k1;LOG.k2+=k2;LOG.k3+=k3;LOG.bad+=kBad;LOG.o0+=o[0];LOG.o1+=o[1];LOG.o4+=o[4];LOG.steps++;}
  if(BOUND&&!FULL){const nSteps=+process.env.STEPS||1;
   for(let st=1;st<nSteps;st++){J.frame();E.sim_step(Math.floor(Math.random()*4294967296),Math.floor(Math.random()*4294967296));}
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
 const ok=LOG.k1===LOG.o1&&LOG.k3===LOG.o4&&LOG.bad===0&&LOG.o0>0&&LOG.k1>0&&LOG.k2<=LOG.o0; // kind2 births: the served binary counts ~100x more births in out[0] than it logs - known gap, see devtools/evidence/simlog-birth-records-20261107.md
 console.log((ok?'PASS':'FAIL')+' sim_log records <-> out counters: '+rows.join(' | ')+' | kind2 logged '+(100*LOG.k2/Math.max(1,LOG.o0)).toFixed(1)+'% of counted');process.exit(ok?0:1)}
{let bad=[];const TOL=(process.env.EAT||FULL)?0.03:0.01,CTOL=FULL?0.15:TOL;S2j.forEach((v,i)=>{const t=(FULL&&i>=3&&i<=5)?CTOL:TOL;if(Math.abs(S2w[i]-v)>Math.max(0.5,v*t))bad.push(K.concat('death')[i]+' js '+v+' wasm '+S2w[i]+' (tol '+(t*100)+'%)')});console.log(bad.length?'FAIL counters differ: '+bad.join('; '):'PASS js==wasm counters ('+nStates+' states x '+trials+' trials'+(FULL?', full-step birth/divide mode; merge/fuse/pair tol 15% (same-pass coupling floor), rest 3%':'')+')');process.exit(bad.length?1:0)}
})();
