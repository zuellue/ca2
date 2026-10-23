// t152 (DIAGNOSTIC): proves the cursor motion-latch state machine on the wasm path vs the JS fallback.
// Coordinator t151 question: after give-up + latch + cooldown elapse, does a >rearmPx cursor move re-arm?
// Findings encoded as assertions:
//  (1) pa_out rows are 10-wide and carry clx/cly across pa_run calls (latch survives the wasm boundary);
//  (2) the rearm gate fires a new belief when the parasite is still inside belief radius R of the moved cursor;
//  (3) once the parasite has host-seeked out of R (the t151 single-far-cell geometry), the same move does NOT
//      re-fool it - the R gate, not the latch, dominates; t151 "no re-belief" is correct designed behavior.
// Usage: node t152-rearm-probe.js [binary]   (default ../ca2core.wasm)
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fnFrom(S,name){const i=S.indexOf('function '+name+'(');if(i<0)throw new Error('no fn '+name);let j=S.indexOf('{',i),d=0,k=j;for(;k<S.length;k++){if(S[k]=='{')d++;else if(S[k]=='}'){d--;if(!d)break;}}return S.slice(i,k+1);}
const M64=(1n<<64n)-1n;
function XR(){let s0=0n,s1=0n;
 return {seed(a,b){s0=(BigInt(a>>>0)<<32n)|0x9E3779B9n;s1=(BigInt(a>>>0)<<32n)|0x85EBCA6Bn;},
  warm(k){for(let i=0;i<k;i++)this.r();},
  r(){let x=s0,y=s1;s0=y;x^=(x<<23n)&M64;s1=(x^y^(x>>17n)^(y>>26n))&M64;const z=(s1+y)&M64;return Number(z>>11n)*(1/9007199254740992);}};}
