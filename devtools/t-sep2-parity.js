// Node parity: REAL ca2.js text (emitCell, sepBody, separatorPass JS fallback incl. sepBodyLineHit/sepBodyHit/sepDiskHit) vs wasm sep2 path, same inputs.
// usage: node t-sep2-parity.js [wasmfile]   (N=states env). Branch counters are injected into the JS copy only.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
const sl=(a,b)=>{const i=src.indexOf(a),j=src.indexOf(b,i);if(i<0||j<0)throw new Error('anchor '+a);return src.slice(i,j)};
let body=sl('  function emitCell(','  function buildSourcesW')+sl('  function sepDiskHit','  function separatorCollectivePass')+sl('  var SEPTRIG','  function separatorPass()');
const anchors={segCross:'c.x = hitX + enX * side * r;',wedgeContact:'var need = r - d;',onLineD0:'nx = -ay; ny = ax;',
 hairlinePush:'c.x+=lnx*lside*travel;',inkEntered:'var foundInk = false',inkFound:'var inkDX =',inkSegCrossTrue:'var it = id0/(id0-id1)',wallX0:'c.x = bx0;',wallX1:'c.x = bx1;',wallY0:'c.y = by0;',wallY1:'c.y = by1;',lineHitTrue:'if(sepBodyField(body,sg[0]+ux*t-x,sg[1]+uy*t-y)>P.THRESHOLD*.96)return true;',bodyHitTrue:'if (field > P.THRESHOLD * 0.96) return true;',
 shapeString:'var rs = cr * sh.th',shapeLobed:'var r0 = cr * 0.78'};
const wearRe=/(if \(pr > 0 && c\.radius > P\.CELL_RADIUS\)) (c\.radius = Math\.max\([^;]*;)/;if(!wearRe.test(body))throw new Error('wear anchor');body=body.replace(wearRe,"$1 { __B('wear'); $2 }");
body=body.replace('if (al < 0.001) break;',"if (al < 0.001) { __B('opposedBreak'); break; }");const hits={wear:0,opposedBreak:0};for(const k in anchors){hits[k]=0;if(!body.includes(anchors[k]))throw new Error('missing anchor '+k);body=body.replace(anchors[k],`__B('${k}');`+anchors[k])}
const __B=k=>{hits[k]++};
const wasmFile=process.argv[2]||path.join(__dirname,'..','wasm/target/wasm32-unknown-unknown/release/ca2core.wasm');
const inst=new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(wasmFile)),{});
let seed=1;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);
function shape(){const t=rnd();if(t<.4)return null;if(t<.7)return{t:1,th:.5+rnd()*.6,asp:1+rnd()*5,dir:rnd()*6.28,wsp:rnd(),ph:rnd()*6,wig:rnd()*.5,sat:0,ph2:0};return{t:2,th:1,asp:1,dir:0,wsp:rnd(),ph:rnd()*6,wig:0,sat:2+(rnd()*4|0),ph2:rnd()*6}}
function mk(kind){
  const W=900,H=500,P={metaballStrength:1.2,THRESHOLD:1,CELL_RADIUS:8,boundForce:0.8,boundGap:kind%3?3:0,showAxis:1,showHud:kind%5!==4?1:0,axisWidth:1,cellShapes:1};
  const cont={x:20,y:20,w:W,h:H},SEP={mw:W/2+20,mh:H/2+20};SEP.img=new Uint8ClampedArray(SEP.mw*SEP.mh*4);
  const rects=[];for(let g=0;g<8;g++){const x0=(rnd()*SEP.mw*.8)|0,y0=(rnd()*SEP.mh*.8)|0,w=5+(rnd()*40|0),h=5+(rnd()*40|0);rects.push([x0,y0,w,h]);for(let y=y0;y<Math.min(SEP.mh,y0+h);y++)for(let x=x0;x<Math.min(SEP.mw,x0+w);x++)SEP.img[(y*SEP.mw+x)*4+3]=rnd()<.9?255:20}
  let segs=[];for(let i=0;i<5;i++){const x=cont.x+rnd()*W,y=cont.y+rnd()*H;segs.push([x,y,x+rnd()*300-150,y+rnd()*300-150])}
  segs.push([200,200,200,200]); // zero length
  if(kind%4===1){segs=[[300,150,300,350],[300,350,500,350],[300,150,500,150]]} // wedge/corners
  if(kind%4===2){segs=[[100,300,700,300],[100,312,700,312]]}                  // parallel pair: opposed normals
  const cells=[];const cn=kind%7===0?10:60;
  for(let i=0;i<cn;i++){let x=cont.x+rnd()*W,y=cont.y+rnd()*H;
   const m=rnd();if(m<.3){const s=segs[(rnd()*segs.length)|0];const t=rnd();x=s[0]+(s[2]-s[0])*t+rnd()*6-3;y=s[1]+(s[3]-s[1])*t+rnd()*6-3}
   else if(m<.5){const q=rects[(rnd()*8)|0];x=20+(q[0]+rnd()*q[2])*2;y=20+(q[1]+rnd()*q[3])*2}
   else if(m<.58)x=cont.x+(rnd()<.5?rnd()*4:W-rnd()*4);else if(m<.66)y=cont.y+(rnd()<.5?rnd()*4:H-rnd()*4);
   cells.push({alive:rnd()<.95,x,y,vx:rnd()*4-2,vy:rnd()*4-2,radius:rnd()<.15?30+rnd()*50:5+rnd()*25,popD:1,shp:shape()})}
  if(kind%4===2)cells[0].x=400,cells[0].y=306;
  if(kind%11===3){cells[1].x=300;cells[1].y=250}  // exactly on a segment
  for(const c of cells){c._sepX=c.x-(rnd()*30-15);c._sepY=c.y-(rnd()*30-15)}
  cells[0]._sepX=undefined;
  return{P,cont,SEP,segs,cells}
}
function mkfn(st,WC){return new Function('P','cont','SEP','axisInfo','cells','WC','LW','DD','lay','clamp','frameT','SRC_MAX','location','__B',body+';return {separatorPass,sepDiskHit,sepBodyHit,sepBody,sepBodyLineHit};')(st.P,st.cont,st.SEP,{segs:st.segs},st.cells,WC,()=>1,1,()=>({fs:60}),clamp,1234.5,384,{search:''},__B)}
const JSWC={ok:false,off:true},mkW=()=>({ok:true,off:false,e:inst.exports,mem:inst.exports.memory});
const keys=['x','y','vx','vy','radius'];
function cmp(A,B,st){for(let i=0;i<A.length;i++)for(const k of keys){const a=A[i][k],b=B[i][k],d=Math.abs(a-b);if(Object.is(a,b))continue;st.nz++;if(!(d<=st.max))st.max=d;if(Number.isNaN(d))st.nan++}}
const N=+process.env.N||300,st={nz:0,max:0,nan:0,states:0},ids={noop:{n:0,nz:0}};let tj=0,tw=0,errs=0;
for(let it=0;it<N;it++){seed=5000+it*7;const A=mk(it);seed=5000+it*7;const B=mk(it);
 const fa=mkfn(A,JSWC),WCw=mkW(),fb=mkfn(B,WCw);
 let t=process.hrtime.bigint();fa.separatorPass();tj+=Number(process.hrtime.bigint()-t);
 t=process.hrtime.bigint();fb.separatorPass();tw+=Number(process.hrtime.bigint()-t);
 if(WCw.sepErr){errs++;console.log('sepErr',WCw.sepErr)}
 // second frame on the resulting states (uses _sepX unchanged => segment-crossing path again), with a forced wasm memory growth in between
 inst.exports.memory.grow(1);fa.separatorPass();fb.separatorPass();
 cmp(A.cells,B.cells,st);st.states++}
