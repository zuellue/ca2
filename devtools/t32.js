const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9474,'http://localhost:8765/index.html',[]);await b.sleep(3000);
await b.ev("(function(){var a=window.__ca2;a.P.foodMode=1;a.P.minRefreshInterval=9999;a.P.maxRefreshInterval=9999;})()");
await b.mouse(5,5);const r=[];
for(let i=0;i<14;i++){await b.sleep(500);r.push(await b.ev("(function(){var a=window.__ca2,f=a.getFood();return f.length+'/s'+a.foodStat.steps+'/b'+a.foodStat.born+'/d'+a.foodStat.died})()"))}
console.log(r.join(' '),b.errs);b.close();process.exit(0)})();
