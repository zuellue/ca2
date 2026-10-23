// deterministic unit test of foodSpot draw cap and exhaustion (pure node, no browser). Extracts the helpers from ca2.js.
const fs=require('fs'),src=fs.readFileSync(__dirname+'/../ca2.js','utf8');
const a=src.indexOf('  function foodInkOn()'),b=src.indexOf('  function foodPushOut(');
const code=src.slice(a,b);
function run(inkShare){
  const mw=100,mh=100,img=new Uint8ClampedArray(mw*mh*4);
  const cut=Math.round(inkShare*mw*mh); for(let i=0;i<cut;i++) img[i*4+3]=255; // first rows are ink
  const env={W:mw*2,P:{separatorOn:1,showHud:1,foodSize:2},SEP:{img,mw,mh},sepDiskHit:(x,y,r)=>{const ix=Math.min(mw-1,Math.max(0,(x*0.5)|0)),iy=Math.min(mh-1,Math.max(0,(y*0.5)|0));return img[(iy*mw+ix)*4+3]>40;},Math,food:[]};
  const f=new Function(...Object.keys(env),code+';return {foodSpot,foodInkFrac};')(...Object.values(env));
  let ok=0,skip=0,onInk=0,N=20000;
  for(let i=0;i<N;i++){const r=f.foodSpot(0,0,200,200); if(!r) skip++; else {ok++; if(env.sepDiskHit(r.x,r.y,1)) onInk++;}}
  return {inkShare,spawned:ok,skipped:skip,skipRate:(skip/N).toFixed(5),onInk};
}
[0,0.05,0.3,0.5,0.51,0.7,0.95,0.99,0.999,0.9999,1].forEach(s=>{const t=Date.now();const r=run(s);r.ms=Date.now()-t;console.log(JSON.stringify(r));if(r.onInk>0){console.log('FAIL onInk');process.exitCode=1}});
