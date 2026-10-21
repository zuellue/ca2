// keepIn-only bench: before (HEAD binary) vs after (boundGap port). p[56]=2 isolation, 300 cells pressed to walls.
const fs=require('fs');
async function bench(file,gap){
 const E=(await WebAssembly.instantiate(fs.readFileSync(file),{})).instance.exports;
 const n=300;E.sim_cells(n+256);const cp=E.sim_cells(n+256);E.sim_food(2);E.sim_cm(2);const pp=E.sim_params();
 const p=new Float64Array(E.memory.buffer,pp,80);
 p[22]=1;p[23]=70;p[24]=0.8;p[7]=1;p[49]=100;p[50]=50;p[51]=700;p[52]=500;p[56]=2;p[46]=-1e9;p[47]=-1e9;if(p.length>57)p[57]=gap;
 const C=new Float64Array(E.memory.buffer,cp,n*24);
 for(let i=0;i<n;i++){const b=i*24;C[b]=100+Math.random()*700;C[b+1]=50+Math.random()*500;C[b+2]=(Math.random()-0.5)*40;C[b+3]=(Math.random()-0.5)*40;C[b+4]=i%7===0?800:10+Math.random()*20;C[b+8]=2;C[b+16]=0.5;C[b+17]=1;}
 E.sim_set_n(n);E.sim_set_nf(0);E.sim_cm_count(0);
 for(let f=0;f<50;f++)E.sim_step(1,2); // warm
 const t=performance.now();for(let f=0;f<2000;f++)E.sim_step(1,2);return (performance.now()-t)/2000;
}
(async()=>{
 const before0=await bench('/tmp/ca2core-before.wasm',0);
 const after0=await bench('ca2core.wasm',0);
 const after30=await bench('ca2core.wasm',30);
 console.log(`keepIn-only 300 cells: before(gap n/a) ${before0.toFixed(4)} ms -> after gap=0 ${after0.toFixed(4)} ms, after gap=30 ${after30.toFixed(4)} ms`);
})();
