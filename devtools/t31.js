const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9473,'http://localhost:8765/index.html',[]);await b.sleep(3000);
await b.ev("(function(){var a=window.__ca2;a.P.minRefreshInterval=9999;a.P.maxRefreshInterval=9999;})()");
await b.mouse(5,5);await b.sleep(8000);
const q=async()=>JSON.parse(await b.ev("(function(){var a=window.__ca2,ps=a.getParasites();return JSON.stringify({par:ps.length,hosted:ps.filter(function(p){return p.host&&p.host.alive}).length,cells:a.cells,rehost:a.parStat.rehost,pdeath:a.pdeath})})()"));
console.log('pre',JSON.stringify(await q()));
// kill every host that has parasites
await b.ev("(function(){var a=window.__ca2,hs=new Set();a.getParasites().forEach(function(p){if(p.host)hs.add(p.host)});hs.forEach(function(h){h.alive=false});window.__k=hs.size})()");
console.log('killed hosts',await b.ev("window.__k"));
const r=[];for(let i=0;i<10;i++){await b.sleep(2000);const x=await q();r.push((i*2+2)+'s:p'+x.par+'/h'+x.hosted+'/c'+x.cells+'/re'+x.rehost)}
console.log(r.join(' | '),b.errs);b.close();process.exit(0)})();
