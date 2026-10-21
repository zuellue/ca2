const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8830);const b=await H.launch(9572,'http://localhost:8830/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3000);
console.log('elemAt '+await b.ev(`(()=>{const e=document.elementFromPoint(874,38);return e?e.tagName+'#'+e.id+'.'+e.className:'null'})()`));
await b.mouse(874,38,'mouseMoved'); await b.sleep(2500);
await b.shot('/tmp/adm-hover.png');
// press and hold; sample whether anything happens at 6.5s
await b.mouse(874,38,'mousePressed',{button:'left',clickCount:1});
await b.sleep(6500);
await b.shot('/tmp/adm-hold.png');
console.log('admOn '+await b.ev(`document.getElementById('adm').classList.contains('on')`));
await b.mouse(874,38,'mouseReleased',{button:'left',clickCount:1});
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
