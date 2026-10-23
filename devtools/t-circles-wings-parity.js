// t-circles-wings-parity: real ca2.js parasiteCircles + parasite wing draw loop (JS fallback) vs the same code with the Rust circles.rs hooks (WC.e).
// Extracts the live source text from ca2.js; no re-implementation. Math.random is pinned per frame so both paths see equal random values.
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
let pinned=0.5,now=0;const MathR=Object.create(Math);MathR.random=()=>pinned;
function build(useW){
 const env={P:null,cont:null,cells:null,circlesNow:null,parasites:null,WC:useW?{e:E,mem:E.memory,ok:true}:{},location:{search:''},performance:{now:()=>now},Math:MathR,clamp:(v,l,h)=>v<l?l:v>h?h:v,ctx,css:()=>'#000',eased:{title:1},fadeA:null,dtf:16,wvis:null,i:0,
  pfx:0};
 const f=new Function('env',`with(env){var P=env.P,cont,cells,circlesNow,parasites;var fadeA=function(k){return env.fadeA(k)};var css=env.css,eased=env.eased,ctx=env.ctx;`+ovCode+`
  return {run:function(st){P=st.P;cont=st.cont;cells=st.cells;circlesNow=st.circlesNow;parasites=st.parasites;parasiteCircles();return parasites;},
   wing:function(st,dt){P=st.P;parasites=st.parasites;var dtf=dt,i;`+wingCode.replace(/\bvar dtf\b/,'var dtf_')+`}};}`)(env);
 return {env,f};
}
const J=build(false),W=build(true);let bad=0,tot=0,stateBad=0,maxAbs=0;
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
  pinned=rnd();now=t*100+fr*16.7;
  if(fr&&rnd()<0.2){for(const st of [sj,sw]){}}
  J.f.run(sj);W.f.run(sw);
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
console.log(JSON.stringify({tolerance:TOL,overlayChecks:ovTot,stateMismatchFrames:stateBad,maxAbsCoordDiff:maxAbs,checks:tot,mismatch:bad,usedWasmOverlay:W.env.WC.fwPc||0,usedWasmWings:W.env.WC.fwWg||0,errs:[W.env.WC.fwPcErr,W.env.WC.fwWgErr].filter(Boolean),binary:process.argv[2]||'ca2core.wasm'}));
process.exit(bad?1:0);})();
