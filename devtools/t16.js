const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9417,'http://localhost:8765/index.html',[]);await b.sleep(2500);
const c=JSON.parse(await b.ev("JSON.stringify(window.__ca2.circles.slice(0,1))"));
const p=c[0];await b.mouse(p.x||p.cx,p.y||p.cy);await b.sleep(600);
console.log(JSON.stringify(c),await b.ev("JSON.stringify({disp:document.getElementById('cur').style.display,dot:document.getElementById('cur').firstElementChild.style.display})"),b.errs);
b.close();process.exit(0)})();
