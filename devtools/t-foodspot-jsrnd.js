// t-foodspot-jsrnd: Rust post_food_spot (jsrnd binary, draws via env.js_rnd = Math.random) vs the JS foodSpot, same seeded Math.random. Compares returned spot (Object.is) and draw count.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`var inkFrac={img:null,p:0},inkFree={img:null,idx:null},inkMaskUp=null,W=800;
${['postOffW','inkW','foodInkOn','foodOnInk','foodInkFrac','foodFreeIdx','foodSpot','lowerBound','foodMaskPx','sepDiskHit'].map(fn).join('\n')}
return {foodSpot:foodSpot,r:function(){return Math.max(0.5,P.foodSize/2)},st:foodMaskPx,inkOn:function(){return foodInkOn()&&inkW()}};`;
(async()=>{
const bin=process.argv[2]||'wasm/target-jsrnd/wasm32-unknown-unknown/release/ca2core.wasm';
const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>Math.random()}})).instance.exports;
let s=2024;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
let tot=0,bad=0,drawBad=0,nulls=0;
for(let t=0;t<3000;t++){
 const mw=30+Math.floor(r0()*50),mh=15+Math.floor(r0()*30),img=new Uint8ClampedArray(mw*mh*4),dens=[0,0.02,0.3,0.5,0.51,0.7,0.95,1][t%8];
 for(let i=0;i<mw*mh;i++)img[i*4+3]=r0()<dens?255:(r0()<0.1?20:0);
 const P={separatorOn:(t%11)?1:0,showHud:1,foodSize:0.2+r0()*10};
 const SEP={img:img,mw:mw,mh:mh};
 const cont={x:r0()*100,y:r0()*60,w:100+r0()*600,h:50+r0()*300};
 const WC={ok:true,postOff:false,e:E,mem:E.memory};
 const J=new Function('P','SEP','cont','WC','location','W',body)(P,SEP,cont,{postOff:true},{search:''},800);
 const R=new Function('P','SEP','cont','WC','location','W',body)(P,SEP,cont,WC,{search:''},800);
 const inkOn=R.inkOn(); // uploads mask to wasm exactly as the page does
 for(let k=0;k<10;k++){
  const seed=t*77+k;
  function w(f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
  const a=w(()=>J.foodSpot(cont.x,cont.y,cont.w,cont.h));
  const b=w(()=>{const ok=E.post_food_spot(cont.x,cont.y,cont.w,cont.h,R.r(),R.st(),inkOn?1:0);if(!ok)return null;const m=new Float64Array(E.memory.buffer,E.post_spot_out(),2);return{x:m[0],y:m[1]};});
  tot++;if(a.v===null)nulls++;
  let ok=a.n===b.n; if(!ok)drawBad++;
  if(!(a.v===null&&b.v===null||a.v&&b.v&&Object.is(a.v.x,b.v.x)&&Object.is(a.v.y,b.v.y)))ok=false;
  if(!ok){bad++;if(bad<4)console.log('MISMATCH',t,k,a,b);}
 }
}
console.log(JSON.stringify({checks:tot,nullSpots:nulls,mismatch:bad,drawCountMismatch:drawBad,binary:bin}));process.exit(bad?1:0);})();
