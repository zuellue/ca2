// Node convergence test: REAL wasm sep_run (test/ca2core.wasm) + REAL apply step text-extracted from test/ca2.js (CA_JS override for mutation runs).
// Synthetic scene: one vertical wall segment, cells overlapping it. Each pass = sep_run then apply (new frame per pass, so the f9 quantum is per pass).
// Asserts: moves finite; wall-contact hit count after 12 passes < initial per case and <=50% in aggregate; never any cell on the far side of the wall.
// --glyph (CA-5): HUD-glyph style points (zero normal, push is radial from the ink point, sep.rs "zero normal = glyph") on TWO walls.
// Run from repo root: node devtools/t-sep-converge.js [--glyph]
const fs=require('fs'),src=fs.readFileSync(process.env.CA_JS||'test/ca2.js','utf8');
const a=src.indexOf('var c=active[k],m=moves[k],bg=Math.max(0,P.boundGap||0)'),em='c.x+=mx5;c.y+=my5;',b=src.indexOf(em,a);
if(a<0||b<0){console.log('FAIL markers not found');process.exit(1)}
const apply=new Function('active','moves','k','P','cont','segs','frameT','clamp',src.slice(a,b+em.length));
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const GLYPH=process.argv.includes('--glyph');
let seed=4242;const R=()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296;
(async()=>{const e=(await WebAssembly.instantiate(fs.readFileSync('test/ca2core.wasm'))).instance.exports;
 const cont={x:0,y:0,w:400,h:300},P={boundGap:2},TH=.19,ms=1,th=TH*.90,th96=TH*.96,walls=GLYPH?[150,250]:[200],segs=walls.map(x=>[x,20,x,280]);
 const cutK=Math.max(3,Math.sqrt(ms/(TH*.03)));let fails=0,tot=0,improved=0,sum0=0,sumN=0;
 for(let t=0;t<200;t++){const n=3+Math.floor(R()*6),cells=[];
  for(let i=0;i<n;i++){const wallX=walls[i%walls.length],left=GLYPH?(i%4<2):(i%2===0);cells.push({x:wallX+(left?-1:1)*(2+R()*6)+(R()-.5)*2,y:40+R()*220,r:3+R()*4,maxSpeed:3+R()*4,left,wallX})}
  let frame=1,hits0=null,hitsN=0,badSide=0;
  for(let pass=0;pass<12;pass++){
   const flat=[],pts=[];cells.forEach((c,k)=>flat.push(c.x,c.y,ms*c.r*c.r,c.r*cutK,k));
   walls.forEach(wx=>{for(let y=20;y<=280;y++)pts.push(wx,y,GLYPH?0:1,0)});
   const sp=e.sep_alloc(0,flat.length),pp=e.sep_alloc(1,pts.length),cp=e.sep_alloc(2,n*3);
   new Float64Array(e.memory.buffer,sp,flat.length).set(flat);new Float64Array(e.memory.buffer,pp,pts.length).set(pts);
   const cs=[];cells.forEach(c=>cs.push(c.x,c.y,c.r));new Float64Array(e.memory.buffer,cp,cs.length).set(cs);
   const hit=e.sep_run(flat.length/5,pts.length/4,n,th,th96);if(hits0===null)hits0=hit;hitsN=hit;
   const mb=new Float64Array(e.memory.buffer,e.sep_moves(),n*3).slice();if(mb.some(v=>!isFinite(v))){fails++;console.log('FAIL non-finite moves case',t);break}
   cells.forEach((c,k)=>{c._f5T=undefined;apply([c],[[mb[k*3],mb[k*3+1]]],0,P,cont,segs,frame,clamp)});frame++;
   cells.forEach(c=>{if(c.left&&c.x>c.wallX||!c.left&&c.x<c.wallX)badSide++})}
  tot++;sum0+=hits0;sumN+=hitsN;if(badSide){fails++;console.log('FAIL case',t,'cell crossed wall');}
  if(hitsN>hits0){fails++;console.log('FAIL case',t,'hits grew',hits0,'->',hitsN)}
  if(hitsN<hits0)improved++}
 if(improved<tot*.95){fails++;console.log('FAIL improved only',improved,'of',tot)}
 if(sumN>sum0*.5){fails++;console.log('FAIL weak convergence: total hits',sum0,'->',sumN,'(need <=50%)')}
 console.log(fails?'FAILED '+fails:'PASS',tot,'cases; hits reduced in',improved,GLYPH?'(glyph zero-normal, 2 walls)':'(single wall)');process.exit(fails?1:0)})();
