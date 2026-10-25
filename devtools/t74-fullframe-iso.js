// t74: full-frame frozen-input isolation - JS full sim loop vs wasm sim_step (p[56]=0, update included).
// Phase A: exact RNG sync (same xorshift as sim.rs), births disabled; compares per-cell state + event counts.
// Phase B (mode 'B'): births/food enabled, statistical, multi-frame trajectories.
// usage: node devtools/t74-fullframe-iso.js [A trials] | node devtools/t74-fullframe-iso.js B [states] [frames]
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');if(i<0)throw name;let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
function vr(name){const i=src.indexOf('var '+name+' = ');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1)+';';}
const names=['rand2D','normCol','speedOf','mutGenome','mixGenome','newShape','mixShape','mutateGene','Cell','clusterSize','joinCluster','fuseCells','interact','reproduce','checkSurvival','limit','misfit','update','organic','keepIn','divide','wallPull','carrySide','effR'];
const code=`var UI_END=800,CELL_END=1300;
var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var clamp=function(v,a,b){return v<a?a:v>b?b:v;};var lerp=function(a,b,t){return a+(b-a)*t;};var map=function(v,a,b,c,d){return c+(d-c)*(v-a)/(b-a);};
${vr('P')}
P.wallCarry=1;P.wallSpread=0.5;P.wallSmoothMs=60;P.squashMax=0.18;P.squashIn=0.45;P.squashOut=0.08;P.crowdGain=0;P.crowdRel=0;P.crowdSlow=0;P.crowdPush=0;P.habitatOn=0;P.habitatBirthCap=2;P.cellLife=0;P.cellLifeVar=0.3;P.habitatFedDecay=0.2;P.crowdTol=0.5;P.orgLifeDie=-0.005;P.orgLifeGrow=1.0025;P.orgBirth=1.005;P.orgDead=-0.0025;P.orgBrain=0.008;P.orgR90=0.0025;P.symEnergy=0.00075;P.symBreak=0.0002;P.symBreakDist=3;P.eatDistF=0.85;P.fuseDistF=0.6;P.symDistF=1.1;
function habAte(){}function habReap(){}
var cells=[],food=[],ev={birth:0,death:0,hit:0,oob:0},clusterSeq=0,env={spd:1,app:0.5,bnd:1,col:null},cmean={};
var cont={x:0,y:0,w:0,h:0,wvx0:0,wvx1:0,wvy0:0,wvy1:0},mouse={x:-1e9,y:-1e9,over:false},resizeDrag=false;
var frameDtf=16.7; // fixed dt for parity: update() env-decay easing reads it (1:1 sim.rs p[78])
var frameT=0; // stub for the Cell ctor bornAt read (desktop team AGE slot)
function birthCapF(){ if(!P.habitatOn||!(P.habitatBirthCap>0)) return 1; var cap=P.habitatBirthCap*P.UNIVERSE_SIZE; return cells.length>cap?cap/cells.length:1; }
${names.map(fn).join('\n')}
return {P:P,Cell:Cell,get cells(){return cells;},set cells(v){cells=v;},get food(){return food;},set food(v){food=v;},ev:ev,env:env,cmean:cmean,cont:cont,
 get seq(){return clusterSeq;},set seq(v){clusterSeq=v;},
 trace:[],frame:function(){var tr=[];for(var i=cells.length-1;i>=0;i--){var c=cells[i];var n0=Math.random.n||0;update(c);checkSurvival(c);var n1=Math.random.n||0;for(var k=i-1;k>=0;k--)interact(c,cells[k]);var n2=Math.random.n||0;if(P.boundAware&&c.alive)keepIn(c);tr.push([i,n1-n0,n2-n1]);if(!c.alive){ev.death++;cells.splice(i,1);}}this.trace=tr;}};
`;
const J=new Function(code)();
const P=J.P;
// rust rnd01 (xorshift, sim.rs) in BigInt for exact RNG sync
const M64=(1n<<64n)-1n;
function xorSeed(a,b){let s0=(BigInt(a>>>0)<<32n)|0x9E3779B9n,s1=(BigInt(b>>>0)<<32n)|0x85EBCA6Bn;const f=function(){f.n++;let x=s0,y=s1;s0=y;x=(x^(x<<23n))&M64;s1=(x^y^(x>>17n)^(y>>26n))&M64;return Number(((s1+y)&M64)>>11n)/9007199254740992;};f.n=0;return f;}
const PI=['interactionRadius','slowDownRadius','speedReductionFactor','baseMaxSpeed','maxSpeedVariation','energyConsumptionRate','selectOn','genomeOn','selStrength','eatMergeOn','clusterCohesion','symbiosisOn','foodEatR','foodEnergyValue','foodGrow','foodGrowAmt','CELL_RADIUS','foodGrowMax','divideOn','divideAt','UNIVERSE_SIZE','foodShrink','boundAware','boundZone','boundForce','restless','eatRatio','eatChance','mergeGene','mergeChance','symbiogenesisOn','energyGainFromInteraction','GENE_MIN','GENE_MAX','minEnergyForReproduction','clusterMax','genomeMut','mutationRateRange','metaballStrength'];
const wasm=fs.readFileSync(path.join(__dirname,'..','wasm','target','wasm32-unknown-unknown','release','ca2core.wasm'));
function mkState(N,BOX,withCl){const cs=[];for(let i=0;i<N;i++){const c=new J.Cell(Math.random()*BOX,Math.random()*BOX,Math.round((Math.random()-0.5)*14),5);c.radius=P.CELL_RADIUS*(0.7+Math.random()*1.1);c.energy=3+Math.random()*12;c.shp={t:0,asp:1,th:1,wig:0,wsp:1,sat:0,ph:0,ph2:0,dir:0};c.sym=null;cs.push(c);}let SEQ=0;if(withCl){let id=0;for(let i=0;i<N;){const sz=1+Math.floor(Math.random()*4);if(sz>1){id++;for(let k=0;k<sz&&i+k<N;k++)cs[i+k].cl=id;}i+=sz;}SEQ=id;}return{cs:cs,SEQ:SEQ};}
function clone(cs){return cs.map(c=>{const d=Object.create(Object.getPrototypeOf(c));Object.assign(d,c);d.g=JSON.parse(JSON.stringify(c.g));d.shp=JSON.parse(JSON.stringify(c.shp));d.sym=null;return d;});}
(async()=>{
const E=(await WebAssembly.instantiate(wasm,{})).instance.exports;
function pack(cs,nf,cmObj,SEQ,cont){
 const n=cs.length,cap=n+256;E.sim_cells(cap);E.sim_food(nf+1);E.sim_cm(Object.keys(cmObj).length+1);
 const cp=E.sim_cells(cap),fxp=E.sim_food(nf+1),fyp=E.sim_food_y(),cmp=E.sim_cm(Object.keys(cmObj).length+1),cip=E.sim_cm_ids(),pp=E.sim_params();
 const buf=E.memory.buffer,cf=new Float64Array(buf,cp,cap*29),fx=new Float64Array(buf,fxp,nf+1),fy=new Float64Array(buf,fyp,nf+1),cmf=new Float64Array(buf,cmp,(Object.keys(cmObj).length+1)*5),cid=new Float64Array(buf,cip,Object.keys(cmObj).length+1),p=new Float64Array(buf,pp,80);
 pack.stamp=(pack.stamp||0)+1;cs.forEach((c,i)=>{c._i=i;c._f=pack.stamp;});
 cs.forEach((c,i)=>{const b=i*29,g=c.g;/*ST=29: slots 25-28 (crowd/envVx/envVy/sqs) zeroed per pack - wasm buffer reused across trials*/cf.set([c.x,c.y,c.vx,c.vy,c.radius,c.energy,c.gene,c.alive?1:0,c.maxSpeed,c.speedModifier,c.hostility,c.mutationRate,c.sv,c.cl||0,(c.sym&&c.sym._f===pack.stamp)?c.sym._i:-1,g.spd,g.app,g.bnd,g.col[0],g.col[1],g.col[2],c.comp||0,0,0,0,0,0,0,0],b);});
 E.sim_set_n(n);E.sim_set_nf(nf);
 for(let i=0;i<nf;i++){fx[i]=J.food[i].x;fy[i]=J.food[i].y;}
 const cl=Object.keys(cmObj);cl.forEach((k,i)=>{const m=cmObj[k];cid[i]=+k;cmf[i*5]=m.vx;cmf[i*5+1]=m.vy;cmf[i*5+2]=m.x;cmf[i*5+3]=m.y;cmf[i*5+4]=m.e;});
 E.sim_cm_count(cl.length);
 PI.forEach((k,i)=>{let v=P[k];p[i]=typeof v==='boolean'?(v?1:0):v;});
 p[39]=J.env.spd;p[40]=J.env.app;p[41]=J.env.bnd;p[42]=J.env.col?1:0;if(J.env.col){p[43]=J.env.col[0];p[44]=J.env.col[1];p[45]=J.env.col[2];}
 p[46]=-1e9;p[47]=-1e9;p[48]=0;p[49]=cont.x;p[50]=cont.y;p[51]=cont.w;p[52]=cont.h;p[53]=0;p[54]=SEQ;p[56]=0;
 p[58]=P.reproMinAgeMs||0;p[59]=P.reproChance===undefined?0.02:P.reproChance;p[73]=P.habitatOn?1:0;p[74]=P.habitatBirthCap;p[60]=P.crowdTol;p[61]=P.orgLifeDie;p[62]=P.orgLifeGrow;p[63]=P.orgBirth;p[64]=P.orgDead;p[65]=P.orgBrain;p[66]=P.orgR90;p[67]=P.symEnergy;p[68]=P.symBreak;p[69]=P.symBreakDist;p[70]=P.eatDistF;p[71]=P.fuseDistF;p[72]=P.symDistF;
 return{cp:cp};
}
// deterministic trial generation (reproducible across runs)
let _lg=12345>>>0;function genRand(){_lg=(Math.imul(_lg,1664525)+1013904223)>>>0;return _lg/4294967296;}
function withGen(fn2){const sv=Math.random;Math.random=genRand;try{return fn2();}finally{Math.random=sv;}}
const mode=(process.argv[2]||'A');
if(mode==='A'||mode==='D'){
 const trials=mode==='D'?(+process.argv[3]+1):(+process.argv[3]||300),N=+process.argv[4]||75,BOX=500;
 const ONLY=mode==='D'?+process.argv[3]:-1;
 for(const kv of process.argv.slice(3)){if(!kv.includes('='))continue;const[k,v]=kv.split('=');if(k==='nf0'){global.__nf0=1;}else P[k]=+v;}
 P.minEnergyForReproduction=1e9;P.divideOn=0; // no births: RNG streams stay in lockstep
 P.boundAware=1;P.boundZone=70;
 J.cont.x=0;J.cont.y=0;J.cont.w=BOX;J.cont.h=BOX;
 const cont={x:0,y:0,w:BOX,h:BOX};
 const origHypot=Math.hypot;Math.hypot=function(a,b){let s=0;for(let i=0;i<arguments.length;i++)s+=arguments[i]*arguments[i];return Math.sqrt(s);};
 const origRandom=Math.random;
 let bad=0,worst={},evDiff={};
 for(let t=0;t<trials;t++){
  const gen=withGen(()=>{
   const st=mkState(N,BOX,t%2===0);
   const nf=global.__nf0?0:10+Math.floor(Math.random()*20);
   const bf=[];for(let i=0;i<nf;i++)bf.push({x:Math.random()*BOX,y:Math.random()*BOX,r:Math.random()});
   return{st:st,bf:bf,s0:Math.floor(Math.random()*4294967296),s1:Math.floor(Math.random()*4294967296)};
  });
  if(ONLY>=0&&t!==ONLY)continue;
  const{cs,SEQ}=gen.st,baseFood=gen.bf,nf=baseFood.length,s0=gen.s0,s1=gen.s1;
  // cmean from base state (both paths get the same)
  const cmObj={};cs.forEach(c=>{if(!c.cl)return;const m=cmObj[c.cl]||(cmObj[c.cl]={n:0,vx:0,vy:0,x:0,y:0,e:0});m.n++;m.vx+=c.vx;m.vy+=c.vy;m.x+=c.x;m.y+=c.y;m.e+=c.energy;});
  Object.values(cmObj).forEach(m=>{m.vx/=m.n;m.vy/=m.n;m.x/=m.n;m.y/=m.n;m.e/=m.n;});
  cs.forEach((c,i)=>{c._oid=i;});
  // JS run with synced RNG
  const rgen=xorSeed(s0,s1);Math.random=rgen;
  J.cells=clone(cs);J.food=baseFood.map(f=>({x:f.x,y:f.y,r:f.r}));J.seq=SEQ;J.ev.birth=0;J.ev.death=0;J.ev.hit=0;J.ev.oob=0;delete J.ev.eaten;delete J.ev.merge;delete J.ev.fuse;delete J.ev.pair;delete J.ev.ate;delete J.ev.divide;
  Object.keys(J.cmean).forEach(k=>delete J.cmean[k]);Object.assign(J.cmean,JSON.parse(JSON.stringify(cmObj)));
  J.frame();
  // wasm run
  const{cp}=pack(clone(cs),nf,cmObj,SEQ,cont);
  E.sim_step(s0,s1);
  const o=new Float64Array(E.memory.buffer,E.sim_out(),32);
  if(ONLY>=0){console.log(" rng draws js",rgen.n,'wasm',E.sim_rng_n?E.sim_rng_n():'n/a');
   if(E.sim_trace){const wt=new Float64Array(E.memory.buffer,E.sim_trace(),E.sim_trace_len());
   const jm={};J.trace.forEach(r=>{jm[r[0]]=[r[1],r[2]];});
   for(let q=0;q<wt.length;q+=3){const i=wt[q],jd=jm[i];if(!jd||jd[0]!==wt[q+1]||jd[1]!==wt[q+2])console.log('  cell',i,'js upd/pair draws',jd&&jd[0],jd&&jd[1],'wasm',wt[q+1],wt[q+2]);}}
  }
  const cf=new Float64Array(E.memory.buffer,cp,(N+256)*29);
  const jev=[J.ev.birth,J.ev.divide||0,J.ev.eaten||0,J.ev.merge||0,J.ev.fuse||0,J.ev.pair||0,J.ev.hit,J.ev.oob,J.ev.ate||0,J.ev.death];
  const wev=[o[0],o[1],o[2],o[3],o[4],o[5],o[6],o[7],o[8],o[9]];
  let d='';const K=['birth','divide','eaten','merge','fuse','pair','hit','oob','ate','death'];
  for(let i=0;i<10;i++)if(jev[i]!==wev[i]){d+=K[i]+' js='+jev[i]+' wasm='+wev[i]+' ';evDiff[K[i]]=(evDiff[K[i]]||0)+1;}
  // state compare: wasm keeps REM'd (dead) rows; JS spliced them. Compare survivors in order.
  const JC=J.cells;let maxd=0,maxf='';
  const wrows=[];for(let i=0;i<o[15];i++)if(cf[i*29+22]===0)wrows.push(i);
  if(JC.length!==wrows.length){d+='n js='+JC.length+' wasmLive='+wrows.length+' wasmN='+o[15]+' ';}
  const nm=Math.min(JC.length,wrows.length);
  for(let ii=0;ii<nm;ii++){const i=wrows[ii];const c=JC[ii],b=i*29;
   const F=[['x',0],['y',1],['vx',2],['vy',3],['radius',4],['energy',5],['gene',6],['maxSpeed',8],['speedModifier',9],['hostility',10],['mutationRate',11],['sv',12],['cl',13]];
   for(const[f,off2]of F){const dd=Math.abs(c[f]-cf[b+off2]);if(dd>maxd){maxd=dd;maxf=f;}if(dd>1e-9){worst[f]=(worst[f]||[]);if(worst[f].length<3)worst[f].push('t'+t+' i'+i+' js='+c[f]+' wasm='+cf[b+off2]);}}
   if((c.alive?1:0)!==(cf[b+7]!==0?1:0)){d+='alive@'+i+' ';}
  }
  if(maxd>1e-9||d){bad++;if(bad<=5||ONLY>=0)console.log('trial',t,'maxd',maxd,maxf,d);
   if(ONLY>=0){
    const liveJ=new Set(JC.map(c=>c._oid));
    const liveW=new Set(wrows);
    const deadOnlyJ=[...liveW].filter(i=>!liveJ.has(i)),deadOnlyW=[...liveJ].filter(i=>!liveW.has(i));
    console.log(' survived wasm-only(orig idx):',deadOnlyJ.slice(0,6),' js-only:',deadOnlyW.map(i=>JC.find(c=>c._oid===i)&&cs[i]._oid).slice(0,6));
    console.log(' js-only-survivor oids:',JC.filter(c=>!liveW.has(c._oid)).map(c=>c._oid).slice(0,6));
    // first survivor-index mismatch detail
    for(let ii=0;ii<nm;ii++){const i=wrows[ii],c=JC[ii],b=i*29;
     const dx=Math.abs(c.x-cf[b]),dy=Math.abs(c.y-cf[b+1]),dv=Math.abs(c.vx-cf[b+2])+Math.abs(c.vy-cf[b+3]);
     if(dx+dy+dv>1e-9||c._oid!==i){
      console.log(' first divergent survivor row',ii,'origIdx wasm',i,'js oid',c._oid);
      console.log('  base:',JSON.stringify({x:cs[i].x,y:cs[i].y,vx:cs[i].vx,vy:cs[i].vy,r:cs[i].radius,e:cs[i].energy,g:cs[i].gene,cl:cs[i].cl}));
      console.log('  js  :',JSON.stringify({x:c.x,y:c.y,vx:c.vx,vy:c.vy,r:c.radius,e:c.energy,g:c.gene,cl:c.cl,alive:c.alive}));
      console.log('  wasm:',JSON.stringify({x:cf[b],y:cf[b+1],vx:cf[b+2],vy:cf[b+3],r:cf[b+4],e:cf[b+5],g:cf[b+6],cl:cf[b+13],alive:cf[b+7]}));
      break;}
    }
   }
  }
 }
 Math.hypot=origHypot;Math.random=origRandom;
 console.log('A done: trials',trials,'diverged',bad,'event-mismatch counts',JSON.stringify(evDiff));
 console.log('worst fields:',JSON.stringify(worst,null,1).slice(0,2000));
}else if(mode==='C'){
 // birth pressure: dense energized population; births/frame can exceed the wasm kid buffer (cap n+256).
 const N=+process.argv[3]||400,BOX=+process.argv[4]||220,frames=+process.argv[5]||5;
 P.boundAware=1;P.boundZone=10;J.cont.x=0;J.cont.y=0;J.cont.w=BOX;J.cont.h=BOX;const cont={x:0,y:0,w:BOX,h:BOX};
 // JS side
 const{cs}=mkState(N,BOX,false);
 cs.forEach(c=>{c.energy=10;c.hostility=0.3;});
 J.cells=clone(cs);J.food=[];J.seq=0;
 let bJ=0,bJfr=[];
 for(let f=0;f<frames;f++){J.ev.birth=0;J.ev.death=0;J.ev.hit=0;J.ev.oob=0;delete J.ev.eaten;delete J.ev.merge;delete J.ev.fuse;delete J.ev.pair;delete J.ev.ate;delete J.ev.divide;J.frame();bJfr.push(J.ev.birth+'/'+J.cells.length);bJ+=J.ev.birth;}
 // wasm side
 let wcells=clone(cs);wcells.forEach(c=>{c.energy=10;c.hostility=0.3;});let bW=0,bWfr=[];
 for(let f=0;f<frames;f++){
   const{cp}=pack(wcells,0,{},0,cont);
   E.sim_step(Math.floor(Math.random()*4294967296),Math.floor(Math.random()*4294967296));
   const o=new Float64Array(E.memory.buffer,E.sim_out(),32);
   const cf=new Float64Array(E.memory.buffer,cp,(wcells.length+256)*29);
   const n2=o[15],out=[];
   for(let i=0;i<n2;i++){const b=i*29;const c=i<wcells.length?wcells[i]:new J.Cell(cf[b],cf[b+1],cf[b+6],cf[b+11]);
    c.x=cf[b];c.y=cf[b+1];c.vx=cf[b+2];c.vy=cf[b+3];c.radius=cf[b+4];c.energy=cf[b+5];c.gene=cf[b+6];c.alive=cf[b+7]!==0;c.maxSpeed=cf[b+8];c.speedModifier=cf[b+9];c.hostility=cf[b+10];c.mutationRate=cf[b+11];c.sv=cf[b+12];c.cl=cf[b+13];
    c.g.spd=cf[b+15];c.g.app=cf[b+16];c.g.bnd=cf[b+17];c.g.col=[cf[b+18],cf[b+19],cf[b+20]];out.push(c);}
   bWfr.push(o[0]+'/'+n2);bW+=o[0];
   wcells=out.filter(c=>c.alive);
 }
 console.log('C birth/frame+pop js:',bJfr.join(' '),' total',bJ);
 console.log('C birth/frame+pop wasm:',bWfr.join(' '),' total',bW);
}else if(mode==='B'){
 // statistical multi-frame trajectories, births + food enabled, independent RNG (no sync needed: count distributions)
 const states=+process.argv[3]||8,frames=+process.argv[4]||40,N=+process.argv[5]||75,BOX=500;
 P.boundAware=1;P.boundZone=70;J.cont.x=0;J.cont.y=0;J.cont.w=BOX;J.cont.h=BOX;const cont={x:0,y:0,w:BOX,h:BOX};
 const K=['birth','divide','eaten','merge','fuse','pair','hit','oob','ate','death'];
 const SJ=new Array(10).fill(0),SW=new Array(10).fill(0);let PJn=0,PWn=0;
 for(let s=0;s<states;s++){
  const{cs,SEQ}=mkState(N,BOX,true);
  const baseFood=[];for(let i=0;i<40;i++)baseFood.push({x:Math.random()*BOX,y:Math.random()*BOX,r:Math.random()});
  // JS trajectory
  J.cells=clone(cs);J.food=baseFood.map(f=>({x:f.x,y:f.y,r:f.r}));J.seq=SEQ;const ej=new Array(10).fill(0);
  for(let f=0;f<frames;f++){
   J.ev.birth=0;J.ev.death=0;J.ev.hit=0;J.ev.oob=0;delete J.ev.eaten;delete J.ev.merge;delete J.ev.fuse;delete J.ev.pair;delete J.ev.ate;delete J.ev.divide;
   const cmObj={};J.cells.forEach(c=>{if(!c.cl)return;const m=cmObj[c.cl]||(cmObj[c.cl]={n:0,vx:0,vy:0,x:0,y:0,e:0});m.n++;m.vx+=c.vx;m.vy+=c.vy;m.x+=c.x;m.y+=c.y;m.e+=c.energy;});
   Object.values(cmObj).forEach(m=>{m.vx/=m.n;m.vy/=m.n;m.x/=m.n;m.y/=m.n;m.e/=m.n;});
   Object.keys(J.cmean).forEach(k=>delete J.cmean[k]);Object.assign(J.cmean,cmObj);
   J.frame();
   const fr=[J.ev.birth,J.ev.divide||0,J.ev.eaten||0,J.ev.merge||0,J.ev.fuse||0,J.ev.pair||0,J.ev.hit,J.ev.oob,J.ev.ate||0,J.ev.death];
   fr.forEach((v,i)=>ej[i]+=v);
  }
  PJn+=J.cells.length;
  // wasm trajectory
  let wcells=clone(cs);let wfood=baseFood.map(f=>({x:f.x,y:f.y,r:f.r}));let wseq=SEQ;const ew=new Array(10).fill(0);
  for(let f=0;f<frames;f++){
   const cmObj={};wcells.forEach(c=>{if(!c.cl)return;const m=cmObj[c.cl]||(cmObj[c.cl]={n:0,vx:0,vy:0,x:0,y:0,e:0});m.n++;m.vx+=c.vx;m.vy+=c.vy;m.x+=c.x;m.y+=c.y;m.e+=c.energy;});
   Object.values(cmObj).forEach(m=>{m.vx/=m.n;m.vy/=m.n;m.x/=m.n;m.y/=m.n;m.e/=m.n;});
   J.food=wfood;
   const{cp}=pack(wcells,wfood.length,cmObj,wseq,cont);
   E.sim_step(Math.floor(Math.random()*4294967296),Math.floor(Math.random()*4294967296));
   const o=new Float64Array(E.memory.buffer,E.sim_out(),32);
   const cf=new Float64Array(E.memory.buffer,cp,(wcells.length+256)*29);
   const lg=new Float64Array(E.memory.buffer,E.sim_log(),o[17]);
   const n2=o[15],out=[];
   for(let i=0;i<n2;i++){const b=i*29;const c=i<wcells.length?wcells[i]:new J.Cell(cf[b],cf[b+1],cf[b+6],cf[b+11]);
    c.x=cf[b];c.y=cf[b+1];c.vx=cf[b+2];c.vy=cf[b+3];c.radius=cf[b+4];c.energy=cf[b+5];c.gene=cf[b+6];c.alive=cf[b+7]!==0;c.maxSpeed=cf[b+8];c.speedModifier=cf[b+9];c.hostility=cf[b+10];c.mutationRate=cf[b+11];c.sv=cf[b+12];c.cl=cf[b+13];
    c.g.spd=cf[b+15];c.g.app=cf[b+16];c.g.bnd=cf[b+17];c.g.col=[cf[b+18],cf[b+19],cf[b+20]];if(cf[b+21]>0)c.comp=cf[b+21];out.push(c);}
   for(let i=0;i<n2;i++){const sy=cf[i*29+14];out[i].sym=sy>=0?out[sy]:null;}
   const fg=new Float64Array(E.memory.buffer,E.sim_food_gone(),wfood.length+1);
   wfood=wfood.filter((f2,i)=>!fg[i]);
   wcells=out.filter(c=>c.alive);wseq=o[10];
   const fr=[o[0],o[1],o[2],o[3],o[4],o[5],o[6],o[7],o[8],o[9]];fr.forEach((v,i)=>ew[i]+=v);
  }
  PWn+=wcells.length;
  ej.forEach((v,i)=>SJ[i]+=v);ew.forEach((v,i)=>SW[i]+=v);
  console.log('state',s,K.map((k,i)=>k+' js '+ej[i]+' wasm '+ew[i]+(ej[i]?' ('+((ew[i]/ej[i]-1)*100).toFixed(0)+'%)':'')).join(' | '));
 }
 console.log('TOTAL',K.map((k,i)=>k+' js '+SJ[i]+' wasm '+SW[i]+(SJ[i]?' ('+((SW[i]/SJ[i]-1)*100).toFixed(1)+'%)':'')).join('\n  '));
 console.log('final populations js',PJn/states,'wasm',PWn/states);
}
})();
