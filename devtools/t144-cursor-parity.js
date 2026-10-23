// t144-cursor-parity: cursor ecology (owner 23 Oct) - cell cursor-unease flee + parasite cursor-mistake/return.
// Real ca2.js source extracted, no re-implementation. Rust RNG (xoroshiro128+) mirrored in JS via BigInt, so the JS
// fallback and the wasm step see identical random values; draw counts must match exactly, positions to 1e-6
// (std Math.sin/cos vs V8 inside the pre-existing rand2d/organic are ulp-level, reported not asserted).
// Part A: update() vs sim_step (flee on/off, cursor near/far). Part B: stepParasitesCore fallback vs pa_run
// (belief, expiry, return-to-plate, illusion break). Part C: new-code-switched-off vs the pre-change base source
// (Object.is - the old behavior is bit-untouched). Part D: scripted behavioral assertions (flee direction, no
// teleport, belief window, boundary return). Usage: node t144-cursor-parity.js [wasm]
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
const base=fs.readFileSync('/tmp/ca2-base.js','utf8');
function fnFrom(S,name){const i=S.indexOf('function '+name+'(');if(i<0)throw new Error('no fn '+name);let j=S.indexOf('{',i),d=0,k=j;for(;k<S.length;k++){if(S[k]=='{')d++;else if(S[k]=='}'){d--;if(!d)break;}}return S.slice(i,k+1);}
const fn=n=>fnFrom(src,n),fnb=n=>fnFrom(base,n);
// ---- xoroshiro128+ mirror of sim.rs r01 / parasites.rs r01 (u64 via BigInt) ----
const M64=(1n<<64n)-1n;
function XR(){let s0=0n,s1=0n;
 return {seed(a,b){s0=(BigInt(a>>>0)<<32n)|0x9E3779B9n;s1=(BigInt(b>>>0)<<32n)|0x85EBCA6Bn;},
  warm(k){for(let i=0;i<k;i++)this.r();},
  r(){let x=s0,y=s1;s0=y;x^=(x<<23n)&M64;s1=(x^y^(x>>17n)^(y>>26n))&M64;const z=(s1+y)&M64;return Number(z>>11n)*(1/9007199254740992);}};}
function mkMath(xr){const M=Object.create(Math);M.random=()=>xr.r();M._n=0;const r0=M.random;M.random=()=>{M._n++;return r0();};return M;}
// ---- build an update() sandbox from real source ----
function buildUpdater(S,mathX,envX){
 const code=['rand2D','misfit','limit','organic','update','keepIn','wallPull'].map(n=>fnFrom(S,n)).join('\n');
 const f=new Function('env',`with(env){var rnd=env.rnd,lerp=env.lerp,clamp=env.clamp,Math=env.Math;${code};return {update:update};}`);
 return f(envX);
}
function mkEnv(mathX){
 return {Math:mathX,rnd:(a,b)=>{if(b===undefined){b=a;a=0;}return a+mathX.random()*(b-a);},lerp:(a,b,t)=>a+(b-a)*t,clamp:(v,l,h)=>v<l?l:v>h?h:v,
  P:null,mouse:{x:0,y:0,over:false},fleeT:0,resizeDrag:false,cmean:{},food:[],cells:[],cont:{x:100,y:100,w:600,h:400},frameT:0,frameDtf:16,ev:{},habAte:()=>{},divide:()=>{throw new Error('divide off');}};}
