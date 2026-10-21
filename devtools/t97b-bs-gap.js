// bs.rs emitCell wall-squeeze parity (625f4e8 port): JS emitCell (live source, has squeeze) vs wasm bs_run.
// Deterministic path: sources must match to f32/sin ULP; wasm output must never cross the gap line.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const emitSrc=fn('emitCell');
WebAssembly.instantiate(fs.readFileSync(path.join(__dirname,'..','ca2core.wasm')),{}).then(({instance})=>{
const E=instance.exports,mem=E.memory;
let fails=0,cross=0,jcross=0,checks=0,maxD=0;
for(const [W,H] of [[253,591],[1200,700]]) for(const gap of [0,30,80]) for(const radius of [10,100,400,800]) for(let k=0;k<100;k++){
  const cont={x:0,y:0,w:W,h:H};
  const shp=k%3===1?{t:1,th:0.4,asp:3,dir:Math.random()*6.28,wsp:0.5,ph:1,wig:0.5,sat:0,ph2:0}:k%3===2?{t:2,wsp:0.5,ph:1,sat:4,ph2:2,th:0,asp:0,dir:0,wig:0}:{t:0,th:0,asp:0,dir:0,wsp:0,ph:0,wig:0,sat:0,ph2:0};
  const c={x:Math.random()*W,y:Math.random()*H,radius,shp};
  const P={boundGap:gap,cellShapes:1};
  const o={x:[],y:[],r:[],n:0};
  new Function('P','cont','clamp','c','t0','allowance','o',emitSrc+';emitCell(c,t0,allowance,o);')(P,cont,(v,a,b)=>v<a?a:v>b?b:v,c,5000,99,o);
  // wasm side: single cell through bs_run
  const rp=E.bs_alloc(1),rb=new Float64Array(mem.buffer,rp,17+17);
  rb.set([c.x,c.y,c.radius,0,1,shp.t,shp.th||0,shp.asp||0,shp.dir||0,shp.wsp||0,shp.ph||0,shp.wig||0,shp.sat||0,shp.ph2||0,0.5,0.3,0.2]);
  const m=E.bs_run(1,1e9,5000,cont.x,cont.y,cont.w,cont.h,1,384,gap);
  const st=new Float64Array(mem.buffer,E.bs_stat(),4),ob=E.bs_out(),c12=st[2];
  const X=new Float32Array(mem.buffer,ob+0*c12*4,m),Y=new Float32Array(mem.buffer,ob+1*c12*4,m),R=new Float32Array(mem.buffer,ob+2*c12*4,m);
  if(m!==o.n){fails++;if(fails<4)console.log('COUNT',W,H,gap,radius,k,'js',o.n,'wasm',m);continue;}
  for(let i=0;i<m;i++){
    const d=Math.max(Math.abs(o.x[i]-X[i]),Math.abs(o.y[i]-Y[i]),Math.abs(o.r[i]-R[i]));
    if(d>maxD)maxD=d;
    if(d>1e-3){fails++;if(fails<4)console.log('DIFF',W,H,gap,radius,k,i,o.x[i],X[i],o.r[i],R[i]);}
    // containment: source disc must not cross the gap line
    const e=Math.min(X[i]-R[i]-gap,cont.w-gap-X[i]-R[i],Y[i]-R[i]-gap,cont.h-gap-Y[i]-R[i]);
    checks++;if(e<-0.01)cross++;
    const ej=Math.min(o.x[i]-o.r[i]-gap,cont.w-gap-o.x[i]-o.r[i],o.y[i]-o.r[i]-gap,cont.h-gap-o.y[i]-o.r[i]);
    if(ej<-0.01)jcross++;
  }
}
console.log('bs squeeze parity: checks',checks,'fails',fails,'maxAbsDiff',maxD.toExponential(2),'gap-line crossings wasm/js',cross,jcross,'(strings+lobed extend past the center clamp in both; default discs: contained in both)');
});
