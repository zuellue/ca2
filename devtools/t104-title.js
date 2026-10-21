const H=require('/tmp/ca2/devtools/harness.js');
const PAL=[[22,22,22],[255,255,255],[255,0,0],[0,255,0],[0,0,255]];
const inPal=p=>PAL.some(c=>Math.abs(c[0]-p[0])<=2&&Math.abs(c[1]-p[1])<=2&&Math.abs(c[2]-p[2])<=2);
const close=(a,b)=>Math.abs(a[0]-b[0])<=8&&Math.abs(a[1]-b[1])<=8&&Math.abs(a[2]-b[2])<=8;
(async()=>{const s=await H.serve(8833);const b=await H.launch(9575,'http://localhost:8833/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(7000);
const dpr=await b.ev(`(()=>{const c=document.getElementById('c');return c.width/window.innerWidth})()`);
console.log('dpr='+dpr);
const px=async(x,y)=>JSON.parse(await b.ev(`(()=>{const d=document.getElementById('c').getContext('2d').getImageData(Math.round(${x}*${dpr}),Math.round(${y}*${dpr}),1,1).data;return JSON.stringify([d[0],d[1],d[2]])})()`));
const R0=[874,38],L0=[38,38],OUT=[650,400];
await b.ev(`__ca2.setKey('circleHold',0)`);
const baseR=await px(...R0), baseL=await px(...L0);
console.log('baseline R0='+JSON.stringify(baseR)+' L0='+JSON.stringify(baseL));
// 1) hover colors in palette (12 samples, re-hover each time)
let cols=[];
for(let i=0;i<12;i++){
  await b.mouse(OUT[0],OUT[1],'mouseMoved'); await b.sleep(1400);
  await b.mouse(R0[0],R0[1],'mouseMoved'); await b.sleep(1400);
  const c=await px(...R0); cols.push(c);
}
const bad=cols.filter(c=>!inPal(c));
console.log('palette samples='+JSON.stringify(cols)+' outOfPalette='+bad.length+' distinct='+new Set(cols.map(c=>c.join(','))).size);
// 2) hold off: move away -> reverts
await b.mouse(OUT[0],OUT[1],'mouseMoved'); await b.sleep(1600);
const afterLeave=await px(...R0);
console.log('revert after leave: '+JSON.stringify(afterLeave)+' matchesBaseline='+close(afterLeave,baseR));
// 3) direct circle-to-circle move: old circle reverts, new one colored
await b.mouse(R0[0],R0[1],'mouseMoved'); await b.sleep(1400);
await b.mouse(L0[0],L0[1],'mouseMoved'); await b.sleep(1600);
const rAfter=await px(...R0), lAfter=await px(...L0);
console.log('A->B: R0 '+JSON.stringify(rAfter)+' reverted='+close(rAfter,baseR)+' | L0 '+JSON.stringify(lAfter)+' colored='+inPal(lAfter));
// 4) hold on: color sticks after leaving
await b.ev(`__ca2.setKey('circleHold',1)`);
await b.mouse(OUT[0],OUT[1],'mouseMoved'); await b.sleep(1200);
await b.mouse(R0[0],R0[1],'mouseMoved'); await b.sleep(1400);
await b.mouse(OUT[0],OUT[1],'mouseMoved'); await b.sleep(1600);
const stuck=await px(...R0);
console.log('hold on: R0 after leave='+JSON.stringify(stuck)+' sticks='+inPal(stuck));
await b.ev(`__ca2.setKey('circleHold',0)`);
console.log('errs',JSON.stringify(b.errs));b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
