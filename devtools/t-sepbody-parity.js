// t-sepbody-parity: Rust post_sepbody (emitCell f64 + shift + bound) vs JS sepBody/emitCell extracted from ca2.js. Reports counts exactly and max abs/ulp diff of x,y,r,bound
// (sin/cos: V8 vs Rust libm differ by <=1 ulp, so the tolerance is stated and measured, not asserted bit-exact).
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const code=`var P={cellShapes:1,boundGap:0,metaballStrength:1,THRESHOLD:1},cont={x:0,y:0,w:1000,h:600},frameT=0,SRC_MAX=384;var clamp=function(v,a,b){return v<a?a:v>b?b:v;};
${fn('sepBody')}\n${fn('emitCell')}\nreturn {P:P,cont:cont,setT:function(t){frameT=t},sepBody:sepBody};`;
const J=new Function(code)();
function ulp(a,b){if(Object.is(a,b))return 0;const f=new Float64Array(1),u=new BigInt64Array(f.buffer);f[0]=a;const x=u[0];f[0]=b;const y=u[0];return Number(x>y?x-y:y-x);}
(async()=>{
const E=(await WebAssembly.instantiate(fs.readFileSync(path.join(__dirname,'..',process.argv[2]||'ca2core.wasm')),{})).instance.exports;
let s=4242;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
let tot=0,nMis=0,maxAbs=0,maxUlp=0,bndAbs=0,byT=[0,0,0],over=0;
for(let t=0;t<20000;t++){
 const P=J.P,cont=J.cont;cont.x=rnd()*200;cont.y=rnd()*100;cont.w=200+rnd()*1200;cont.h=100+rnd()*700;P.boundGap=rnd()<0.5?0:rnd()*60;P.metaballStrength=0.5+rnd()*2;P.THRESHOLD=0.3+rnd()*1.5;P.cellShapes=rnd()<0.9?1:0;
 const T=rnd()*100000;J.setT(T);
 const ty=Math.floor(rnd()*3),sh=rnd()<0.1?undefined:{t:ty,asp:1+rnd()*4,th:0.4+rnd()*0.8,dir:rnd()*6.28-3.14,wsp:rnd()*2,ph:rnd()*6.28,wig:rnd(),sat:1+Math.floor(rnd()*4),ph2:rnd()*6.28};
 const c={x:cont.x+(rnd()*1.2-0.1)*cont.w,y:cont.y+(rnd()*1.2-0.1)*cont.h,radius:2+rnd()*40,shp:sh};
 const ref=J.sepBody(c);
 const ibp=E.post_sepbody_in();const ib=new Float64Array(E.memory.buffer,ibp,24);
 ib.set([c.x,c.y,c.radius,sh?1:0,sh?sh.t:0,sh?sh.asp:0,sh?sh.th:0,sh?sh.dir:0,sh?sh.wsp:0,sh?sh.ph:0,sh?sh.wig:0,sh?sh.sat:0,sh?sh.ph2:0,T,384,cont.x,cont.y,cont.w,cont.h,P.cellShapes,P.boundGap,P.metaballStrength,P.THRESHOLD]);
 const n=E.post_sepbody();const bpp=E.sep2_alloc(3,2+3*400);const b=new Float64Array(E.memory.buffer,bpp,2+3*400);
 tot++;byT[sh?sh.t:0]++;
 if(n!==ref.n||b[0]!==ref.n){nMis++;continue;}
 // body buffer layout is [n,bound,x..,y..,r..] with the stride of the written n (set_body); alloc(3, bigger) preserves the data
 for(let k=0;k<n;k++){for(const [a,bb] of [[ref.x[k],b[2+k]],[ref.y[k],b[2+n+k]],[ref.r[k],b[2+2*n+k]]]){const d=Math.abs(a-bb);if(d>maxAbs)maxAbs=d;const u=ulp(a,bb);if(u>maxUlp)maxUlp=u;if(u>8)over++;}}
 bndAbs=Math.max(bndAbs,Math.abs(ref.bound-b[1]));
}
console.log(JSON.stringify({cases:tot,sourceCountMismatch:nMis,maxAbs:maxAbs,maxUlp:maxUlp,over8ulp:over,boundMaxAbs:bndAbs,binary:process.argv[2]||'ca2core.wasm'}));
process.exit(nMis||over?1:0);})();
