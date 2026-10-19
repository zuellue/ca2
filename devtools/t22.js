const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9425,'http://localhost:8765/index.html',[]);await b.sleep(2500);
await b.mouse(5,5);await b.sleep(500);
console.log(await b.ev("JSON.stringify({after:getComputedStyle(document.getElementById('tab'),'::after').content,pbefore:getComputedStyle(document.getElementById('panel'),'::before').content,panelLeft:document.getElementById('panel').getBoundingClientRect().left,W:innerWidth})"));
// hover edge opens panel
await b.mouse(1295,300);await b.sleep(2500);
console.log('open after hover',await b.ev("JSON.stringify([document.getElementById('panel').getBoundingClientRect().left,document.getElementById('tab').matches(':hover'),getComputedStyle(document.getElementById('panel')).transform])"));
await b.mouse(5,5);await b.sleep(900);
// key c toggle
b.close();process.exit(0)})();
