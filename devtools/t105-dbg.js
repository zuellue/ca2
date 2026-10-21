const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8834);const b=await H.launch(9576,'http://localhost:8834/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(7000);
const dpr=await b.ev(`(()=>{const c=document.getElementById('c');return c.width/window.innerWidth})()`);
const px=async(x,y)=>JSON.parse(await b.ev(`(()=>{const d=document.getElementById('c').getContext('2d').getImageData(Math.round(${x}*${dpr}),Math.round(${y}*${dpr}),1,1).data;return JSON.stringify([d[0],d[1],d[2]])})()`));
const R0=[874,38],OUT=[650,400];
await b.ev(`__ca2.setKey('circleHold',0)`);
console.log('t0 R0='+JSON.stringify(await px(...R0))+' ref850='+JSON.stringify(await px(850,38))+' ref900='+JSON.stringify(await px(900,38)));
await b.mouse(R0[0],R0[1],'mouseMoved'); await b.sleep(1500);
console.log('hover R0='+JSON.stringify(await px(...R0)));
await b.mouse(OUT[0],OUT[1],'mouseMoved');
for(let k=1;k<=3;k++){await b.sleep(2500);
  console.log('leave+'+(k*2.5)+'s R0='+JSON.stringify(await px(...R0))+' ref850='+JSON.stringify(await px(850,38))+' ref900='+JSON.stringify(await px(900,38)));}
console.log('cellsNearTop='+await b.ev(`(()=>{const cs=__ca2.getCells?__ca2.getCells():[];let n=0;cs.forEach(c=>{if(c.alive&&c.y<120)n++;});return n;})()`));
console.log('errs',JSON.stringify(b.errs));b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
