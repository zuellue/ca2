const L=require('/tmp/cdplib2.js');
(async()=>{const b=await L.launch(9440,'http://localhost:8765/index.html',[]);await b.sleep(1500);
try{console.log(await b.ev("JSON.stringify([document.querySelectorAll('canvas').length,[].map.call(document.querySelectorAll('canvas'),function(c){return c.id+':'+c.width})])"));}catch(e){console.log(String(e).slice(0,300))}
b.close();process.exit(0)})();