(async()=>{
const bin=process.argv[2]||'ca2core.wasm';let bad=0;const out={bin};
const E=(await WebAssembly.instantiate(fs.readFileSync(path.join(__dirname,'..',bin)),{})).instance.exports;
const code=fnFrom(src,'stepParasitesW')+'\n'+fnFrom(src,'stepParasitesCore');
function build(useW){
 const xr=XR();const M=Object.create(Math);M.random=()=>xr.r();
 const env={P:{parasiteOn:1,parasiteFrac:0,parasiteSight:4000,parasiteNerv:0.6,parasiteDrain:0.02,parasiteEff:0.8,parasiteHard:12,parasiteHardMs:20000,CELL_RADIUS:34.5,parasiteCursorOn:1,parasiteCursorMs:300,parasiteCursorR:250,parasiteCursorRetK:1.2,parasiteCursorCooldown:500,parasiteCursorRearm:60},
  cells:[{x:500,y:450,radius:20,cl:0,alive:true,energy:1e9,pc:0}],
  parasites:[{x:112,y:158,e:5,host:null,a:1.0,ph:0.5,lost:0}],
  ev:{},parStat:{rehost:0},mouse:{x:62,y:158,over:true},cont:{x:100,y:100,w:600,h:400},
  WC:useW?{e:E,mem:E.memory,ok:true}:{},location:{search:''},performance:{now:()=>env._now},Math:M,clamp:(v,l,h)=>v<l?l:v>h?h:v,lerp:(a,b,t2)=>a+(b-a)*t2,_now:1000};
 const f=new Function('env',`with(env){var Math=env.Math,performance=env.performance,clamp=env.clamp,lerp=env.lerp,location=env.location,WC=env.WC,mouse=env.mouse,cont=env.cont;${code};return {w:stepParasitesW,c:stepParasitesCore};}`)(env);
 return {env,f,xr,useW};
}
// scenario: give-up -> latch -> cooldown -> elapse -> +75px move at fr100 -> watch 600 frames
function run(W){
 const step=()=>W.useW?(W.f.w()===true||W.f.c()):W.f.c(); // wasm path must engage; JS fallback only if the wrapper itself declines
 let latched=null,elapsed=null,rebel=null,maxDmAfterMove=0,minDmAfterMove=1e18;
 for(let fr=0;fr<600;fr++){
  if(fr===100)W.env.mouse={x:137,y:158,over:true};
  W.env._now=1000+fr*16;W.xr.seed(9000+fr,9100+fr);step();
  const p=W.env.parasites[0];if(!p)return {gone:fr};
  const st=p.a<=-2e9?'cool':(p.a<=-1e9?'bel':'norm');
  if(!latched&&p.clx>-1e17)latched={fr,x:p.clx,y:p.cly,state:st};
  if(!elapsed&&latched&&st==='norm')elapsed={fr};
  if(elapsed&&st==='bel'&&!rebel)rebel={fr};
  if(fr>=100){const dm=Math.hypot(W.env.mouse.x-p.x,W.env.mouse.y-p.y);minDmAfterMove=Math.min(minDmAfterMove,dm);}
 }
 return {latched,elapsed,rebel,minDmAfterMove:Math.round(minDmAfterMove)};
}
// A: t151 geometry - far cell pulls the parasite out of R before the move
const A=run(build(true));
out.A_wasm_t151geom=A;
// B: the cursor move lands while the parasite is still in range (short cooldown: elapse ~fr25, move at fr27,
// only ~8 host-seek frames after the give-up, so the parasite is still near the give-up spot)
const W2=build(true);W2.env.P.parasiteCursorCooldown=100;
for(let fr=0;fr<27;fr++){W2.env._now=1000+fr*16;W2.xr.seed(7000+fr,7100+fr);W2.f.w()===true||W2.f.c();}
const pB=W2.env.parasites[0];const dmB=Math.round(Math.hypot(137-pB.x,158-pB.y)),stB=pB.a;
W2.env.mouse={x:137,y:158,over:true};let rebelB=null,relatchB=null;
for(let fr=27;fr<300;fr++){W2.env._now=1000+fr*16;W2.xr.seed(7000+fr,7100+fr);W2.f.w()===true||W2.f.c();
 const p=W2.env.parasites[0];if(!p)break;const st=p.a<=-1e9&&p.a>-2e9;
 if(st&&fr>27&&!rebelB)rebelB={fr};
 if(rebelB&&p.clx===137&&p.cly===158){relatchB={fr};break;}} // next give-up re-latches the moved spot
out.B_wasm_inrange={aAtMove:Math.round(stB),dmAtMove:dmB,rebel:rebelB,relatch:relatchB};
// C: JS fallback, A geometry - qualitative parity
const C=run(build(false));out.C_js_t151geom=C;
// D: raw layout proof - explicit pa_in with a known latch, one pa_run, read pa_out
{const cp=E.pa_cells(1),en=E.pa_energy(1),pp=E.pa_in(1);
 let ci=new Float64Array(E.memory.buffer,cp,10),enn=new Float64Array(E.memory.buffer,en,2),pi=new Float64Array(E.memory.buffer,pp,25);
 ci[0]=500;ci[1]=450;ci[2]=20;ci[3]=0;ci[4]=1;enn[0]=1e9;
 pi.fill(0);pi[0]=112;pi[1]=158;pi[2]=5;pi[3]=-1;pi[4]=0;pi[5]=0.5;pi[6]=1000;pi[7]=62;pi[8]=158; // a=0, latch (62,158)
 pi[9]=137;pi[10]=158;pi[11]=1;pi[12]=1;pi[13]=300;pi[14]=1.2;pi[15]=34.5;pi[16]=100;pi[17]=100;pi[18]=600;pi[19]=400;pi[20]=250;pi[21]=500;pi[22]=60;
 const q=E.pa_run(1,1,1000,1,0,4000,0.6,0.02,0.8,12,20000,123456789,987654321);
 const po=new Float64Array(E.memory.buffer,E.pa_out(),q*10);
 out.D_raw={q,clxCarried:po[7]===62,clyCarried:po[8]===158,srcAt9:po[9]===0,rebelieved:po[4]<=-1e9&&po[4]>-2e9};}
// assertions
const okA=!A.gone&&A.latched&&A.latched.x===62&&A.latched.y===158&&A.elapsed&&!A.rebel; // t151 geometry: no re-belief is CORRECT
const okB=rebelB!==null&&relatchB!==null; // in range: re-belief fires, and the next give-up re-latches the moved spot
const okC=!C.gone&&C.latched&&C.elapsed&&!C.rebel; // JS fallback agrees qualitatively
const okD=out.D_raw.q===1&&out.D_raw.clxCarried&&out.D_raw.clyCarried&&out.D_raw.srcAt9&&out.D_raw.rebelieved;
out.verdict={okA,okB,okC,okD};if(!(okA&&okB&&okC&&okD))bad++;
console.log(JSON.stringify(out,null,1));process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
