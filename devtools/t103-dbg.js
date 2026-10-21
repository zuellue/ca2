const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8832);const b=await H.launch(9574,'http://localhost:8832/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3000);
console.log('hit(874,38)='+await b.ev('window.__admDbg.hit(874,38)'));
console.log('state '+await b.ev('JSON.stringify(window.__admDbg.state())'));
await b.mouse(874,38,'mouseMoved'); await b.sleep(300);
await b.mouse(874,38,'mousePressed',{button:'left',clickCount:1});
await b.sleep(800);
console.log('state@0.8s '+await b.ev('JSON.stringify(window.__admDbg.state())'));
await b.sleep(4800);
console.log('admOn@5.6s '+await b.ev(`document.getElementById('adm').classList.contains('on')`));
console.log('state@5.6s '+await b.ev('JSON.stringify(window.__admDbg.state())'));
// synthetic dispatch comparison
console.log('synthetic '+await b.ev(`(()=>{window.dispatchEvent(new PointerEvent('pointerdown',{clientX:874,clientY:38}));return JSON.stringify(window.__admDbg.state())})()`));
console.log('errs',JSON.stringify(b.errs));b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
