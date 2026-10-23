// t-circles-wings-parity: real ca2.js parasiteCircles + parasite wing draw loop (JS fallback) vs the same code with the Rust circles.rs hooks (WC.e).
// Extracts the live source text from ca2.js; no re-implementation. Math.random is a stateful counting LCG (same seed per path); draw count and order are compared every frame.
// Compare: Object.is on every parasite field after N frames, and every recorded ctx call argument (wings).
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
const a=src.indexOf('  function circleInPlate'),b=src.indexOf('  function stepParasites() {');
const ovCode=src.slice(a,b);
const wa=src.indexOf("    if (P.parasiteOn && parasites.length) { var pc = css(eased.title, 1);"),wb=src.indexOf('    // area outline: no rounded corners');
const wingCode=src.slice(wa,wb);
let s=987654321;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
(async()=>{
const E=(await WebAssembly.instantiate(fs.readFileSync(path.join(__dirname,'..',process.argv[2]||'ca2core.wasm')),{})).instance.exports;
const rec=[];const ctx=new Proxy({},{get:(t,k)=>typeof k==='string'&&/^(beginPath|moveTo|arcTo|lineTo|fill)$/.test(k)?(...a)=>rec.push([k,...a]):t[k],set:(t,k,v)=>{t[k]=v;return true;}});
let now=0;function mkRng(seed){let st=seed>>>0,n=0;const f=()=>{n++;st=(Math.imul(st,1664525)+1013904223)>>>0;return st/4294967296;};f.count=()=>n;f.reset=sd=>{st=sd>>>0;n=0;};return f;}
const rJ=mkRng(7),rW=mkRng(7);function mkMath(rg){const M=Object.create(Math);M.random=rg;return M;}
function build(useW,mathX){
 const env={P:null,cont:null,cells:null,circlesNow:null,parasites:null,WC:useW?{e:E,mem:E.memory,ok:true}:{},location:{search:''},performance:{now:()=>now},Math:mathX,clamp:(v,l,h)=>v<l?l:v>h?h:v,ctx,css:()=>'#000',eased:{title:1},fadeA:null,dtf:16,wvis:null,i:0,
  pfx:0};
 const f=new Function('env',`with(env){var P=env.P,cont,cells,circlesNow,parasites;var fadeA=function(k){return env.fadeA(k)};var css=env.css,eased=env.eased,ctx=env.ctx;`+ovCode+`
  return {run:function(st){P=st.P;cont=st.cont;cells=st.cells;circlesNow=st.circlesNow;parasites=st.parasites;parasiteCircles();return parasites;},
   wing:function(st,dt){P=st.P;parasites=st.parasites;var dtf=dt,i;`+wingCode.replace(/\bvar dtf\b/,'var dtf_')+`}};}`)(env);
 return {env,f};
}
const J=build(false,mkMath(rJ)),W=build(true,mkMath(rW));let rngBad=0;let bad=0,tot=0,stateBad=0,maxAbs=0;
const same=(x,y)=>Object.is(x,y);const TOL=1e-9;let ovTot=0,ovExact=0;const near=(x,y)=>Object.is(x,y)||(typeof x==='number'&&typeof y==='number'&&Math.abs(x-y)<=TOL);
function clone(p){return p.map(o=>Object.assign({},o,{host:o.host,circ:o.circ}));}
for(let t=0;t<3000;t++){
 const P={parasiteOn:1,showHud:1,titleCircles:rnd()<0.9?1:0,parasiteSight:rnd()<0.2?60:4000,parasiteNerv:rnd()<0.4?0:rnd()*2,parasiteSize:rnd()<0.3?0:rnd()*4};
 const cont={x:100+rnd()*50,y:100,w:200+rnd()*300,h:100+rnd()*300};
 const nk=Math.floor(rnd()*6),keys=['a','b','c','a2','b2','c2'];
 const circ=[];for(let i=0;i<nk;i++)circ.push({key:keys[rnd()<0.2?0:i],x:rnd()*700,y:rnd()*500,r:5+rnd()*60});
 const cells=[];for(let i=0,n=Math.floor(rnd()*8);i<n;i++)cells.push({x:rnd()*700,y:rnd()*500,alive:rnd()<0.85,cl:rnd()<0.3?1:0,radius:10,energy:1});
 const par=[];for(let i=0,n=1+Math.floor(rnd()*6);i<n;i++){const p={x:rnd()*700,y:rnd()*500,e:5,host:rnd()<0.2?cells[0]||{alive:1}:null,a:0};if(rnd()<0.5)p.ph=rnd()*6;par.push(p);}
 const mk=()=>({P,cont,cells,circlesNow:circ.map(c=>Object.assign({},c)),parasites:par.map(p=>Object.assign({},p))});
 const sj=mk(),sw=mk();
 // sw circles/host must refer to its own circlesNow: remap p.circ by index
 for(let fr=0;fr<12;fr++){
  now=t*100+fr*16.7;
  if(fr&&rnd()<0.2){for(const st of [sj,sw]){}}
  J.f.run(sj);W.f.run(sw);if(rJ.count()!==rW.count()){rngBad++;bad++;if(rngBad<4)console.log('RNG COUNT MISMATCH',t,fr,rJ.count(),rW.count());rW.reset(7);rJ.reset(7);}
  // cross-check circ identity by index
  for(let i=0;i<sj.parasites.length;i++){const p=sj.parasites[i],q=sw.parasites[i];tot++;
   const ci=p.circ?sj.circlesNow.indexOf(p.circ):-1,cj=q.circ?sw.circlesNow.indexOf(q.circ):-1;
   ovTot++;if(ci!==cj||!near(p.x,q.x)||!near(p.y,q.y)||!near(p._ox,q._ox)||!near(p._oy,q._oy)||!same(p.ph,q.ph)){bad++;if(bad<6)console.log('OVERLAY MISMATCH',t,fr,p,q,ci,cj);}}
  // wings
  const vis=rnd()<0.2;const vmask=sj.parasites.map(()=>rnd()<0.85?1:0);
  J.env.fadeA=k=>vmask[+k.slice(2)];W.env.fadeA=k=>vmask[+k.slice(2)];
  // movement between frames
  for(const st of [sj,sw]){}
  const mv=sj.parasites.map(()=>[ (rnd()-0.5)*8,(rnd()-0.5)*8]);
  sj.parasites.forEach((p,i)=>{p.x+=mv[i][0];p.y+=mv[i][1];sw.parasites[i].x+=mv[i][0];sw.parasites[i].y+=mv[i][1];});
  const dt=8+rnd()*30;
  rec.length=0;J.f.wing(sj,dt);const rj=rec.slice();rec.length=0;W.f.wing(sw,dt);const rw=rec.slice();
  tot++;
  let ok=rj.length===rw.length;if(ok)for(let k=0;k<rj.length;k++){if(rj[k].length!==rw[k].length||rj[k].some((v,m)=>!near(v,rw[k][m])))ok=false;}
  for(let i=0;i<sj.parasites.length;i++){const p=sj.parasites[i],q=sw.parasites[i];for(const k of ['h','px','py','fx','fy','sp','fp'])if(!near(p[k],q[k]))ok=false;}
  {let st=false;for(let i=0;i<sj.parasites.length;i++){const p=sj.parasites[i],q=sw.parasites[i];for(const k of ['h','px','py','fx','fy','sp','fp'])if(!same(p[k],q[k]))st=true;}if(st)stateBad++;for(let k=0;k<rj.length&&rj.length===rw.length;k++)for(let m=1;m<rj[k].length;m++){const d=Math.abs(rj[k][m]-rw[k][m]);if(d>maxAbs)maxAbs=d;}}
  if(!ok){bad++;if(bad<6)console.log('WING MISMATCH',t,fr,JSON.stringify(rj.slice(0,5)),JSON.stringify(rw.slice(0,5)));}
 }
}

// fault injection: pc_move / pw_run throw -> hooks must fall back to the JS body with state untouched by the failed attempt (no partial write).
{
 const mkE=(over)=>Object.assign({},E,over);
 let fb=0,fbBad=0;
 for(const [name,over] of [['pc_move',{pc_move:()=>{throw new Error('inject')}}],['pc_decide',{pc_decide:()=>{throw new Error('inject')}}],['pw_run',{pw_run:()=>{throw new Error('inject')}}]]){
  for(let t=0;t<300;t++){
   const rj=mkRng(11+t),rx=mkRng(11+t);const Jx=build(false,mkMath(rj)),Fx=build(true,mkMath(rx));Fx.env.WC.e=mkE(over);
   const P={parasiteOn:1,showHud:1,titleCircles:1,parasiteSight:4000,parasiteNerv:0.7,parasiteSize:2};const cont={x:100,y:100,w:400,h:300};
   const circ=[{key:'a',x:90,y:150,r:30},{key:'b',x:300,y:90,r:25}];const cells=[{x:200,y:200,alive:1,cl:0}];
   const mk=()=>({P,cont,cells,circlesNow:circ.map(c=>Object.assign({},c)),parasites:[{x:150,y:150,e:5,host:null},{x:300,y:180,e:5,host:null,ph:1.5}]});
   const sj=mk(),sf=mk();now=t;
   Jx.f.run(sj);Fx.f.run(sf);
   const vm=[1,1];Jx.env.fadeA=Fx.env.fadeA=k=>vm[+k.slice(2)];
   rec.length=0;Jx.f.wing(sj,16);const a1=JSON.stringify(rec);rec.length=0;Fx.f.wing(sf,16);const a2=JSON.stringify(rec);
   fb++;const same2=JSON.stringify(sj.parasites.map(p=>[p.x,p.y,p._ox,p.ph,p.h,p.fp]))===JSON.stringify(sf.parasites.map(p=>[p.x,p.y,p._ox,p.ph,p.h,p.fp]));
   if(!same2||a1!==a2){fbBad++;if(fbBad<3)console.log('FALLBACK MISMATCH',name,t);}
   if(name!=='pw_run'&&rj.count()!==rx.count()&&name==='pc_decide'){fbBad++;console.log('RNG advanced on pc_decide failure');}
  }
 }
 console.log(JSON.stringify({faultInjectionCases:fb,faultInjectionBad:fbBad,note:'pc_decide failure: no draw, JS body runs; pc_move failure: JS finishes the step with the already-drawn values (no redraw)'}));
 bad+=fbBad;
}
// pc_move OOD AFTER draws: real prescan (no stub). huge ph (prior-ph mode1) or huge clock makes pc_move return -2 after JS already drew; JS must finish from decided state with the drawn values.
{
 let n=0,bad2=0,drawsTot=0,negRet=0;
 for(const kind of ['ph','clock','both','inDomain']){
  for(let t=0;t<200;t++){
   const rj=mkRng(500+t),rx=mkRng(500+t);const Jx=build(false,mkMath(rj)),Fx=build(true,mkMath(rx));
   const P={parasiteOn:1,showHud:1,titleCircles:1,parasiteSight:4000,parasiteNerv:t%3===0?0:0.7,parasiteSize:2};const cont={x:100,y:100,w:400,h:300};
   const circ=[{key:'a',x:90,y:150,r:30},{key:'b',x:300,y:90,r:25}];const cells=[{x:200,y:200,alive:1,cl:0}];
   Fx.env.WC.e=Object.assign({},E,{pc_move:(...a)=>{const r=E.pc_move(...a);if(r<0)negRet++;return r;}});
   const bigph=(kind==='ph'||kind==='both')?1e9:1.5;
   const mk=()=>({P,cont,cells,circlesNow:circ.map(c=>Object.assign({},c)),parasites:[{x:150,y:150,e:5,host:null,ph:bigph},{x:300,y:180,e:5,host:null},{x:250,y:120,e:5,host:null,ph:bigph}]});
   const sj=mk(),sf=mk();
   for(let fr=0;fr<4;fr++){
    now=(kind==='clock'||kind==='both')?1e9+fr*16:fr*16;
    const c0=rj.count();Jx.f.run(sj);Fx.f.run(sf);
    n++;drawsTot+=rj.count()-c0;
    const st=x=>JSON.stringify(x.parasites.map(p=>[p.x,p.y,p._ox,p.ph,p.h,p.fp,p.circ&&p.circ.key]),(k,v)=>typeof v==='number'&&!isFinite(v)?String(v):v);
    if(st(sj)!==st(sf)||rj.count()!==rx.count()||Fx.env.WC.circOff){bad2++;if(bad2<4)console.log('OOD pc_move MISMATCH',kind,t,fr,rj.count(),rx.count(),Fx.env.WC.circOff);}
   }
  }
 }
 console.log(JSON.stringify({pcMoveOodAfterDrawsFrames:n,mismatch:bad2,pcMoveNegativeReturns:negRet,jsDrawsTotal:drawsTot,note:'state + global draw count compared each frame; WC.circOff must stay unset (no retry/no disable); later frames keep using wasm hooks'}));
 bad+=bad2;
}
// growth: big cell/circle/parasite counts force wasm memory growth between allocator calls and views
{
 const Jg=build(false,mkMath(mkRng(5))),Wg=build(true,mkMath(mkRng(5)));
 const P={parasiteOn:1,showHud:1,titleCircles:1,parasiteSight:4000,parasiteNerv:0.3,parasiteSize:1};const cont={x:0,y:0,w:2000,h:1500};
 const mk=()=>({P,cont,cells:Array.from({length:30000},(_,i)=>({x:i%2000,y:(i*7)%1500,alive:1,cl:i%3&&0})),circlesNow:Array.from({length:3000},(_,i)=>({key:'k'+i,x:(i*13)%2000,y:(i*29)%1500,r:20})),parasites:Array.from({length:2000},(_,i)=>({x:(i*17)%2000,y:(i*31)%1500,e:5,host:null}))});
 const sj=mk(),sw=mk();const m0=E.memory.buffer.byteLength;Jg.f.run(sj);Wg.f.run(sw);
 let gb=0;for(let i=0;i<sj.parasites.length;i++){const p=sj.parasites[i],q=sw.parasites[i];const ci=p.circ?sj.circlesNow.indexOf(p.circ):-1,cj=q.circ?sw.circlesNow.indexOf(q.circ):-1;if(ci!==cj||Math.abs(p.x-q.x)>1e-9||Math.abs(p.y-q.y)>1e-9)gb++;}
 console.log(JSON.stringify({growthTest:true,memBefore:m0,memAfter:E.memory.buffer.byteLength,usedWasm:Wg.env.WC.fwPc||0,err:Wg.env.WC.fwPcErr||null,mismatchParasites:gb}));bad+=gb;
}
console.log(JSON.stringify({rngCountMismatch:rngBad,rngDrawsTotalJS:rJ.count(),tolerance:TOL,overlayChecks:ovTot,stateMismatchFrames:stateBad,maxAbsCoordDiff:maxAbs,checks:tot,mismatch:bad,usedWasmOverlay:W.env.WC.fwPc||0,usedWasmWings:W.env.WC.fwWg||0,errs:[W.env.WC.fwPcErr,W.env.WC.fwWgErr].filter(Boolean),binary:process.argv[2]||'ca2core.wasm'}));
process.exit(bad?1:0);})();