// no-op identity: cells far from every segment and ink, bit-identical expected and zero movement
{seed=99;const A=mk(1),B=(seed=99,mk(1));for(const S of[A,B]){S.segs=[[500,100,500,110]];S.SEP.img.fill(0);S.cells.forEach((c,i)=>{c.x=60+i*3;c.y=480;c.radius=6;c.shp=null;c._sepX=c.x;c._sepY=c.y})}
 const fa=mkfn(A,JSWC),fb=mkfn(B,mkW());const o=A.cells.map(c=>[c.x,c.y]);fa.separatorPass();fb.separatorPass();const s2={nz:0,max:0,nan:0};cmp(A.cells,B.cells,s2);ids.noop={nz:s2.nz,movedJS:A.cells.filter((c,i)=>c.x!==o[i][0]||c.y!==o[i][1]).length}}
// hit functions: wasm vs JS booleans on random bodies/points
{seed=77;const S=mk(5),WCw=mkW(),f=mkfn(S,JSWC),E=inst.exports;let n=0,mis={disk:0,body:0,line:0},tr={disk:0,body:0,line:0};
 const fw=mkfn(S,WCw); // load mask+params through the real wasm path once
 fw.separatorPass();
 for(let i=0;i<4000;i++){const c=S.cells[i%S.cells.length],bd=f.sepBody(c),x=20+rnd()*900,y=20+rnd()*500;
  const pn=E.sep2_alloc(3,2+3*bd.n);const bv=new Float64Array(E.memory.buffer,pn,2+3*bd.n);bv[0]=bd.n;bv[1]=bd.bound;for(let k=0;k<bd.n;k++){bv[2+k]=bd.x[k];bv[2+bd.n+k]=bd.y[k];bv[2+2*bd.n+k]=bd.r[k]}
  const j=!!f.sepBodyHit(bd,x,y),w=!!E.sep2_body_hit(x,y);if(j!==w)mis.body++;if(j)tr.body++;
  const dj=!!f.sepDiskHit(x,y,bd.bound),dw=!!E.sep2_disk_hit(x,y,bd.bound);if(dj!==dw)mis.disk++;if(dj)tr.disk++;
  const sg=S.segs[i%S.segs.length],lj=!!f.sepBodyLineHit(bd,x,y,sg),lw=!!E.sep2_line_hit(x,y,sg[0],sg[1],sg[2],sg[3]);if(lj!==lw)mis.line++;if(lj)tr.line++;n++}
 ids.hit={queries:n,mismatch:mis,jsTrue:tr}}
console.log(JSON.stringify({states:st.states,fieldsDiffNonzero:st.nz,maxAbsDiff:st.max,nan:st.nan,wasmErrors:errs,noopIdentity:ids.noop,hitFunctions:ids.hit,jsMs:tj/1e6,wasmMs:tw/1e6,branchesExecutedInJSFallback:hits},null,1));
