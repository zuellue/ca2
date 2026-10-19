const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9426,'http://localhost:8765/index.html',[]);await b.sleep(2500);
await b.mouse(5,5);
const pos=async()=>await b.ev("document.getElementById('panel').getBoundingClientRect().left");
console.log('closed',await pos());
await b.mouse(1295,300);await b.mouse(1295,300,'mousePressed',{button:'left',clickCount:1});await b.mouse(1295,300,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(3000);console.log('after tab click',await pos());
b.close();process.exit(0)})();
