// pure-node: mask with zero free pixels: foodInkGuard drops every dot (no ink retention, no NaN); with free pixels none stay on ink
const fs=require('fs'),src=fs.readFileSync(__dirname+'/../ca2.js','utf8');
const a=src.indexOf('  function foodInkOn()'),b=src.indexOf('  function separatorPass()');
function run(freeBand){const mw=100,mh=60,img=new Uint8ClampedArray(mw*mh*4);for(let i=0;i<mw*mh;i++)img[i*4+3]=255;if(freeBand)for(let y=26;y<34;y++)for(let x=0;x<mw;x++)img[(y*mw+x)*4+3]=0;
 const env={postOffW:()=>true,inkW:()=>false,WC:{},W:mw*2,H:mh*2,COS8:[1,.7071,0,-.7071,-1,-.7071,0,.7071],SIN8:[0,.7071,1,.7071,0,-.7071,-1,-.7071],P:{separatorOn:1,showHud:1,foodSize:2},SEP:{img,mw,mh},
 sepDiskHit:(x,y,r)=>{const x0=Math.max(0,Math.floor((x-r)*.5)),x1=Math.min(mw-1,Math.ceil((x+r)*.5)),y0=Math.max(0,Math.floor((y-r)*.5)),y1=Math.min(mh-1,Math.ceil((y+r)*.5)),rr=(r+1.42)**2;for(let yy=y0;yy<=y1;yy++)for(let xx=x0;xx<=x1;xx++){const dx=xx*2+1-x,dy=yy*2+1-y;if(dx*dx+dy*dy<=rr&&img[(yy*mw+xx)*4+3]>40)return true;}return false;},
 food:[]};
 for(let i=0;i<200;i++)env.food.push({x:Math.random()*196+2,y:Math.random()*116+2,blob:{}});
 const g=new Function(...Object.keys(env),a?src.slice(a,b)+';return function(){foodInkGuard();return food}':'')(...Object.values(env));
 const out=g();return {free:!!freeBand,left:out.length,onInk:out.filter(f=>env.sepDiskHit(f.x,f.y,1)).length,nan:out.filter(f=>!isFinite(f.x+f.y)).length};}
const r0=run(0),r1=run(1);console.log(JSON.stringify(r0),JSON.stringify(r1));process.exit(r0.left||r0.nan||r1.onInk||r1.nan?1:0);
