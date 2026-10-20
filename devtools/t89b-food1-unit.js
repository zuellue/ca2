const fs=require('fs');
WebAssembly.instantiate(fs.readFileSync(__dirname+'/../ca2core.wasm'),{}).then(({instance})=>{
const E=instance.exports, mem=E.memory;
const M=100003, key=(ix,iy)=>(ix+20000)*M+(iy+20000);
function jsFlow(food,x0,y0,x1,y1){let infl=0;for(const f of food){if(f.x<x0||f.x>x1||f.y<y0||f.y>y1){const tx=Math.max(x0+1,Math.min(x1-1,f.x)),ty=Math.max(y0+1,Math.min(y1-1,f.y));f.x+=(tx-f.x)*0.25;f.y+=(ty-f.y)*0.25;infl++;}}return infl;}
function jsTick(food,gs,x0,y0,x1,y1,cw,ch,density){
  const map=new Map(),counts=new Map();
  for(const f of food){const ix=Math.floor(f.x/gs),iy=Math.floor(f.y/gs),k=key(ix,iy);if(!map.has(k))map.set(k,f);}
  map.forEach(ff=>{const ix=Math.floor(ff.x/gs),iy=Math.floor(ff.y/gs);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if(dx||dy){const kk=key(ix+dx,iy+dy);counts.set(kk,(counts.get(kk)||0)+1);}});
  const out=[];let died=0,born=0;
  map.forEach((ff,kk)=>{const n=counts.get(kk)||0;if(n===2||n===3)out.push({x:ff.x,y:ff.y,r:ff.r});else died++;});
  counts.forEach((n,kk)=>{if(n===3&&!map.has(kk)){const ix2=Math.floor(kk/M)-20000,iy2=(kk%M)-20000,nx=(ix2+0.5)*gs,ny=(iy2+0.5)*gs;if(nx>x0&&nx<x1&&ny>y0&&ny<y1){out.push({x:nx,y:ny,r:-1,birth:1});born++;}}});
  const nf=cw*ch*density/2,want=Math.max(40,nf*0.2);const nb=out.length<want?Math.min(60,Math.ceil((want-out.length)/4)):0;
  return{out,died,born,nb};
}
function wasmTick(food,gs,x0,y0,x1,y1,cw,ch,density){
  const n=food.length,cp=E.fd1_in(n),buf=new Float64Array(mem.buffer,cp,n*3+3);
  for(let i=0;i<n;i++){buf[i*3]=food[i].x;buf[i*3+1]=food[i].y;buf[i*3+2]=food[i].r;}
  const m=E.fd1_tick(n,gs,x0,y0,x1,y1,cw,ch,density,Math.floor(Math.random()*4294967296),Math.floor(Math.random()*4294967296));
  const o=new Float64Array(mem.buffer,E.fd1_out(),m*3),st=new Float64Array(mem.buffer,E.fd1_stat(),4);
  const out=[];for(let i=0;i<m;i++)out.push({x:o[i*3],y:o[i*3+1],r:o[i*3+2]});
  return{out,died:st[0],born:st[1]};
}
// tick 1: deterministic survivors/died/births (seeding differs in RNG; compare structure)
const x0=100,y0=100,x1=900,y1=700,gs=4,cw=800,ch=600,density=0.024;
const food=[];for(let i=0;i<2000;i++)food.push({x:x0+Math.random()*cw,y:y0+Math.random()*ch,r:Math.random()});
const j=jsTick(food.map(f=>({...f})),gs,x0,y0,x1,y1,cw,ch,density);
const w=wasmTick(food.map(f=>({...f})),gs,x0,y0,x1,y1,cw,ch,density);
const jSurv=j.out.filter(f=>!f.birth), jBirth=j.out.filter(f=>f.birth);
const wSurv=w.out.slice(0,jSurv.length);
let survExact=jSurv.length>0;
for(let i=0;i<jSurv.length;i++)if(jSurv[i].x!==wSurv[i].x||jSurv[i].y!==wSurv[i].y||jSurv[i].r!==wSurv[i].r)survExact=false;
const wBirth=w.out.slice(jSurv.length,jSurv.length+jBirth.length);
let birthExact=jBirth.length===wBirth.length;
for(let i=0;i<jBirth.length&&birthExact;i++)if(jBirth[i].x!==wBirth[i].x||jBirth[i].y!==wBirth[i].y)birthExact=false;
console.log('survivors:',jSurv.length,'exact:',survExact,'| died js/wasm:',j.died,w.died,j.died===w.died,'| births js/wasm:',jBirth.length,wBirth.length,'exact:',birthExact,'| wasm seeds:',w.out.length-jSurv.length-jBirth.length,'js nb blobs:',j.nb);
// flow exactness over 50 frames
const f2=[];for(let i=0;i<500;i++)f2.push({x:Math.random()*1200-100,y:Math.random()*900-100,r:Math.random()});
const fj=f2.map(f=>({...f})),fw=f2.map(f=>({...f}));
for(let fr=0;fr<50;fr++){jsFlow(fj,x0,y0,x1,y1);
  const cp=E.fd1_in(fw.length),buf=new Float64Array(mem.buffer,cp,fw.length*3+3);
  for(let i=0;i<fw.length;i++){buf[i*3]=fw[i].x;buf[i*3+1]=fw[i].y;buf[i*3+2]=fw[i].r;}
  E.fd1_flow(fw.length,x0,y0,x1,y1);
  for(let i=0;i<fw.length;i++){fw[i].x=buf[i*3];fw[i].y=buf[i*3+1];}}
let flowMax=0;for(let i=0;i<f2.length;i++)flowMax=Math.max(flowMax,Math.abs(fj[i].x-fw[i].x),Math.abs(fj[i].y-fw[i].y));
console.log('flow max diff over 50 frames (must be 0):',flowMax);
// bench: flow on 2000 dots x 2000 frames; tick on 2000 dots x 300 ticks
let t=performance.now();for(let i=0;i<2000;i++)jsFlow(food,x0,y0,x1,y1);const jfl=(performance.now()-t)/2000;
t=performance.now();for(let i=0;i<300;i++)jsTick(food,gs,x0,y0,x1,y1,cw,ch,density);const jtk=(performance.now()-t)/300;
const wf=food.map(f=>({...f}));
t=performance.now();for(let i=0;i<2000;i++){const n=wf.length,cp=E.fd1_in(n),buf=new Float64Array(mem.buffer,cp,n*3+3);for(let k=0;k<n;k++){buf[k*3]=wf[k].x;buf[k*3+1]=wf[k].y;buf[k*3+2]=wf[k].r;}E.fd1_flow(n,x0,y0,x1,y1);for(let k=0;k<n;k++){wf[k].x=buf[k*3];wf[k].y=buf[k*3+1];}}
const wfl=(performance.now()-t)/2000;
t=performance.now();for(let i=0;i<300;i++)wasmTick(food,gs,x0,y0,x1,y1,cw,ch,density);const wtk=(performance.now()-t)/300;
console.log(`bench 2000 dots: flow js ${jfl.toFixed(4)} -> wasm ${wfl.toFixed(4)} ms; tick js ${jtk.toFixed(4)} -> wasm ${wtk.toFixed(4)} ms (incl pack/unpack)`);
});
