// t135: production-page ABI regression. The page packs/reads the wasm cell buffer with a fixed stride (simW in ca2.js); sim.rs ST must match, plain AND simd.
// Static: stride literals in simW vs `pub const ST` in sim.rs. Runtime: three well separated, motionless cells packed at the PAGE stride must come back unchanged in position (a stride mismatch corrupts cell 1+).
// usage: node devtools/t135-page-abi-stride.js [path/to/ca2.js] [wasm paths...]   exit 1 on any mismatch
const fs=require('fs'),path=require('path');
const jsPath=process.argv[2]||path.join(__dirname,'..','test','ca2.js');
const wasms=process.argv.length>3?process.argv.slice(3):[path.join(__dirname,'..','test','ca2core.wasm'),path.join(__dirname,'..','test','ca2core-simd.wasm')];
const src=fs.readFileSync(jsPath,'utf8');
const m=src.match(/var SIM_STRIDE = (\d+)/);const pageST=m?+m[1]:NaN;
const i0=src.indexOf('function simW(');if(i0<0)throw new Error('simW not found');
const body=src.slice(i0,i0+9000);const hard=[...body.matchAll(/(?:cap|i) \* (\d{2,})/g)].map(x=>x[0]);
const rs=fs.readFileSync(path.join(__dirname,'..','wasm','src','sim.rs'),'utf8').match(/pub const ST: usize = (\d+)/);
const rustST=rs?+rs[1]:NaN;
let fail=false;console.log('page SIM_STRIDE',pageST,'| sim.rs ST',rustST,'| hardcoded stride literals left in simW:',hard.length);
if(!(pageST===rustST)){console.log('FAIL static: page stride and sim.rs ST differ');fail=true;}
if(hard.length){console.log('FAIL static: simW still has literal strides',hard.join(' '));fail=true;}
const ST=pageST;
(async()=>{for(const w of wasms){const E=(await WebAssembly.instantiate(fs.readFileSync(w),{})).instance.exports;
 if(!E.sim_stride){console.log(path.basename(w),'FAIL: wasm has no sim_stride export');fail=true;continue;}
 if(E.sim_stride()!==ST){console.log(path.basename(w),'FAIL: wasm stride',E.sim_stride(),'!= page',ST);fail=true;continue;}
 const cap=3+256;E.sim_cells(cap);E.sim_food(2);E.sim_cm(2);const cp=E.sim_cells(cap);E.sim_food(2);const pp=E.sim_params();
 const cf=new Float64Array(E.memory.buffer,cp,cap*ST);cf.fill(0);
 const xs=[[500,500],[1500,500],[2500,500]];xs.forEach(([x,y],i)=>{const b=i*ST;cf.set([x,y,0,0,10,10,0,1,0.5,1,0,5,0,0,-1,1,.5,1,.3,.3,.4,0,0,0],b);});
 E.sim_set_n(3);E.sim_set_nf(0);E.sim_cm_count(0);const p=new Float64Array(E.memory.buffer,pp,80);p[0]=200;p[56]=1;
 E.sim_step(1,2);const c2=new Float64Array(E.memory.buffer,E.sim_cells_ptr(),cap*ST);
 const got=xs.map((_,i)=>[c2[i*ST],c2[i*ST+1],c2[i*ST+7]]);const bad=got.some((g,i)=>g[0]!==xs[i][0]||g[1]!==xs[i][1]||g[2]!==1);
 console.log(path.basename(w),'stride',ST,'cells back',JSON.stringify(got),bad?'FAIL':'ok');if(bad)fail=true;}
 console.log(fail?'FAIL':'PASS');process.exit(fail?1:0);})();
