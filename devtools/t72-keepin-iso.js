// keepIn isolation (frozen input, deterministic): cells fired at the wall; JS keepIn vs wasm keep_in (p[56]=2). Compares trajectories + closest edge gap.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=fn('keepIn');
const keepIn=new Function('P','cont','clamp',body+';return keepIn;')(
 {boundZone:+process.env.ZONE||0,boundForce:0.8,genomeOn:true},{x:100,y:50,w:700,h:500},(v,a,b)=>v<a?a:v>b?b:v);
const wasm=fs.readFileSync(path.join(__dirname,'..','wasm','target','wasm32-unknown-unknown','release','ca2core.wasm'));
(async()=>{const E=(await WebAssembly.instantiate(wasm,{})).instance.exports;
const cap=1;E.sim_cells(cap);const cp=E.sim_cells(cap);E.sim_food(2);E.sim_cm(2);const pp=E.sim_params();
const P=()=>new Float64Array(E.memory.buffer,pp,80),C=()=>new Float64Array(E.memory.buffer,cp,24);
const p=P();p[22]=1;p[23]=+process.env.ZONE||0;p[24]=0.8;p[7]=1;p[49]=100;p[50]=50;p[51]=700;p[52]=500;p[56]=2;p[46]=-1e9;p[47]=-1e9;
let maxDiff=0,minJ=1e9,minW=1e9,n=0;const rows=[];
for(const speed of [1,3,6,10,20,30])for(const dir of [0,1,2,3])for(const bnd of [0.6,1,1.4]){
 const R=10,ms=speed,c={x:450,y:300,vx:0,vy:0,radius:R,maxSpeed:ms,g:{bnd}};
 const [dx,dy]=[[-1,0],[1,0],[0,-1],[0,1]][dir];c.vx=dx*speed;c.vy=dy*speed;
 const w=C();w.fill(0);w.set([c.x,c.y,c.vx,c.vy,R,10,0,1,ms,1,0,5,0,0,-1,1,0.5,bnd,0.3,0.3,0.4,0,0,0]);E.sim_set_n(1);E.sim_set_nf(0);E.sim_cm_count(0);
 let gj=1e9,gw=1e9;
 for(let f=0;f<400;f++){c.x+=c.vx;c.y+=c.vy;keepIn(c);
  const w2=C();w2[0]+=w2[2];w2[1]+=w2[3];E.sim_step(1,2);const w3=C();
  const gap=(x,y)=>Math.min(x-100,900-x,y-50,550-y)-R;gj=Math.min(gj,gap(c.x,c.y));gw=Math.min(gw,gap(w3[0],w3[1]));
  maxDiff=Math.max(maxDiff,Math.abs(c.x-w3[0]),Math.abs(c.y-w3[1]),Math.abs(c.vx-w3[2]),Math.abs(c.vy-w3[3]));}
 minJ=Math.min(minJ,gj);minW=Math.min(minW,gw);n++;if(bnd==1&&dir==0)rows.push({speed,jsGap:+gj.toFixed(2),wasmGap:+gw.toFixed(2)});}
console.log('zone',p[23],'runs',n,'maxAbsDiff js vs wasm',maxDiff,'closest edge gap px: js',minJ.toFixed(2),'wasm',minW.toFixed(2));console.log(JSON.stringify(rows));})();
