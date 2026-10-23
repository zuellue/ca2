// pure-node: the REAL applyKey 'foodDensity' branch extracted from ca2.js, run against the real foodSpot/foodOnInk/foodInkFrac/foodFreeIdx/lowerBound.
// usage: node devtools/t-density-setter-unit.js [path/to/ca2.js]  (default ../ca2.js; pass the old file for the "before" run)
const fs=require('fs'),file=process.argv[2]||__dirname+'/../ca2.js',src=fs.readFileSync(file,'utf8');
const a=src.indexOf('  function foodInkOn()'),b=src.indexOf('  function foodPushOut(');
const s0=src.indexOf("else if (k === 'foodDensity') {"),s1=src.indexOf("else if (k === 'minRefreshInterval'");
if(a<0||b<0||s0<0||s1<0)throw new Error('extract failed');
const helpers=src.slice(a,b), branch=src.slice(s0,s1).replace(/^else /,'');
function run(name,{ink,free,dens,on=1}){
 const mw=100,mh=60,img=new Uint8ClampedArray(mw*mh*4);
 if(ink==='all')for(let i=0;i<mw*mh;i++)img[i*4+3]=255; else if(ink==='band'){for(let i=0;i<mw*mh;i++)img[i*4+3]=255;for(let y=26;y<34;y++)for(let x=0;x<mw;x++)img[(y*mw+x)*4+3]=0;} else if(ink==='text'){for(let k=0;k<30;k++){const cx=Math.random()*mw,cy=Math.random()*mh,r=2+Math.random()*4;for(let y=0;y<mh;y++)for(let x=0;x<mw;x++)if((x-cx)**2+(y-cy)**2<r*r)img[(y*mw+x)*4+3]=255;}}
 const env={postOffW:()=>true,inkW:()=>false,WC:{},W:mw*2,H:mh*2,P:{separatorOn:on,showHud:1,foodSize:2,foodDensity:dens},SEP:{img,mw,mh},cont:{x:10,y:10,w:180,h:100},food:[],rnd:x=>Math.random()*x,
  sepDiskHit:(x,y,r)=>{const x0=Math.max(0,Math.floor((x-r)*.5)),x1=Math.min(mw-1,Math.ceil((x+r)*.5)),y0=Math.max(0,Math.floor((y-r)*.5)),y1=Math.min(mh-1,Math.ceil((y+r)*.5)),rr=(r+1.42)**2;for(let yy=y0;yy<=y1;yy++)for(let xx=x0;xx<=x1;xx++){const dx=xx*2+1-x,dy=yy*2+1-y;if(dx*dx+dy*dy<=rr&&img[(yy*mw+xx)*4+3]>40)return true;}return false;}};
 const fn=new Function(...Object.keys(env),'k',helpers+';var k_=k;'+branch.replace(/^if \(k === 'foodDensity'\)/,'if (k === \'foodDensity\')')+';return {}');
 // branch text starts "if (k === 'foodDensity') {...}" so it runs directly with k
 const t=Date.now();fn(...Object.values(env),'foodDensity');const ms=Date.now()-t;
 const nf=Math.round(env.cont.w*env.cont.h*dens/2),n=env.food.length,onInk=env.food.filter(f=>env.sepDiskHit(f.x,f.y,1)).length,bad=env.food.filter(f=>!isFinite(f.x+f.y)).length;
 const r={name,nf,n,onInk,nan:bad,ms};console.log(JSON.stringify(r));return r;}
const rs=[
 run('ink text d=0',{ink:'text',dens:0}),run('ink text d=0.025',{ink:'text',dens:0.025}),run('ink text d=0.5 high',{ink:'text',dens:0.5}),
 run('free band d=0.025',{ink:'band',dens:0.025}),run('free band d=0.5',{ink:'band',dens:0.5}),
 run('no free (all ink) d=0.025',{ink:'all',dens:0.025}),run('no free d=0.5',{ink:'all',dens:0.5}),
 run('ink off d=0.025',{ink:'text',dens:0.025,on:0}),run('ink off d=0.5',{ink:'text',dens:0.5,on:0})];
const bad=rs.some(r=>r.onInk>0&&!/ink off/.test(r.name)||r.nan||r.n>r.nf||r.ms>2000);
console.log(bad?'FAIL':'PASS (no ink, finite, bounded by nf)');process.exit(bad?1:0);
