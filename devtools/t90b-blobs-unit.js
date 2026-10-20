const fs=require('fs');
WebAssembly.instantiate(fs.readFileSync(__dirname+'/../ca2core.wasm'),{}).then(({instance})=>{
const E=instance.exports, mem=E.memory;
const x0=100,y0=100,x1=900,y1=700;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function jsPass(blobs,tt){
  for(let i=0;i<blobs.length;i++){const b=blobs[i];
    b.vx=b.vx*0.95+(Math.random()-0.5)*0.12;b.vy=b.vy*0.95+(Math.random()-0.5)*0.12;
    for(let k=0;k<blobs.length;k++)if(k!==i){const o=blobs[k],dx=b.x-o.x,dy=b.y-o.y,d2=dx*dx+dy*dy;if(d2<900&&d2>1){const dd=Math.sqrt(d2);b.vx+=dx/dd*0.02;b.vy+=dy/dd*0.02;}}
    b.x+=b.vx;b.y+=b.vy;
    if(b.x<x0||b.x>x1||b.y<y0||b.y>y1){b.x+=(clamp(b.x,x0+4,x1-4)-b.x)*0.25;b.y+=(clamp(b.y,y0+4,y1-4)-b.y)*0.25;}
    const rr=b.r*(1+0.25*Math.sin(tt*b.w+b.ph))*(0.6+0.08*b.d.length);
    for(const f of b.d){const ang=f.a+tt*0.25*b.w,rad=rr*(0.45+0.55*Math.abs(Math.sin(tt*f.f+f.q)));f.x=b.x+Math.cos(ang)*rad;f.y=b.y+Math.sin(ang)*rad;}
  }
}
function wasmPass(blobs,tt){
  let nb=blobs.length,nd=0;for(const b of blobs)nd+=b.d.length;
  const bp=E.fb_blobs(nb),dp=E.fb_dots(nd);
  const bb=new Float64Array(mem.buffer,bp,nb*7+7),db=new Float64Array(mem.buffer,dp,nd*6+6);
  let j=0;
  for(let i=0;i<nb;i++){const b=blobs[i];bb[i*7]=b.x;bb[i*7+1]=b.y;bb[i*7+2]=b.vx;bb[i*7+3]=b.vy;bb[i*7+4]=b.r;bb[i*7+5]=b.ph;bb[i*7+6]=b.w;
    for(const f of b.d){db[j*6]=f.a;db[j*6+1]=f.f;db[j*6+2]=f.q;db[j*6+3]=i;j++;}}
  if(E.fb_run(nb,nd,tt,x0,y0,x1,y1,Math.floor(Math.random()*4294967296),Math.floor(Math.random()*4294967296))<0)throw 'fb_run';
  j=0;
  for(let i=0;i<nb;i++){const b=blobs[i];b.x=bb[i*7];b.y=bb[i*7+1];b.vx=bb[i*7+2];b.vy=bb[i*7+3];
    for(const f of b.d){f.x=db[j*6+4];f.y=db[j*6+5];j++;}}
}
function mkBlobs(n){const B=[];for(let i=0;i<n;i++){const b={x:x0+Math.random()*800,y:y0+Math.random()*600,vx:0,vy:0,r:8+Math.random()*10,ph:Math.random()*6.28,w:0.3+Math.random()*0.6,d:[]};const m=3+Math.floor(Math.random()*5);for(let k=0;k<m;k++)b.d.push({a:Math.random()*6.28,f:0.5+Math.random()*1.5,q:Math.random()*6.28,x:0,y:0});B.push(b);}return B;}
// determinism check with jitter removed is impossible (RNG differs); compare structure over 200 frames
const jb=mkBlobs(40),wb=JSON.parse(JSON.stringify(jb));
let t=1000;
for(let f=0;f<200;f++){t+=0.0167;jsPass(jb,t);wasmPass(wb,t);}
let nan=0,maxDiv=0,sumDiv=0,n=0;
for(let i=0;i<40;i++){const a=jb[i],b=wb[i];
  for(const v of [b.x,b.y,b.vx,b.vy])if(!isFinite(v))nan++;
  const div=Math.hypot(a.x-b.x,a.y-b.y);maxDiv=Math.max(maxDiv,div);sumDiv+=div;n++;
  for(let k=0;k<a.d.length;k++){if(!isFinite(b.d[k].x)||!isFinite(b.d[k].y))nan++;}}
console.log('after 200 frames: NaN:',nan,'blob pos divergence avg/max:',(sumDiv/n).toFixed(1),maxDiv.toFixed(1),'(chaotic jitter, velocities decorrelate)');
// ring-consistency: dots must sit at rr-ish distance from their blob center
let ringOk=true;
for(let i=0;i<40;i++){const b=wb[i];for(const f of b.d){const d=Math.hypot(f.x-b.x,f.y-b.y);if(d>b.r*2.5||!isFinite(d))ringOk=false;}}
console.log('dot ring placement sane:',ringOk);
// bench: 200 blobs x 8 dots, 500 frames
const bb2=mkBlobs(200);
t=performance.now();for(let f=0;f<500;f++)jsPass(bb2,1000+f*0.0167);const jt=(performance.now()-t)/500;
const wb2=mkBlobs(200);
t=performance.now();for(let f=0;f<500;f++)wasmPass(wb2,1000+f*0.0167);const wt=(performance.now()-t)/500;
console.log(`bench 200 blobs x ~8 dots: js ${jt.toFixed(4)} -> wasm ${wt.toFixed(4)} ms/frame (incl pack/unpack)`);
});