const CELLSTUB=i=>({x:400,y:300,vx:0.3,vy:-0.2,radius:20,energy:50,gene:3,alive:true,maxSpeed:2,speedModifier:1,hostility:0.5,mutationRate:9.5,sv:0.37*i+0.1,cl:0,sym:null,g:{spd:1,app:0.5,bnd:1,col:[0.3,0.4,0.5]},comp:0,shp:null,bornAt:0});
const PBASE={interactionRadius:12,slowDownRadius:9,speedReductionFactor:37.5,baseMaxSpeed:2,maxSpeedVariation:30,energyConsumptionRate:0.058,selectOn:0,genomeOn:1,selStrength:4,eatMergeOn:0,clusterCohesion:0.35,symbiosisOn:0,foodEatR:9,foodEnergyValue:20,foodGrow:0,foodGrowAmt:5,CELL_RADIUS:34.5,foodGrowMax:8,divideOn:0,divideAt:3,UNIVERSE_SIZE:56,foodShrink:0.1,boundAware:1,boundZone:20,boundForce:3,restless:3,eatRatio:3,eatChance:1,mergeGene:8,mergeChance:0.03,symbiogenesisOn:0,energyGainFromInteraction:0.004,GENE_MIN:-18,GENE_MAX:18,minEnergyForReproduction:2.5,clusterMax:10,genomeMut:0.5,mutationRateRange:2.6,metaballStrength:0.024,crowdTol:0.5,orgLifeDie:-0.005,orgLifeGrow:1.0025,orgBirth:1.005,orgDead:-0.0025,orgBrain:0.008,orgR90:0.0025,symEnergy:0.00075,symBreak:0.0002,symBreakDist:3,eatDistF:0.85,fuseDistF:0.6,symDistF:1.1,habitatOn:0,habitatBirthCap:2,divideMode:0,divideAgeMs:20000,divideEnergy:40,foodEatRate:1.5,boundGap:0,reproMinAgeMs:5000,reproChance:0.02,cursorFleeOn:1,cursorFleeR:90,cursorFleePush:0.15,cursorFleeWob:0.9,cursorFleeJit:0.6,cursorFleeDamp:0.05};
(async()=>{
const E=(await WebAssembly.instantiate(fs.readFileSync(path.join(__dirname,'..',process.argv[2]||'ca2core.wasm')),{})).instance.exports;
let bad=0;const out={};
// ---------- Part A: update() vs sim_step ----------
{
 const xr=XR(),mJ=mkMath(xr),env=mkEnv(mJ),U=buildUpdater(src,mJ,env);
 const cap=4;E.sim_cells(cap);E.sim_food(1);E.sim_cm(1);
 let maxD=0,cntMis=0,frames=0,gframe=0;
 for(let t=0;t<400;t++){
  const S0=(1234567+t*7919)>>>0,S1=(7654321+t*104729)>>>0;
  const P=Object.assign({},PBASE,{cursorFleeOn:t%5===4?0:1,cursorFleeR:40+((t*37)%120),cursorFleeWob:(t%7)*0.45});
  const c=CELLSTUB(t);c.x=200+((t*53)%400);c.y=150+((t*97)%300);c.vx=((t*13)%10-5)*0.4;c.vy=((t*17)%10-5)*0.4;
  env.P=P;env.cells=[c];env.mouse={x:150+((t*211)%500),y:120+((t*163)%360),over:t%6!==5};
  const cj=JSON.parse(JSON.stringify(c));env.cells=[cj];
  // wasm pack
  const cp=E.sim_cells(cap),pp=E.sim_params();let cf=new Float64Array(E.memory.buffer,cp,cap*24),p=new Float64Array(E.memory.buffer,pp,96);
  cf.fill(0);cf[0]=c.x;cf[1]=c.y;cf[2]=c.vx;cf[3]=c.vy;cf[4]=c.radius;cf[5]=c.energy;cf[6]=c.gene;cf[7]=1;cf[8]=c.maxSpeed;cf[9]=c.speedModifier;cf[10]=c.hostility;cf[11]=c.mutationRate;cf[12]=c.sv;cf[13]=0;cf[14]=-1;cf[15]=1;cf[16]=0.5;cf[17]=1;cf[18]=0.3;cf[19]=0.4;cf[20]=0.5;cf[21]=0;cf[22]=0;cf[23]=1000;
  const map=[[0,'interactionRadius'],[1,'slowDownRadius'],[2,'speedReductionFactor'],[3,'baseMaxSpeed'],[4,'maxSpeedVariation'],[5,'energyConsumptionRate'],[8,'selStrength'],[10,'clusterCohesion'],[12,'foodEatR'],[13,'foodEnergyValue'],[15,'foodGrowAmt'],[16,'CELL_RADIUS'],[17,'foodGrowMax'],[20,'UNIVERSE_SIZE'],[21,'foodShrink'],[23,'boundZone'],[24,'boundForce'],[25,'restless'],[26,'eatRatio'],[27,'eatChance'],[28,'mergeGene'],[29,'mergeChance'],[31,'energyGainFromInteraction'],[32,'GENE_MIN'],[33,'GENE_MAX'],[34,'minEnergyForReproduction'],[35,'clusterMax'],[36,'genomeMut'],[37,'mutationRateRange'],[38,'metaballStrength'],[57,'boundGap'],[58,'reproMinAgeMs'],[59,'reproChance'],[60,'crowdTol'],[61,'orgLifeDie'],[62,'orgLifeGrow'],[63,'orgBirth'],[64,'orgDead'],[65,'orgBrain'],[66,'orgR90'],[67,'symEnergy'],[68,'symBreak'],[69,'symBreakDist'],[70,'eatDistF'],[71,'fuseDistF'],[72,'symDistF'],[74,'habitatBirthCap'],[76,'divideAgeMs'],[77,'divideEnergy'],[79,'foodEatRate'],[83,'cursorFleeR'],[84,'cursorFleePush'],[85,'cursorFleeWob'],[86,'cursorFleeJit'],[87,'cursorFleeDamp']];
  p.fill(0);for(const [i,k] of map)p[i]=P[k];p[6]=0;p[7]=1;p[9]=0;p[11]=0;p[14]=0;p[18]=0;p[22]=1;p[30]=0;p[39]=1;p[40]=0.5;p[41]=1;p[42]=0;p[46]=env.mouse.x;p[47]=env.mouse.y;p[48]=env.mouse.over?1:0;p[49]=100;p[50]=100;p[51]=600;p[52]=400;p[53]=0;p[54]=0;p[73]=0;p[75]=0;p[78]=16;p[80]=0;p[82]=P.cursorFleeOn;
  E.sim_set_n(1);E.sim_set_nf(0);E.sim_cm_count(0);
  // JS step: N frames of real update(); wasm: N sim_steps. 3 frames per scenario.
  let n0=mJ._n;
  for(let fr=0;fr<3;fr++){
   gframe++;env.fleeT=gframe*16;p[46]=env.mouse.x;p[47]=env.mouse.y;
   // reseed both RNGs identically per frame (sim_step reseeds per call)
   xr.seed(S0+fr,S1+fr);
   U.update(cj);
   E.sim_step(S0+fr,S1+fr);
   let cg=new Float64Array(E.memory.buffer,cp,cap*24);
   const dx=Math.abs(cj.x-cg[0]),dy=Math.abs(cj.y-cg[1]),dvx=Math.abs(cj.vx-cg[2]),dvy=Math.abs(cj.vy-cg[3]);
   const d=Math.max(dx,dy,dvx,dvy);if(d>maxD)maxD=d;
   frames++;if(d>1e-6){cntMis++;if(cntMis<4)console.log('A MISMATCH',t,fr,d,cj.x,cj.y,cg[0],cg[1]);}
  }
 }
 out.A={frames,maxAbsDiff:maxD,over1e6:cntMis};if(cntMis)bad++;
}
// ---------- Part B: stepParasitesW/pa_run vs stepParasitesCore fallback ----------
// pa_run runs the exact JS array algorithm (coordinator ruling 19:07: descending index, in-place
// splice/push, newborn pushed before the loop and processed first, live-length birth gate). B1: one drawing
// (hostless) parasite per frame; B2: several drawers incl. births/deaths/spawns - both must match every
// field every frame. (Draw counts on the wasm side are internal; exact state equality over thousands of
// frames across every branch is the stream-alignment proof.)
{
 const paCode=fn('stepParasitesW')+'\n'+fn('stepParasitesCore');
 const build=(useW,mathX)=>{const env={P:null,cells:null,parasites:null,ev:{},parStat:{rehost:0},mouse:{x:0,y:0,over:false},cont:{x:100,y:100,w:600,h:400},WC:useW?{e:E,mem:E.memory,ok:true}:{},location:{search:''},performance:{now:()=>env._now},Math:mathX,clamp:(v,l,h)=>v<l?l:v>h?h:v,lerp:(a,b,t2)=>a+(b-a)*t2,_now:0};
  const f=new Function('env',`with(env){var Math=env.Math,performance=env.performance,clamp=env.clamp,lerp=env.lerp,location=env.location,WC=env.WC,mouse=env.mouse,cont=env.cont;${paCode};return function(){if(!stepParasitesW())stepParasitesCore();};}`)(env);return {env,f};};
 // wasm path: the only JS-side draws of a frame are the two pa_run seed draws - pin them to the frame's
 // (S0,S1) so pa_run's internal stream equals the fallback's mirrored stream (xoshiro128+ plus 8 warmups)
 function mkSeededMath(xr){const M=Object.create(Math);M._n=0;M._seeds=null;M.random=()=>{M._n++;if(M._seeds&&M._n<=2)return M._seeds[M._n-1]/4294967296;return xr.r();};return M;}
 const xr=XR(),mJ=mkMath(xr),mW=mkSeededMath(xr);
 const J=build(false,mJ),W=build(true,mW);
 function scenario(t){
  const P={parasiteOn:1,parasiteFrac:0.3,parasiteSight:4000,parasiteNerv:0.6,parasiteDrain:0.02,parasiteEff:0.8,parasiteHard:12,parasiteHardMs:20000,CELL_RADIUS:34.5,parasiteCursorOn:t%7!==6?1:0,parasiteCursorMs:80+(t%5)*40,parasiteCursorR:150+(t%4)*60,parasiteCursorRetK:1.2,parasiteCursorCooldown:600+(t%4)*400};
  const cells=[];const nc=1+(t%4);for(let i=0;i<nc;i++)cells.push({x:150+((t*61+i*137)%500),y:150+((t*47+i*89)%300),radius:20,cl:i%3===0?7:0,alive:true,energy:30,pc:0});
  const now0=1000+t*1000;
  const sub={x:120+((t*83)%560),y:120+((t*59)%360),e:5,host:null,a:(t*1.3)%6.28,ph:t%11===0?0:0.5+t*0.01,lost:0};
  const kind=t%6;
  if(kind===1)sub.a=-(now0-30)-1e9; // mid-belief, expires mid-scenario
  if(kind===2){sub.a=-(now0-10000)-1e9;sub.x=60;sub.y=70;} // long expired: return drift (starts outside plate)
  if(kind===3){sub.a=-(now0-10000)-1e9;sub.x=200;sub.y=200;} // expired, already inside: clears at once
  if(kind===4){cells[cells.length-1].alive=false;sub.host=cells[cells.length-1];sub.a=2.2;} // host dead: orphaned this frame
  if(kind===5){sub.x=650;sub.y=430;} // far corner, usually outside cursor range
  const par=[sub];
  const aliveC=cells.filter(c=>c.alive);const nk=Math.min(t%3,aliveC.length);for(let i=0;i<nk;i++)par.push({x:aliveC[i].x+3,y:aliveC[i].y-2,e:6,host:aliveC[i],a:1+i,ph:0.4+i,lost:0}); // hosted companions draw nothing
  const mouse={x:sub.x+((t*37)%260)-130,y:sub.y+((t*53)%260)-130,over:t%6!==5};
  return {P,cells,par,mouse,now0};
 }
 function cmp(tag,t,fr){
  const aj=J.env.parasites,aw=W.env.parasites;
  if(aj.length!==aw.length)return 'len '+aj.length+'/'+aw.length;
  for(let i=0;i<aj.length;i++){const a=aj[i],b=aw[i];
   const d=Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.e-b.e));
   if(d>1e-6)return 'pos '+i+' d='+d.toExponential(2)+' '+a.x.toFixed(6)+'/'+b.x.toFixed(6);
   const am=a.a<=-1e9,bm=b.a<=-1e9;
   if(am!==bm||(am&&!Object.is(a.a,b.a)))return 'marker '+i+' '+a.a+'/'+b.a;
   if(!am&&Math.abs(a.a-b.a)>1e-6)return 'a '+i+' '+a.a+'/'+b.a;
   if(!Object.is(a.ph||0,b.ph||0))return 'ph '+i+' '+a.ph+'/'+b.ph;
   if(!Object.is(a.lost||0,b.lost||0))return 'lost '+i+' '+a.lost+'/'+b.lost;
   const ha=a.host?J.env.cells.indexOf(a.host):-1,hb=b.host?W.env.cells.indexOf(b.host):-1;
   if(ha!==hb)return 'host '+i+' '+ha+'/'+hb;}
  for(let i=0;i<J.env.cells.length;i++)if(Math.abs(J.env.cells[i].energy-W.env.cells[i].energy)>1e-6)return 'energy '+i;
  if((J.env.ev.pbirth||0)!==(W.env.ev.pbirth||0))return 'pbirth';
  if((J.env.ev.pdeath||0)!==(W.env.ev.pdeath||0))return 'pdeath';
  return null;
 }
 // B1: single drawer per frame
 let maxD=0,posMis=0,frames=0;
 for(let t=0;t<250;t++){
  const S0=(24601+t*7919)>>>0,S1=(97531+t*104729)>>>0;
  const sc=scenario(t);
  const cloneCells=a=>a.map(c=>Object.assign({},c,{pc:0}));
  const cj=cloneCells(sc.cells),cw=cloneCells(sc.cells);
  const pj=sc.par.map(q=>Object.assign({},q)),pw=sc.par.map(q=>Object.assign({},q));
  for(let i=1;i<sc.par.length;i++){if(sc.par[i].host){const h=sc.par[i].host;pj[i].host=cj[sc.cells.indexOf(h)];pw[i].host=cw[sc.cells.indexOf(h)];}}
  if(sc.par[0].host){const h=sc.par[0].host;pj[0].host=cj[sc.cells.indexOf(h)];pw[0].host=cw[sc.cells.indexOf(h)];}
  J.env.P=sc.P;W.env.P=sc.P;J.env.cells=cj;W.env.cells=cw;J.env.parasites=pj;W.env.parasites=pw;
  J.env.mouse=W.env.mouse=Object.assign({},sc.mouse);
  for(let fr=0;fr<6;fr++){
   const now=sc.now0+fr*16;J.env._now=now;W.env._now=now;
   xr.seed(S0+fr,S1+fr);xr.warm(8);mJ._n=0;J.f();
   mW._n=0;mW._seeds=[S0+fr,S1+fr];W.f();
   frames++;
   const err=cmp('B1',t,fr);
   if(err){posMis++;if(posMis<5)console.log('B1 MISMATCH',t,fr,err);}
  }
 }
 out.B1={frames,mismatches:posMis};if(posMis)bad++;
 // B2: several drawers per frame incl. births, deaths and spawns - exact full-state match expected
 let mis2=0,frames2=0,births0=0,deaths0=0,maxLen=0;
 for(let t=0;t<120;t++){
  const S0=(7777+t*7919)>>>0,S1=(3333+t*104729)>>>0;
  const sc=scenario(t);
  sc.P.parasiteFrac=t%3===0?100:0.3; // huge frac on every third scenario: the spawn roll fires every frame
  const par2=sc.par.map(q=>Object.assign({},q));
  if(t%4===1)par2[0].e=12.5; // birth this frame (halves, appends, not iterated)
  if(t%4===3)par2[0].e=-13;  // death this frame (spliced in place)
  par2.push({x:100+((t*211)%500),y:100+((t*151)%300),e:5,host:null,a:0.9,ph:1.1,lost:0}); // second drawer
  const cloneCells=a=>a.map(c=>Object.assign({},c,{pc:0}));
  const cj=cloneCells(sc.cells),cw=cloneCells(sc.cells);
  const pj=par2.map(q=>Object.assign({},q)),pw=par2.map(q=>Object.assign({},q));
  for(let i=0;i<par2.length;i++)if(par2[i].host){pj[i].host=cj[sc.cells.indexOf(par2[i].host)];pw[i].host=cw[sc.cells.indexOf(par2[i].host)];}
  J.env.P=sc.P;W.env.P=sc.P;J.env.cells=cj;W.env.cells=cw;J.env.parasites=pj;W.env.parasites=pw;
  J.env.mouse=W.env.mouse=Object.assign({},sc.mouse);
  for(let fr=0;fr<3;fr++){
   const now=sc.now0+fr*16;J.env._now=now;W.env._now=now;
   xr.seed(S0+fr,S1+fr);xr.warm(8);mJ._n=0;J.f();
   mW._n=0;mW._seeds=[S0+fr,S1+fr];W.f();
   frames2++;maxLen=Math.max(maxLen,J.env.parasites.length);
   const err=cmp('B2',t,fr);
   if(err){mis2++;if(mis2<5)console.log('B2 MISMATCH',t,fr,err);}
  }
 }
 births0=J.env.ev.pbirth||0;deaths0=J.env.ev.pdeath||0;
 out.B2={frames:frames2,mismatches:mis2,birthsSeen:births0,deathsSeen:deaths0,maxLen};
 if(mis2||!births0||!deaths0)bad++; // zero mismatches AND the birth/death paths provably exercised
}

