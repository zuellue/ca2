// pure-node: foodPushOut leaves no dot on ink for random glyph-like masks (dots deep in ink, near edges)
const fs=require('fs'),src=fs.readFileSync(__dirname+'/../ca2.js','utf8');
const a=src.indexOf('  function foodInkOn()'),b=src.indexOf('  function foodInkGuard()');
const code=src.slice(a,b);
let bad=0,tot=0,nobk=0;
for(let trial=0;trial<200;trial++){
 const mw=190,mh=115,img=new Uint8ClampedArray(mw*mh*4);
 for(let k=0;k<40;k++){const cx=Math.random()*mw,cy=Math.random()*mh,r=2+Math.random()*(trial%2?25:8);for(let y=0;y<mh;y++)for(let x=0;x<mw;x++)if((x-cx)**2+(y-cy)**2<r*r)img[(y*mw+x)*4+3]=255;}
 const env={W:mw*2,H:mh*2,COS8:[1,.7071,0,-.7071,-1,-.7071,0,.7071],SIN8:[0,.7071,1,.7071,0,-.7071,-1,-.7071],P:{separatorOn:1,showHud:1,foodSize:2},SEP:{img,mw,mh},
  sepDiskHit:(x,y,r)=>{if(!img)return false;const x0=Math.max(0,Math.floor((x-r)*.5)),x1=Math.min(mw-1,Math.ceil((x+r)*.5)),y0=Math.max(0,Math.floor((y-r)*.5)),y1=Math.min(mh-1,Math.ceil((y+r)*.5)),rr=(r+1.42)*(r+1.42);for(let yy=y0;yy<=y1;yy++)for(let xx=x0;xx<=x1;xx++){const dx=xx*2+1-x,dy=yy*2+1-y;if(dx*dx+dy*dy<=rr&&img[(yy*mw+xx)*4+3]>40)return true;}return false;}};
 const f=new Function(...Object.keys(env),code+';return {foodPushOut,foodOnInk};')(...Object.values(env));
 for(let i=0;i<300;i++){const d={x:Math.random()*mw*2,y:Math.random()*mh*2};if(!f.foodOnInk(d.x,d.y))continue;tot++;f.foodPushOut(d);if(f.foodOnInk(d.x,d.y)){bad++;console.log("fail at",d.x.toFixed(1),d.y.toFixed(1),"page",mw*2,mh*2);}}
}
console.log({tot,stillOnInk:bad});process.exit(bad?1:0);
