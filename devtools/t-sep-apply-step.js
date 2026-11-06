// Node test of the REAL apply step of separatorCollectivePass in test/ca2.js (text-extracted, not a copy):
// invariants after one apply: (1) cell stays inside container minus boundGap, (2) never crosses a finite wall segment it was on one side of,
// (3) total displacement within one frame never exceeds maxSpeed+1 (f9 budget) even over repeated passes with the same frameT.
// Run from repo root: node devtools/t-sep-apply-step.js [file]
const fs=require('fs'),file=process.argv[2]||'test/ca2.js',src=fs.readFileSync(file,'utf8');
const a=src.indexOf('var c=active[k],m=moves[k],bg=Math.max(0,P.boundGap||0)'),endMark='c.x+=mx5;c.y+=my5;',b=src.indexOf(endMark,a);
if(a<0||b<0){console.log('FAIL markers not found in '+file+' (apply step moved or rewritten)');process.exit(1)}
const body=src.slice(a,b+endMark.length);
const apply=new Function('active','moves','k','P','cont','segs','frameT','clamp',body+';return active[k];');
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
let seed=777;const R=()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296;
const cont={x:0,y:0,w:400,h:300},P={boundGap:2};let fails=0,checks=0;
const side=(sg,x,y)=>(x-sg[0])*(sg[3]-sg[1])-(y-sg[1])*(sg[2]-sg[0]);
for(let t=0;t<2000;t++){
 const segs=[];for(let i=0,n=Math.floor(R()*4);i<n;i++){const x=R()*400,y=R()*300;segs.push([x,y,x+(R()-.5)*300,y+(R()-.5)*300])}
 const c={x:5+R()*390,y:5+R()*290,maxSpeed:R()*6},x0=c.x,y0=c.y,s0=segs.map(sg=>side(sg,x0,y0)),frame=t+1;
 for(let pass=0;pass<12;pass++){const m=[(R()-.5)*120,(R()-.5)*120];apply([c],[m],0,P,cont,segs,frame,clamp)}
 checks++;const why=[];
 if(!(c.x>=cont.x+P.boundGap-1e-9&&c.x<=cont.x+cont.w-P.boundGap+1e-9&&c.y>=cont.y+P.boundGap-1e-9&&c.y<=cont.y+cont.h-P.boundGap+1e-9))why.push('outside container');
 const d=Math.hypot(c.x-x0,c.y-y0);if(d>c.maxSpeed+1+1e-9)why.push('budget '+d.toFixed(3)+'>'+(c.maxSpeed+1).toFixed(3));
 // wall side check only for cells that did not start exactly on a wall line and whose path was within the segment span
 segs.forEach((sg,i)=>{const s1=side(sg,c.x,c.y);if(s0[i]*s1<0){const ex=sg[2]-sg[0],ey=sg[3]-sg[1],ll=ex*ex+ey*ey,al=((c.x-sg[0])*ex+(c.y-sg[1])*ey)/ll;if(al>=0&&al<=1)why.push('crossed wall '+i)}});
 if(why.length){fails++;if(fails<=10)console.log('FAIL case',t,why.join('; '))}}
console.log(fails?'FAILED '+fails+'/'+checks:'PASS '+checks+' cases',file);process.exit(fails?1:0);
