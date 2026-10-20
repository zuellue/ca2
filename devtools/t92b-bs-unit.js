const fs=require('fs');
WebAssembly.instantiate(fs.readFileSync(__dirname+'/../ca2core.wasm'),{}).then(({instance})=>{
const E=instance.exports, mem=E.memory;
const SRC_MAX=384;
const cx=100,cy=100,cw=800,ch=600;
function emitCell(c,t0,allowance,o){
  const bx=c.x-cx,by=c.y-cy,sh=c.shp;
  if(c.cellShapes&&sh&&sh.t===1&&allowance>1){
    const rs=c.radius*sh.th,span=2*c.radius*sh.th*(sh.asp-1),want=Math.min(9,Math.max(2,Math.round(span/(1.15*rs))+1)),nn=Math.min(want,allowance);
    if(nn>=2){const ux=Math.cos(sh.dir),uy=Math.sin(sh.dir),px=-uy,py=ux,ds=span/(nn-1),tq=t0/850*(1+sh.wsp)+sh.ph;
      for(let k=0;k<nn;k++){const d0=-span/2+ds*k,off2=sh.wig*rs*Math.sin(tq+k*0.85);o.x.push(bx+ux*d0+px*off2);o.y.push(by+uy*d0+py*off2);o.r.push(rs);o.n++;}return;}
  }else if(c.cellShapes&&sh&&sh.t===2&&allowance>2){
    const r0=c.radius*0.78,rot=t0/4200*sh.wsp+sh.ph;
    o.x.push(bx);o.y.push(by);o.r.push(r0);o.n++;
    for(let q2=0;q2<sh.sat;q2++){const aa=rot+q2*2.4+sh.ph2,dd=c.radius*(0.42+0.24*((q2*0.731+sh.ph)%1)),rr2=c.radius*(0.3+0.22*((q2*0.377+sh.ph2)%1));
      o.x.push(bx+Math.cos(aa)*dd);o.y.push(by+Math.sin(aa)*dd);o.r.push(rr2);o.n++;}
    return;
  }
  o.x.push(bx);o.y.push(by);o.r.push(c.radius);o.n++;
}
function jsBuild(cells,t0,elapsed){
  let alive=0;for(const c of cells)if(c.alive&&elapsed>=c.popD&&c.x>=cx&&c.x<=cx+cw&&c.y>=cy&&c.y<=cy+ch)alive++;
  const allowance=alive>1?Math.max(1,Math.floor(SRC_MAX/alive)):SRC_MAX;
  const X=[],Y=[],R=[];
  for(const c of cells){if(!c.alive||elapsed<c.popD||c.x<cx||c.x>cx+cw||c.y<cy||c.y>cy+ch)continue;
    const o={x:[],y:[],r:[],n:0};emitCell(c,t0,allowance,o);
    for(let k=0;k<o.n;k++){X.push(o.x[k]);Y.push(o.y[k]);R.push(o.r[k]);}}
  return{X,Y,R,alive};
}
function wasmBuild(cells,t0,elapsed){
  const n=cells.length,rp=E.bs_alloc(n),rb=new Float64Array(mem.buffer,rp,n*17+17);
  for(let i=0;i<n;i++){const c=cells[i],b=i*17,sh=c.shp||null;
    rb[b]=c.x;rb[b+1]=c.y;rb[b+2]=c.radius;rb[b+3]=c.popD||0;rb[b+4]=c.alive?1:0;
    rb[b+5]=sh?sh.t:0;rb[b+6]=sh?sh.th||0:0;rb[b+7]=sh?sh.asp||0:0;rb[b+8]=sh?sh.dir||0:0;
    rb[b+9]=sh?sh.wsp||0:0;rb[b+10]=sh?sh.ph||0:0;rb[b+11]=sh?sh.wig||0:0;rb[b+12]=sh?sh.sat||0:0;rb[b+13]=sh?sh.ph2||0:0;
    rb[b+14]=0.5;rb[b+15]=0.3;rb[b+16]=0.2;}
  const m=E.bs_run(n,elapsed,t0,cx,cy,cw,ch,1,SRC_MAX);
  if(m<0)throw 'bs_run';
  const st=new Float64Array(mem.buffer,E.bs_stat(),4),ob=E.bs_out(),c12=st[2],rows=st[0];
  const X=Array.from(new Float32Array(mem.buffer,ob+0*c12*4,rows)),Y=Array.from(new Float32Array(mem.buffer,ob+1*c12*4,rows)),R=Array.from(new Float32Array(mem.buffer,ob+2*c12*4,rows));
  return{X,Y,R,alive:st[1]};
}
const cells=[];
for(let i=0;i<120;i++){const t=i%3;const c={x:cx+Math.random()*cw,y:cy+Math.random()*ch,radius:3+Math.random()*30,alive:i%9!==0,popD:Math.random()*3000,
  shp:t===1?{t:1,th:0.3+Math.random()*0.5,asp:1.5+Math.random()*4,dir:Math.random()*6.28,wsp:Math.random(),ph:Math.random()*6.28,wig:Math.random(),sat:0,ph2:0}
       :t===2?{t:2,wsp:Math.random(),ph:Math.random()*6.28,sat:2+Math.floor(Math.random()*5),ph2:Math.random()*6.28,th:0,asp:0,dir:0,wig:0}
       :{t:0,th:0,asp:0,dir:0,wsp:0,ph:0,wig:0,sat:0,ph2:0},cellShapes:true};
  if(i%13===0)c.x=cx-50;cells.push(c);}
let worstN=0,worstD=0;
for(let f=0;f<60;f++){const t0=f*16.7+5000,elapsed=2000+f*50;
  const j=jsBuild(cells,t0,elapsed),w=wasmBuild(cells,t0,elapsed);
  if(j.X.length!==w.X.length){console.log('COUNT MISMATCH frame',f,j.X.length,w.X.length);process.exit(1);}
  if(j.alive!==w.alive){console.log('ALIVE MISMATCH',j.alive,w.alive);process.exit(1);}
  for(let i=0;i<j.X.length;i++){const d=Math.max(Math.abs(j.X[i]-w.X[i]),Math.abs(j.Y[i]-w.Y[i]),Math.abs(j.R[i]-w.R[i]));const rel=d/Math.max(1,Math.abs(j.X[i]));if(d>worstD)worstD=d;if(rel>1e-3){console.log('DIFF frame',f,'src',i,j.X[i],w.X[i]);worstN++;}}
}
console.log('60 frames: counts+alive exact every frame; worst abs diff (f32+sin ULP):',worstD.toExponential(2),'bad:',worstN);
let t=performance.now();for(let f=0;f<2000;f++)jsBuild(cells,f*16.7,1e9);const jt=(performance.now()-t)/2000;
t=performance.now();for(let f=0;f<2000;f++)wasmBuild(cells,f*16.7,1e9);const wt=(performance.now()-t)/2000;
console.log(`bench 120 mixed cells: js ${jt.toFixed(4)} -> wasm ${wt.toFixed(4)} ms/call (incl pack/copy)`);
});
