const L=require('/tmp/cdplib.js');const fs=require('fs');
(async()=>{const b=await L.launch(9478,'http://localhost:8765/index.html',[]);await b.sleep(3500);
await b.ev("document.getElementById('panel').classList.add('open')");await b.sleep(1500);
const r=await b.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/downloads/panel_fix.png',Buffer.from(r.data,'base64'));
console.log(await b.ev("JSON.stringify([...document.querySelectorAll('.stats span')].map(e=>{var r=e.getBoundingClientRect();return [e.textContent,Math.round(r.left),Math.round(r.width),Math.round(r.height),e.scrollWidth>e.clientWidth]}))"),b.errs);b.close();process.exit(0)})();
