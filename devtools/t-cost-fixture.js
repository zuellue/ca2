const fs=require('fs');const F=JSON.parse(fs.readFileSync(''+__dirname+'/t-cost-fixture.json','utf8'));
const R=__dirname+'/../';
const bins=[['default-shipped-nonSIMD',R+'ca2core.wasm',0],['default-spikeSrc-nonSIMD',R+'wasm/target/wasm32-unknown-unknown/release/ca2core.wasm',0],['jsrnd-nonSIMD',R+'ca2core-jsrnd.wasm',1],
 ['default-shipped-SIMD',R+'ca2core-simd.wasm',0],['default-spikeSrc-SIMD',R+'wasm/target-simd/wasm32-unknown-unknown/release/ca2core.wasm',0],['jsrnd-SIMD',R+'ca2core-jsrnd-simd.wasm',1]];
const stream=new Float64Array(1<<16);{let a=7;for(let i=0;i<stream.length;i++){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;stream[i]=((t^t>>>14)>>>0)/4294967296;}}
function run(name,path,jr,K){let k=0,calls=0;const imp={env:{js_rnd:function(ln){calls++;return stream[k++&65535];}}};
 const m=new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(path)),jr?imp:{});const E=m.exports,mem=E.memory;
 const n=F.n,nf=F.nf,ncm=F.ncm,cap=n+256;
 function setup(){E.sim_cells(cap);E.sim_food(nf+1);E.sim_cm(ncm+1);
  const cp=E.sim_cells_ptr?E.sim_cells_ptr():E.sim_cells(cap);const fxp=E.sim_food(nf+1),fyp=E.sim_food_y(),cmp=E.sim_cm(ncm+1),cip=E.sim_cm_ids(),pp=E.sim_params();
  const b=mem.buffer;const cf=new Float64Array(b,E.sim_cells(cap),cap*24);cf.fill(0);cf.set(F.cells);
  new Float64Array(b,E.sim_shp_ptr(),cap*12).set(F.shp);
  E.sim_set_n(n);E.sim_set_nf(nf);new Float64Array(b,fxp,nf+1).set(F.fx);new Float64Array(b,fyp,nf+1).set(F.fy);
  new Float64Array(b,cmp,(ncm+1)*5).set(F.cmf);new Float64Array(b,cip,ncm+1).set(F.cid);E.sim_cm_count(ncm);
  const p=new Float64Array(b,pp,jr?100:96);p.set(F.p);if(jr){p[96]=240;p[97]=0.3;}}
 const ts=[];let nb=0;
 for(let i=0;i<K+200;i++){setup();k=0;calls=0;const t=process.hrtime.bigint();if(jr)E.sim_step(0,0);else E.sim_step(123456789,987654321);const d=Number(process.hrtime.bigint()-t);if(i>=200)ts.push(d);}
 ts.sort((a,b)=>a-b);const o=new Float64Array(mem.buffer,E.sim_out(),32);
 return {name,usMed:ts[ts.length>>1]/1000,usP10:ts[ts.length/10|0]/1000,usP90:ts[ts.length*0.9|0]/1000,calls,nOut:o[15],n};}
const K=+process.argv[2]||3000;const res=[];
for(let rep=0;rep<3;rep++)for(const [nm,pa,jr] of bins){try{res.push(Object.assign({rep},run(nm,pa,jr,K)));}catch(e){res.push({rep,name:nm,err:String(e).slice(0,120)});}}
for(const r of res)console.log(JSON.stringify(r));
