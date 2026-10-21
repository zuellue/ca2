const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8831);const b=await H.launch(9573,'http://localhost:8831/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3000);
const admOn=async()=>await b.ev(`document.getElementById('adm').classList.contains('on')`);
// A) fresh 6.5s hold, check DURING and AFTER release
await b.mouse(874,38,'mouseMoved'); await b.sleep(300);
await b.mouse(874,38,'mousePressed',{button:'left',clickCount:1});
await b.sleep(5600);
console.log('A during-hold admOn='+await admOn()+' (want true)');
await b.sleep(900);
await b.mouse(874,38,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(500);
console.log('A after-release admOn='+await admOn()+' (want true)');
// B) second 6.5s hold toggles closed (check after release)
await b.mouse(874,38,'mouseMoved'); await b.sleep(300);
await b.mouse(874,38,'mousePressed',{button:'left',clickCount:1});
await b.sleep(6500);
await b.mouse(874,38,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(500);
console.log('B toggle-off admOn='+await admOn()+' (want false)');
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
