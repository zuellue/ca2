const fs=require('fs');
const wc=fs.readFileSync(__dirname+'/../ca2core.wasm');
WebAssembly.instantiate(wc,{}).then(({instance})=>{
const E=instance.exports, mem=E.memory;
function r01(){return Math.random();}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// synthetic cells: mix of chasers (dst, alive), pending (dl>el), dying, dead, no-dst
const N=200, cells=[];
for(let i=0;i<N;i++){
  const c={x:400+Math.random()*400, y:300+Math.random()*300, radius:4+Math.random()*4, mutationRate:0.5+Math.random()*4, alive:1,
    dst:[400+Math.random()*400, 300+Math.random()*300], dl:Math.random()*600, durK:0.55+Math.random()*0.45, pace:0.5+Math.random(), bend:Math.random()<0.25?0:(Math.random()*2-1), dying:i%7===0};
  if(i%11===0)c.alive=0; if(i%13===0)c.dst=null; cells.push(c);
}
const t0=0, dur=3000, CR=6;
function jsStep(cells, now, dt, plan){
  let deaths=0, open=0; const late=now-t0>dur*1.5;
  for(const c of cells){ c.radius += (CR-c.radius)*Math.min(1,0.004*c.mutationRate);
    if(!plan||!c.dst||!c.alive) continue;
    const dx=c.dst[0]-c.x, dy=c.dst[1]-c.y, d=Math.hypot(dx,dy);
    const el=now-t0-(c.dl||0); if(el<=0){open++;continue;}
    const win=Math.max(80,dur*(c.durK||1)), pr=clamp(el/win,0,1);
    const kc=1-Math.exp(-dt*3/win), ease=0.35+0.65*Math.sin(pr*Math.PI), k=Math.min(1,kc*c.pace*ease*1.31);
    c.x+=dx*k+(Math.random()-0.5)*0.6; c.y+=dy*k+(Math.random()-0.5)*0.6;
    if(c.bend){const lat=k*Math.min(d,200)*c.bend*0.35*Math.sin(pr*Math.PI), il=1/(d||1); c.x+=-dy*il*lat; c.y+=dx*il*lat;}
    if(c.dying&&(d<14||(late&&Math.random()<0.08))){c.alive=0;deaths++;continue;}
    if(d>14)open++;
  }
  return {open,deaths};
}
function wasmStep(cells, now, dt, plan){
  const n=cells.length, cp=E.tr_cells(n), cf=new Float64Array(mem.buffer,cp,n*13+13);
  for(let i=0;i<n;i++){const c=cells[i],b=i*13; cf[b]=c.x;cf[b+1]=c.y;cf[b+2]=c.radius;cf[b+3]=c.mutationRate;cf[b+4]=c.alive?1:0;
    if(plan&&c.dst&&c.alive){cf[b+5]=c.dst[0];cf[b+6]=c.dst[1];cf[b+7]=c.dl;cf[b+8]=c.durK;cf[b+9]=c.pace;cf[b+10]=c.bend;cf[b+11]=c.dying?1:0;cf[b+12]=1;}else cf[b+12]=0;}
  const open=E.tr_run(n,now,dt,t0,dur,CR,plan?1:0,Math.floor(Math.random()*4294967296),Math.floor(Math.random()*4294967296));
  const st=new Float64Array(mem.buffer,E.tr_stat(),4);
  for(let i=0;i<n;i++){const c=cells[i],b=i*13;c.x=cf[b];c.y=cf[b+1];c.radius=cf[b+2];c.alive=cf[b+4]!==0;}
  return {open,deaths:st[0]};
}
// run 120 frames both populations (fresh copies each population)
const jCells=cells.map(c=>({...c,dst:c.dst?[...c.dst]:null}));
const wCells=cells.map(c=>({...c,dst:c.dst?[...c.dst]:null}));
let jOpen=0,wOpen=0,jD=0,wD=0;
for(let f=0;f<120;f++){const now=f*16.7,dt=16.7;
  const r1=jsStep(jCells,now,dt,true); jOpen+=r1.open;jD+=r1.deaths;
  const r2=wasmStep(wCells,now,dt,true); wOpen+=r2.open;wD+=r2.deaths;}
// drift exactness: radius should match bit-for-bit
let radMaxDiff=0, posSum=0,posN=0, aliveMismatch=0;
for(let i=0;i<N;i++){radMaxDiff=Math.max(radMaxDiff,Math.abs(jCells[i].radius-wCells[i].radius));
  if(jCells[i].alive&&wCells[i].alive&&jCells[i].dst){posSum+=Math.hypot(jCells[i].x-wCells[i].x,jCells[i].y-wCells[i].y);posN++;}
  if(!!jCells[i].alive!==!!wCells[i].alive)aliveMismatch++;}
console.log('radius max diff (must be ~0):', radMaxDiff);
console.log('open totals js/wasm:', jOpen, wOpen, 'deaths js/wasm:', jD, wD, 'alive mismatch:', aliveMismatch);
console.log('avg positional divergence (chaotic jitter, expect small):', (posSum/posN).toFixed(2));
// bench: 5000 cells, 200 frames
const M=5000, bc=[];
for(let i=0;i<M;i++)bc.push({x:Math.random()*800,y:Math.random()*600,radius:6,mutationRate:2,alive:1,dst:[Math.random()*800,Math.random()*600],dl:0,durK:0.8,pace:1,bend:0.3,dying:false});
let t=performance.now(); for(let f=0;f<200;f++)jsStep(bc,f*16.7,16.7,true); const jt=(performance.now()-t)/200;
const bc2=bc.map(c=>({...c,dst:[...c.dst]}));
t=performance.now(); for(let f=0;f<200;f++)wasmStep(bc2,f*16.7,16.7,true); const wt=(performance.now()-t)/200;
console.log(`bench 5000 cells/frame: js ${jt.toFixed(4)} ms, wasm ${wt.toFixed(4)} ms (incl pack/unpack)`);
});
