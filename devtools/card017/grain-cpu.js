/* Opt-in CPU reference for grain.js. No production dispatch changes.
 * Input/output RGBA bytes use top-left row order; texture math uses bottom-left.
 * Float32 hash intermediates match GLSL highp intent. GPU contraction/texture
 * precision can still differ: compare actual output, never assume bit parity.
 */
(function(root){
'use strict';
const f=Math.fround, clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const mod=(x,n)=>x-n*Math.floor(x/n), fract=x=>x-Math.floor(x);
const mix=(a,b,t)=>a*(1-t)+b*t;
function smooth(a,b,x){const t=clamp((x-a)/(b-a));return t*t*(3-2*t);}
function hash(p){p=f(fract(f(f(p)*f(.1031))));p=f(p*f(p+f(33.33)));p=f(p*f(p+p));return fract(p);}
function render(src,w,h,g,bucket,dpr,overlay,hex){
 const bn=Uint8Array.from(hex.match(/../g),x=>parseInt(x,16));
 const tex=(x,y)=>{x=mod(x,64);y=mod(y,64);return bn[Math.floor(y)*64+Math.floor(x)]/255;};
 function linear(x,y){const ix=Math.floor(x),iy=Math.floor(y),a=x-ix,b=y-iy;return mix(mix(tex(ix,iy),tex(ix+1,iy),a),mix(tex(ix,iy+1),tex(ix+1,iy+1),a),b);}
 function sample(x,y,size,salt,ts){
  x=f(x/Math.max(size,.01)); y=f(y/Math.max(size,.01));
  const tx=Math.floor(x/64),ty=Math.floor(y/64);
  const hh=hash(f(f(f(f(tx*41)+f(ty*113))+f(salt*7))+f(mod(bucket,256)*ts)));
  let sel=Math.floor(hh*8),oh=hash(f(f(hh*289)+5));
  let px=mod(mod(x,64)+Math.floor(oh*64),64),py=mod(mod(y,64)+Math.floor(hash(f(f(oh*289)+1))*64),64);
  if(sel>=4){px=mod(64-px,64);sel-=4;}
  let xx=px,yy=py;
  if(sel===1){xx=py;yy=mod(64-px,64);}else if(sel===2){xx=mod(64-px,64);yy=mod(64-py,64);}else if(sel===3){xx=mod(64-py,64);yy=px;}
  const raw=(linear(xx+.5,yy+.5)+linear(xx,yy)+linear(xx-.5,yy-.5)+linear(xx,yy))*.25;
  const amp=hash(f(f(f(f(mod(Math.floor(x),512)*f(.770))+f(mod(Math.floor(y),512)*f(.313)))+f(salt*f(1.37)))+f(mod(bucket,256)*ts)));
  return (raw*2-1)*amp;
 }
 function soft(x,y,size,salt,ts){const r=size*.5;return mix(sample(x,y,size,salt,ts),(sample(x+r,y,size,salt,ts)+sample(x-r,y,size,salt,ts)+sample(x,y+r,size,salt,ts)+sample(x,y-r,size,salt,ts))*.25,clamp(g.softness));}
 const fr=g.fineRatio??.5,cr=g.cloudRatio??2.2;
 const ws=[g.fine,g.crystal,g.cloud].map(x=>Math.max(x,0)),sum=Math.max(ws.reduce((a,b)=>a+b),.001);
 const scale=g.resAdapt?(h<700?2:h<1100?1:.5):1,density=g.resAdapt?(h<700?.7:h<1100?1:.85):1;
 const size=Math.max(.3,g.size*dpr)*scale*clamp(Math.sqrt(1600/Math.max(h,1)),.5,1);
 function layers(x,y,ch){return (soft(x,y,size*fr,3+ch,f(3.30277563773+ch))*ws[0]+soft(x,y,size,11+ch,f(19.61803398875+ch))*ws[1]+soft(x,y,size*cr,29+ch,f(7.41421356237+ch))*ws[2])/sum*g.development;}
 function rgb(x,y){x=clamp(x,0,w-1);y=clamp(y,0,h-1);let i=(y*w+x)*4;return [src[i]/255,src[i+1]/255,src[i+2]/255];}
 const lum=c=>c[0]*.299+c[1]*.587+c[2]*.114;
 const out=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const col=rgb(x,y),l=lum(col),px=x+.5,py=h-y-.5;let result;
  if(g.debug){const d=soft(px,py,size,11,f(19.61803398875))*50;result=[...col.map(v=>clamp(v+d)),1];}
  else{
   const dev=(l-.4)/.45,adaptL=clamp(Math.exp(-dev*dev)+.12*(1-smooth(0,.30,l))+.20*smooth(.5,.85,l),0,1.05);
   const sw=1-smooth(0,.15,l),hw=smooth(.95,1,l),mw=clamp(1-sw-hw);
   const zone=sw*(g.shadow??1.8)+mw*(g.mid??1.5)+hw*(g.high??2.7);
   let a=0,b=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const v=lum(rgb(x+dx,y+dy));a+=v;b+=v*v;}
   const variance=Math.max(0,b/9-(a/9)**2),motion=smooth(.02,.10,Math.abs(l-lum(rgb(x+2,y))))*.2;
   const amp=adaptL*zone*(g.strength/10)*g.amount*1.4*(1-smooth(.05,.35,.10)*.5)*mix(.8,1.2,.2)*density*(1-smooth(0,.008,variance)*.35)*(1+.12*motion);
   let v=[0,17,37].map(ch=>layers(px,py,ch));const gl=lum(v),skew=-(g.skew??0)*(l-.5);
   if(g.mono){let z=gl+skew;v=[0,0,0].map(()=>Math.sign(z)*Math.pow(Math.abs(z),.85));}
   else v=v.map((z,i)=>(mix(z,gl,g.chroma)+skew)*mix(1,(g.stock??[.95,.92,1.05])[i],clamp(g.chroma*4)));
   const gn=v.map(z=>z*amp);
   if(overlay){const alpha=clamp(Math.max(...gn.map(Math.abs))*8);result=[...col.map((v,i)=>clamp(v+gn[i]/Math.max(alpha,.001))*alpha),alpha];}
   else result=[...col.map((v,i)=>clamp(v+gn[i])),1];
  }
  let i=(y*w+x)*4;for(let k=0;k<4;k++)out[i+k]=result[k]*255;
 }
 return out;
}
root.CA2GrainCPU={render};
})(typeof window==='undefined'?globalThis:window);
