const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9424,'http://localhost:8765/index.html',[]);await b.sleep(2500);
await b.mouse(5,5);
for(const life of [1,0,1]){await b.ev(`window.__ca2.P.foodLife=${life};window.__fr=0;(function f(){window.__fr++;requestAnimationFrame(f)})()`);await b.sleep(3000);console.log('life',life,'fps',(await b.ev('window.__fr'))/3, JSON.stringify(await b.ev("JSON.stringify([window.__ca2.getFood().length,window.__ca2.cells,window.__ca2.foodStat.steps])")));}
b.close();process.exit(0)})();
