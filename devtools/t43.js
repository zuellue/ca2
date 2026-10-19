const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9485,'http://localhost:8765/index.html',[]);await b.sleep(4000);await b.mouse(5,5);
await b.ev("(function(){var a=window.__ca2;a.P.minRefreshInterval=9999;a.P.maxRefreshInterval=9999;window.__f=0;(function f(){window.__f++;requestAnimationFrame(f)})();window.__t=[]; setInterval(function(){window.__t.push([window.__f,a.escStat.escaped,a.escStat.died])},2000)})()");
await b.sleep(50000);
console.log(await b.ev("JSON.stringify({P:[window.__ca2.P.escOn,window.__ca2.P.escProb,window.__ca2.P.escPersist],t:window.__t.filter(function(x,i){return i%3==0}),cells:window.__ca2.getCells().length,free:window.__ca2.getCells().filter(function(c){return c.free}).length})"),b.errs);b.close();process.exit(0)})();
