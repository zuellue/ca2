// Node parity: real JS separatorPass (ca2.js text, WC.off fallback) vs wasm sep2 path, same inputs. usage: node t-sep2-parity.js [wasm]
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
const a=src.indexOf('  function sepWOn()'),b0=src.indexOf('  function sepDiskHit'),e=src.indexOf('  function separatorCollectivePass');
const body=src.slice(b0,e)+src.slice(a,src.indexOf('  function separatorPass()'));
const wasmFile=process.argv[2]||path.join(__dirname,'..','wasm/target/wasm32-unknown-unknown/release/ca2core.wasm');
const inst=new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(wasmFile)),{});
let seed=12345;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);
function mk(){
  const W=900,H=500,P={metaballStrength:1.2,THRESHOLD:1,CELL_RADIUS:8,boundForce:0.8,boundGap:3,showAxis:1,showHud:1,axisWidth:1};
  const cont={x:20,y:20,w:W,h:H},SEP={mw:W/2+20,mh:H/2+20};SEP.img=new Uint8ClampedArray(SEP.mw*SEP.mh*4);
  for(let g=0;g<6;g++){const x0=(rnd()*SEP.mw*.8)|0,y0=(rnd()*SEP.mh*.8)|0,w=5+(rnd()*40|0),h=5+(rnd()*40|0);for(let y=y0;y<Math.min(SEP.mh,y0+h);y++)for(let x=x0;x<Math.min(SEP.mw,x0+w);x++)SEP.img[(y*SEP.mw+x)*4+3]=rnd()<.9?255:20}
  const segs=[];for(let i=0;i<5;i++){const x=cont.x+rnd()*W,y=cont.y+rnd()*H;segs.push([x,y,x+rnd()*300-150,y+rnd()*300-150])}
  const cells=[];for(let i=0;i<60;i++)cells.push({alive:rnd()<.95,x:cont.x+rnd()*W,y:cont.y+rnd()*H,vx:rnd()*4-2,vy:rnd()*4-2,radius:5+rnd()*25,popD:1});
  for(const c of cells){c._sepX=c.x-(rnd()*30-15);c._sepY=c.y-(rnd()*30-15)}
  cells[0]._sepX=undefined;
  return{P,cont,SEP,segs,cells,W,H}
}
function emitCell(c,t,al,o){const n=1+((c.radius|0)%4);for(let i=0;i<n;i++){o.x.push(c.x+Math.cos(i)*c.radius*.4);o.y.push(c.y+Math.sin(i)*c.radius*.4);o.r.push(c.radius*(i?.5:1))}o.n=n}
function run(st,wasm){
  const WC=wasm?{ok:true,off:false,e:inst.exports,mem:inst.exports.memory}:{ok:false,off:true};
  const f=new Function('P','cont','SEP','axisInfo','cells','WC','LW','DD','lay','clamp','emitCell','frameT','SRC_MAX','location',body+';return separatorPass;');
  const sp=f(st.P,st.cont,st.SEP,{segs:st.segs},st.cells,WC,()=>1,1,()=>({fs:60}),clamp,emitCell,0,20,{search:''});
  const t=process.hrtime.bigint();sp();return {ns:Number(process.hrtime.bigint()-t),WC}
}
let worst=0,bad=0,tj=0,tw=0,N=+process.env.N||200,mismatchR=0,errs=0;
for(let it=0;it<N;it++){seed=1000+it;const A=mk();seed=1000+it;const B=mk();
  const ra=run(A,false),rb=run(B,true);tj+=ra.ns;tw+=rb.ns;if(rb.WC.sepErr){errs++;console.log('sepErr',rb.WC.sepErr)}
  for(let i=0;i<A.cells.length;i++){const a=A.cells[i],b=B.cells[i];for(const k of['x','y','vx','vy','radius']){const d=Math.abs(a[k]-b[k]);if(d>worst)worst=d;if(d>0)bad++;if(d>1e-6&&k!=='radius')mismatchR++}}}
console.log({N,fieldsDiffNonzero:bad,maxAbsDiff:worst,diffOver1e6:mismatchR,wasmErrors:errs,jsMsTotal:tj/1e6,wasmMsTotal:tw/1e6});
{seed=1000;const C=mk();const o=C.cells.map(c=>[c.x,c.y,c.radius]);run(C,false);let mv=0,rw=0;C.cells.forEach((c,i)=>{if(Math.hypot(c.x-o[i][0],c.y-o[i][1])>1e-9)mv++;if(c.radius!==o[i][2])rw++});console.log('coverage sample (iter0): moved',mv,'radius worn',rw,'of',C.cells.length)}
