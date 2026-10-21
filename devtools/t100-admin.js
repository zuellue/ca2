const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8829);const b=await H.launch(9571,'http://localhost:8829/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3000);
const cinfo=await b.ev(`(()=>{const c=window.__ca2.circles;const f=c.filter(x=>/^R0_/.test(x.key||x.k||''));return JSON.stringify({n:c.length,f:f.slice(0,3),sample:c[0]});})()`);
console.log('circles '+cinfo);
const f=JSON.parse(cinfo).f; if(!f.length){console.log('NO R0_ circles');b.close();s.close();process.exit(1);}
const cx=f[0].x, cy=f[0].y;
const admOn=async()=>await b.ev(`document.getElementById('adm').classList.contains('on')`);
// move mouse onto the dot, confirm hover hit via cursor scale side effect not needed; proceed
await b.mouse(cx,cy,'mouseMoved'); await b.sleep(600);
// 1) double click must NOT open
await b.mouse(cx,cy,'mousePressed',{button:'left',clickCount:1}); await b.mouse(cx,cy,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(120);
await b.mouse(cx,cy,'mousePressed',{button:'left',clickCount:2}); await b.mouse(cx,cy,'mouseReleased',{button:'left',clickCount:2});
await b.sleep(700);
console.log('after dblclick admOn='+await admOn()+' (want false)');
// 2) short hold 4.0s must NOT open
await b.mouse(cx,cy,'mouseMoved'); await b.sleep(200);
await b.mouse(cx,cy,'mousePressed',{button:'left',clickCount:1}); await b.sleep(4000); await b.mouse(cx,cy,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(500);
console.log('after 4.0s hold admOn='+await admOn()+' (want false)');
// 3) long hold 6.5s must OPEN
await b.mouse(cx,cy,'mouseMoved'); await b.sleep(200);
await b.mouse(cx,cy,'mousePressed',{button:'left',clickCount:1}); await b.sleep(6500); await b.mouse(cx,cy,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(500);
console.log('after 6.5s hold admOn='+await admOn()+' (want true)');
// 4) another 6.5s hold toggles CLOSED
await b.mouse(cx,cy,'mouseMoved'); await b.sleep(200);
await b.mouse(cx,cy,'mousePressed',{button:'left',clickCount:1}); await b.sleep(6500); await b.mouse(cx,cy,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(500);
console.log('after 2nd 6.5s hold admOn='+await admOn()+' (want false)');
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
