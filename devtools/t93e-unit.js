const fs=require('fs');const src=fs.readFileSync(__dirname+'/../ca2.js','utf8');
const grab=(name)=>{const i=src.indexOf('function '+name+'(');if(i<0)throw name+' not found';let d=0,j=i;for(;j<src.length;j++){if(src[j]==='{')d++;if(src[j]==='}'){d--;if(!d)break;}}return src.slice(i,j+1);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// keepIn unit: drive cells into walls synchronously, assert clamp holds for every radius x gap x plate
const keepInSrc=grab('keepIn');
let fails=0,checks=0;
for(const [W,Hh] of [[253,591],[1200,700],[400,400]]) for(const gap of [0,30,80]) for(const radius of [10,30,100,200,400,800]){
  const P={boundAware:1,boundGap:gap,boundZone:10,boundForce:3,genomeOn:1};
  const cont={x:100,y:50,w:W,h:Hh};
  const c={x:cont.x+cont.w/2,y:cont.y+cont.h/2,vx:-8,vy:-6,radius,maxSpeed:2,g:{bnd:1}};
  eval(keepInSrc);
  for(let f=0;f<400;f++){c.x+=c.vx;c.y+=c.vy;keepIn(c);}
  const rFit=Math.max(8,Math.min(W,Hh)/2-gap),r=Math.min(radius,rFit);
  const x0=cont.x+r+gap,x1=cont.x+cont.w-r-gap,y0=cont.y+r+gap,y1=cont.y+cont.h-r-gap;
  checks++;
  if(c.x<x0-0.001||c.x>x1+0.001||c.y<y0-0.001||c.y>y1+0.001){fails++;console.log('CLAMP FAIL',W,Hh,gap,radius,c.x.toFixed(1),c.y.toFixed(1),'bounds',x0.toFixed(1),x1.toFixed(1),y0.toFixed(1),y1.toFixed(1));}
}
console.log('keepIn clamp checks:',checks,'fails:',fails);
// emitCell unit: drawn body must never cross the gap line, any position/radius/gap
const emitSrc=grab('emitCell');
const P2={boundGap:0,cellShapes:0};let vfail=0,vchecks=0,minEdgeVis=1e9;
for(const [W,Hh] of [[253,591],[1200,700]]) for(const gap of [0,30,80]) for(const radius of [10,30,100,200,400,800]) for(let k=0;k<400;k++){
  const cont={x:0,y:0,w:W,h:Hh};
  const P={boundGap:gap,cellShapes:0};
  const c={x:Math.random()*W,y:Math.random()*Hh,radius,shp:{t:0}};
  const o={x:[],y:[],r:[],n:0};
  eval(emitSrc);
  emitCell(c,0,99,o);
  for(let i=0;i<o.n;i++){
    const e=Math.min(o.x[i]-o.r[i]-gap,cont.w-gap-o.x[i]-o.r[i],o.y[i]-o.r[i]-gap,cont.h-gap-o.y[i]-o.r[i]);
    vchecks++;minEdgeVis=Math.min(minEdgeVis,e);
    if(e<-0.001){vfail++;if(vfail<4)console.log('VISUAL CROSS',W,Hh,gap,radius,'src r',o.r[i].toFixed(1),'at',o.x[i].toFixed(1),o.y[i].toFixed(1));}
  }
}
console.log('emitCell visual-containment checks:',vchecks,'fails:',vfail,'worst margin past gap line:',minEdgeVis.toFixed(2));
