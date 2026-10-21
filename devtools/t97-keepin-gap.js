// keepIn gap parity (625f4e8 port): JS keepIn (live source, has the boundGap fix) vs wasm keep_in (p[57]=gap,
// p[56]=2 keepIn-only). Deterministic: trajectories must be BIT-EXACT, incl. collapsed-range (giant radius) cases.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=fn('keepIn');
const wasm=fs.readFileSync(path.join(__dirname,'..','wasm','target','wasm32-unknown-unknown','release','ca2core.wasm'));
(async()=>{const E=(await WebAssembly.instantiate(wasm,{})).instance.exports;
let fails=0,runs=0,maxDiff=0;
for(const gap of [0,30,80]) for(const R of [10,200,800]) for(const dir of [0,1,2,3]) for(const speed of [3,20]){
 const P={boundGap:gap,boundZone:10,boundForce:3,genomeOn:true};
 const cont={x:100,y:50,w:253,h:591};
 const keepIn=new Function('P','cont','clamp',body+';return keepIn;')(P,cont,(v,a,b)=>v<a?a:v>b?b:v);
 const c={x:180,y:300,vx:0,vy:0,radius:R,maxSpeed:2,g:{bnd:1}};
 const [dx,dy]=[[-1,0],[1,0],[0,-1],[0,1]][dir];c.vx=dx*speed;c.vy=dy*speed;
 const cap=1;E.sim_cells(cap);const cp=E.sim_cells(cap);E.sim_food(2);E.sim_cm(2);const pp=E.sim_params();
 const p=new Float64Array(E.memory.buffer,pp,80);
 p[22]=1;p[23]=10;p[24]=3;p[7]=1;p[49]=cont.x;p[50]=cont.y;p[51]=cont.w;p[52]=cont.h;p[56]=2;p[57]=gap;p[46]=-1e9;p[47]=-1e9;
 const w=new Float64Array(E.memory.buffer,cp,24);w.fill(0);w.set([c.x,c.y,c.vx,c.vy,R,10,0,1,2,1,0,5,0,0,-1,1,0.5,1,0.3,0.3,0.4,0,0,0]);
 E.sim_set_n(1);E.sim_set_nf(0);E.sim_cm_count(0);
 for(let f=0;f<400;f++){c.x+=c.vx;c.y+=c.vy;keepIn(c);
  const w2=new Float64Array(E.memory.buffer,cp,24);w2[0]+=w2[2];w2[1]+=w2[3];E.sim_step(1,2);
  const w3=new Float64Array(E.memory.buffer,cp,24);
  const d=Math.max(Math.abs(c.x-w3[0]),Math.abs(c.y-w3[1]),Math.abs(c.vx-w3[2]),Math.abs(c.vy-w3[3]));
  if(d>maxDiff)maxDiff=d;
  if(d>0){fails++;if(fails<4)console.log('DIVERGE gap',gap,'R',R,'dir',dir,'sp',speed,'f',f,'js',c.x.toFixed(3),c.y.toFixed(3),'wasm',w3[0].toFixed(3),w3[1].toFixed(3));break;}}
 runs++;}
console.log('keepIn gap parity runs:',runs,'fails:',fails,'maxAbsDiff:',maxDiff);
// collapsed-range invariant: giant radius + big gap must end inside [x0,x1]x[y0,y1], never oscillating
})();
