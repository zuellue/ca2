const fs=require('fs');
WebAssembly.instantiate(fs.readFileSync(__dirname+'/../ca2core.wasm'),{}).then(({instance})=>{
const E=instance.exports, mem=E.memory;
const x0=100,y0=100,x1=900,y1=700;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function jsK(food){for(const f of food){if(f.x<x0||f.x>x1||f.y<y0||f.y>y1){f.x=clamp(f.x,x0,x1);f.y=clamp(f.y,y0,y1);if(f.vx!==undefined){f.vx*=0.5;f.vy*=0.5;}}}}
function wasmK(food){const n=food.length,ip=E.fk_in(n),buf=new Float64Array(mem.buffer,ip,n*5+5);
  for(let i=0;i<n;i++){const f=food[i],b=i*5;buf[b]=f.x;buf[b+1]=f.y;if(f.vx!==undefined){buf[b+2]=f.vx;buf[b+3]=f.vy;buf[b+4]=1;}else buf[b+4]=0;}
  if(E.fk_run(n,x0,y0,x1,y1)<0)throw 'fk_run';
  for(let i=0;i<n;i++){const f=food[i],b=i*5;f.x=buf[b];f.y=buf[b+1];if(buf[b+4]){f.vx=buf[b+2];f.vy=buf[b+3];}}}
const food=[];for(let i=0;i<2000;i++){const f={x:Math.random()*1400-200,y:Math.random()*1100-200,r:Math.random()};if(i%2)f.vx=Math.random()*2-1,f.vy=Math.random()*2-1;food.push(f);}
const a=food.map(f=>({...f})),b2=food.map(f=>({...f}));
jsK(a);wasmK(b2);
let maxD=0;for(let i=0;i<2000;i++){maxD=Math.max(maxD,Math.abs(a[i].x-b2[i].x),Math.abs(a[i].y-b2[i].y));if(a[i].vx!==undefined)maxD=Math.max(maxD,Math.abs(a[i].vx-b2[i].vx),Math.abs(a[i].vy-b2[i].vy));}
console.log('keepIn max diff (must be 0):',maxD);
let t=performance.now();for(let i=0;i<2000;i++)jsK(food);const jt=(performance.now()-t)/2000;
t=performance.now();for(let i=0;i<2000;i++)wasmK(food);const wt=(performance.now()-t)/2000;
console.log(`bench 2000 dots all-stray: js ${jt.toFixed(4)} -> wasm ${wt.toFixed(4)} ms (incl pack/unpack; clean frames skip marshal entirely)`);
});