// ---------- Part C: switched-off == pre-change base (Object.is) ----------
{
 const xr=XR(),mN=mkMath(xr),mO=mkMath(xr);
 const envN=mkEnv(mN),envO=mkEnv(mO);
 const UN=buildUpdater(src,mN,envN),UO=buildUpdater(base,mO,envO);
 let mis=0,frames=0;
 for(let t=0;t<150;t++){
  const P=Object.assign({},PBASE,{cursorFleeOn:0}); // new behavior off
  const c=CELLSTUB(t);c.x=200+((t*53)%400);c.y=150+((t*97)%300);
  envN.P=P;envO.P=P;envN.cells=[c];envO.cells=[JSON.parse(JSON.stringify(c))];
  envN.fleeT=envO.fleeT=t*16;envN.mouse=envO.mouse={x:150+((t*211)%500),y:130,over:true};
  const co=envO.cells[0];
  for(let fr=0;fr<3;fr++){xr.seed(1000+t+fr,2000+t+fr);UN.update(c);xr.seed(1000+t+fr,2000+t+fr);UO.update(co);frames++;
   if(!Object.is(c.x,co.x)||!Object.is(c.y,co.y)||!Object.is(c.vx,co.vx)||!Object.is(c.vy,co.vy)||!Object.is(c.energy,co.energy)){mis++;if(mis<4)console.log('C CELL',t,fr,c.x,co.x,c.vx,co.vx);}}
 }
 // parasites fallback: old body vs new body, parasiteCursorOn:0
 const paN=fn('stepParasitesW')+'\n'+fn('stepParasitesCore'),paO=fnb('stepParasitesW')+'\n'+fnb('stepParasitesCore');
 const buildPa=(code,mathX)=>{const env={P:null,cells:null,parasites:null,ev:{},parStat:{rehost:0},mouse:{x:0,y:0,over:true},cont:{x:100,y:100,w:600,h:400},WC:{},location:{search:''},performance:{now:()=>env._now},Math:mathX,clamp:(v,l,h)=>v<l?l:v>h?h:v,lerp:(a,b,t2)=>a+(b-a)*t2,_now:0};
  return {env,f:new Function('env',`with(env){var Math=env.Math,performance=env.performance,clamp=env.clamp,lerp=env.lerp,location=env.location,WC=env.WC,mouse=env.mouse,cont=env.cont;${code};return stepParasitesCore;}`)(env)};};
 const mN2=mkMath(xr),mO2=mkMath(xr),JN=buildPa(paN,mN2),JO=buildPa(paO,mO2);
 let pmis=0,pframes=0;
 for(let t=0;t<150;t++){
  const P={parasiteOn:1,parasiteFrac:0.3,parasiteSight:4000,parasiteNerv:0.6,parasiteDrain:0.02,parasiteEff:0.8,parasiteHard:12,parasiteHardMs:20000,CELL_RADIUS:34.5,parasiteCursorOn:0,parasiteCursorMs:2500,parasiteCursorR:250,parasiteCursorRetK:1.2};
  const cells=[];for(let i=0;i<3;i++)cells.push({x:150+i*100,y:200,radius:20,cl:0,alive:true,energy:30,pc:0});
  const par=[{x:300,y:250,e:5,host:null,a:1.1,ph:0.5,lost:0},{x:500,y:150,e:7,host:null,a:2.2,ph:0,lost:0}];
  JN.env.P=JO.env.P=P;JN.env._now=JO.env._now=1000+t*37;
  JN.env.cells=cells.map(c=>Object.assign({},c));JO.env.cells=cells.map(c=>Object.assign({},c));
  JN.env.parasites=par.map(q=>Object.assign({},q));JO.env.parasites=par.map(q=>Object.assign({},q));
  JN.env.mouse=JO.env.mouse={x:130+((t*149)%540),y:200,over:true};
  xr.seed(555+t,777+t);JN.f();xr.seed(555+t,777+t);JO.f();pframes++;
  for(let i=0;i<2;i++){const a=JN.env.parasites[i],b=JO.env.parasites[i];if(!a||!b||!Object.is(a.x,b.x)||!Object.is(a.y,b.y)||!Object.is(a.e,b.e)||!Object.is(a.a,b.a)){pmis++;if(pmis<4)console.log('C PAR',t,i,a&&a.x,b&&b.x,a&&a.a,b&&b.a);}}
 }
 out.C={cellFrames:frames,cellMis:mis,parFrames:pframes,parMis:pmis};if(mis||pmis)bad++;
}
// ---------- Part D: scripted behavior (JS fallback) ----------
{
 // D1 cell flee: cursor on the cell, flee on - net displacement away, per-frame step bounded (no teleport)
 const xr=XR(),mJ=mkMath(xr),env=mkEnv(mJ),U=buildUpdater(src,mJ,env);
 env.P=Object.assign({},PBASE);env.mouse={x:400,y:300,over:true};
 const c=CELLSTUB(1);c.x=410;c.y=305;env.cells=[c];
 let x0=c.x,y0=c.y,maxStep=0;
 for(let fr=0;fr<60;fr++){env.fleeT=fr*16;xr.seed(42+fr,43+fr);const px=c.x,py=c.y;U.update(c);maxStep=Math.max(maxStep,Math.hypot(c.x-px,c.y-py));}
 const away=Math.hypot(c.x-400,c.y-300)-Math.hypot(x0-400,y0-300);
 out.D1={awayGain:+away.toFixed(2),maxStep:+maxStep.toFixed(3),ok:away>2&&maxStep<6};if(!out.D1.ok)bad++;
 // D2 parasite belief + return: parasite outside plate, cursor outside too
 const paCode=fn('stepParasitesW')+'\n'+fn('stepParasitesCore');
 const xr2=XR(),m2=mkMath(xr2);
 const env2={P:null,cells:[],parasites:null,ev:{},parStat:{rehost:0},mouse:{x:60,y:60,over:true},cont:{x:100,y:100,w:600,h:400},WC:{},location:{search:''},performance:{now:()=>env2._now},Math:m2,clamp:(v,l,h)=>v<l?l:v>h?h:v,lerp:(a,b,t2)=>a+(b-a)*t2,_now:0};
 const step=new Function('env',`with(env){var Math=env.Math,performance=env.performance,clamp=env.clamp,lerp=env.lerp,location=env.location,WC=env.WC,mouse=env.mouse,cont=env.cont;${paCode};return stepParasitesCore;}`)(env2);
 env2.P={parasiteOn:1,parasiteFrac:0,parasiteSight:4000,parasiteNerv:0.6,parasiteDrain:0.02,parasiteEff:0.8,parasiteHard:12,parasiteHardMs:20000,CELL_RADIUS:34.5,parasiteCursorOn:1,parasiteCursorMs:500,parasiteCursorR:250,parasiteCursorRetK:1.2,parasiteCursorCooldown:2000};
 env2.cells=[{x:600,y:450,radius:20,cl:0,alive:true,energy:30,pc:0}]; // real cell far from the cursor
 env2.parasites=[{x:80,y:70,e:5,host:null,a:1.0,ph:0.5,lost:0}];
 const q=env2.parasites[0];let believed=false,returned=false,cleared=false,coolSeen=false,earlyRe=false,clearAt=null;
 const dCur=()=>Math.hypot(q.x-60,q.y-60),dPlate=()=>{const tx=Math.max(100,Math.min(700,q.x)),ty=Math.max(100,Math.min(500,q.y));return Math.hypot(tx-q.x,ty-q.y);};
 const inBel=()=>q.a<=-1e9&&q.a>-2e9,inCool=()=>q.a<=-2e9;
 let d0=dCur(),dMin=1e9,dRetStart=null,dRetMin=1e9;
 for(let fr=0;fr<400;fr++){env2._now=1000+fr*16;xr2.seed(9+fr,10+fr);step();
  if(inBel()){if(clearAt!==null&&env2._now-clearAt<2000)earlyRe=true;believed=true;
   if(env2._now-(-q.a-1e9)<500)dMin=Math.min(dMin,dCur()); // belief window: closing on the cursor
   else {if(dRetStart===null)dRetStart=dPlate();dRetMin=Math.min(dRetMin,dPlate());} // gave up: heading back
  }else{
   if(inCool())coolSeen=true;
   if(believed&&clearAt===null)clearAt=env2._now;
   if(believed&&dRetStart!==null){if(dRetMin<dRetStart-5)returned=true;dRetStart=null;dRetMin=1e9;if(q.x>100&&q.x<700&&q.y>100&&q.y<500)cleared=true;}
  }
 }
 out.D2={believed,chaseCloser:dMin<d0,returned,cooldownSeen:coolSeen,noEarlyRebelief:!earlyRe,clearedInside:cleared,a:q.a,x:+q.x.toFixed(1),y:+q.y.toFixed(1)};
 if(!(believed&&dMin<d0&&returned&&coolSeen&&!earlyRe))bad++;
 // D3 illusion break: real cell nearer than the cursor (but outside attach range) ends the belief -> cooldown
 env2.parasites=[{x:300,y:250,e:5,host:null,a:-1e9-1000,ph:0.5,lost:0}];
 env2.cells=[{x:360,y:280,radius:20,cl:0,alive:true,energy:30,pc:0}];env2.mouse={x:600,y:60,over:true};env2._now=5000;
 xr2.seed(1,2);step();
 const a3=env2.parasites[0].a;out.D3={beliefCleared:!(a3<=-1e9&&a3>-2e9),cooldownSet:a3<=-2e9};if(!out.D3.beliefCleared||!out.D3.cooldownSet)bad++;
}
// ---------- Part E: glyph-circle overlay x cursor belief (production order: core then overlay) ----------
{
 const paCode=fn('stepParasitesW')+'\n'+fn('stepParasitesCore');
 const circCode=src.slice(src.indexOf('  function circleInPlate'),src.indexOf('  function stepParasites() {'));
 const buildE=()=>{const xr3=XR(),m3=mkMath(xr3);
  const env={P:{parasiteOn:1,showHud:1,titleCircles:1,parasiteSight:4000,parasiteNerv:0.6,CELL_RADIUS:34.5,parasiteFrac:0,parasiteDrain:0.02,parasiteEff:0.8,parasiteHard:12,parasiteHardMs:20000,parasiteCursorOn:1,parasiteCursorMs:300,parasiteCursorR:250,parasiteCursorRetK:1.2,parasiteCursorCooldown:2000},
   cells:[{x:500,y:400,radius:20,cl:0,alive:true,energy:30,pc:0}],parasites:[{x:180,y:160,e:5,host:null,a:-1e9-1000,ph:0.5,lost:0}],
   circlesNow:[{key:'g',x:120,y:150,r:30}],ev:{},parStat:{rehost:0},mouse:{x:150,y:140,over:true},cont:{x:100,y:100,w:600,h:400},WC:{},location:{search:''},performance:{now:()=>env._now},Math:m3,clamp:(v,l,h)=>v<l?l:v>h?h:v,lerp:(a,b,t2)=>a+(b-a)*t2,_now:1000};
  const f=new Function('env',`with(env){var Math=env.Math,performance=env.performance,clamp=env.clamp,lerp=env.lerp,location=env.location,WC=env.WC,mouse=env.mouse,cont=env.cont;${paCode};${circCode};return {stepParasitesCore,parasiteCircles};}`)(env);
  return {env,f,xr3,m3};};
 const A=buildE(),B=buildE(); // A: production order (core+overlay); B: same pre-core frame state, overlay only
 let circFrames=0,motionMis=0,markerExpired=false,maxSnap=0,prevX=0,prevY=0;
 for(let fr=0;fr<50;fr++){
  const now=1000+fr*16;
  if(fr===40)A.env.circlesNow[0].x=900; // the circle leaves the plate
  A.env._now=now;A.xr3.seed(500+fr,501+fr);A.m3._n=0;A.f.stepParasitesCore();const coreDraws=A.m3._n;
  B.env.parasites=JSON.parse(JSON.stringify(A.env.parasites));B.env.cells=JSON.parse(JSON.stringify(A.env.cells));B.env.circlesNow=JSON.parse(JSON.stringify(A.env.circlesNow));B.env._now=now; // B starts from A's POST-core state
  A.f.parasiteCircles();
  B.xr3.seed(500+fr,501+fr);for(let k=0;k<coreDraws;k++)B.m3.random();B.f.parasiteCircles(); // same stream position, overlay only
  const pa=A.env.parasites[0],pb=B.env.parasites[0];
  if(pa.circ){circFrames++;
   if(!Object.is(pa.x,pb.x)||!Object.is(pa.y,pb.y)){motionMis++;if(motionMis<4)console.log('E MOTION',fr,pa.x,pb.x,pa.y,pb.y);} // overlay is a pure function of (state, stream position)
  }
  if(fr>20&&!(pa.a<=-1e9&&pa.a>-2e9))markerExpired=true; // the cursor-belief lifecycle runs on during the circle episode
  if(fr===41)maxSnap=Math.hypot(pa.x-prevX,pa.y-prevY); // first frame after the circle left: no snap back
  prevX=pa.x;prevY=pa.y;
 }
 out.E={circFrames,motionMismatch:motionMis,markerLifecycleContinues:markerExpired,snapAfterCircleExit:+maxSnap.toFixed(2)};
 if(!circFrames||motionMis||!markerExpired||maxSnap>8)bad++;
}
// ---------- Part F: cursor keys survive the REAL preset save()/load() round trip ----------
{
 const saveCode=fn('liveMap')+'\n'+fn('save');
 const li=src.indexOf('(function load() {');let lj=src.indexOf('{',li),d=0,lk=lj;for(;lk<src.length;lk++){if(src[lk]=='{')d++;else if(src[lk]=='}'){d--;if(!d)break;}}
 const loadCode=src.slice(li,lk+1)+')();';
 const store={};const ls={getItem:k=>(k in store)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
 const CURKEYS=['cursorFleeOn','cursorFleeR','cursorFleePush','cursorFleeWob','cursorFleeJit','cursorFleeDamp','parasiteCursorOn','parasiteCursorMs','parasiteCursorR','parasiteCursorRetK','parasiteCursorCooldown'];
 const env={localStorage:ls,STORE:'ca2.test',STORE_V:6,P:{foodEatR:9},live:{},savedLive:{},rangeBounds:{},autoRefresh:true,lockParams:false,bgTarget:[0,0,0],bg:[0,0,0],bgIndex:0};
 CURKEYS.forEach((k,i)=>env.P[k]=1000+i);
 const mk=code=>new Function('env',`with(env){var localStorage=env.localStorage,STORE=env.STORE,STORE_V=env.STORE_V,P=env.P,live=env.live,savedLive=env.savedLive,rangeBounds=env.rangeBounds,autoRefresh=env.autoRefresh,lockParams=env.lockParams,bgTarget=env.bgTarget,bg=env.bg,bgIndex=env.bgIndex;${code}}`);
 mk(saveCode+';save();')(env); // the real write path
 CURKEYS.forEach(k=>env.P[k]=-999); // clobber
 mk(loadCode)(env); // the real restore path
 const fMis=CURKEYS.filter((k,i)=>env.P[k]!==1000+i);
 out.F={roundTripOk:CURKEYS.length-fMis.length,of:CURKEYS.length,mismatches:fMis};if(fMis.length)bad++;
}
console.log(JSON.stringify(out,null,1));
process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
