const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9410,'http://localhost:8765/index.html',[]);await b.sleep(2500);
await b.ev("(function(){var a=window.__ca2;a.P.minRefreshInterval=300;a.P.maxRefreshInterval=300;a.P.grain=0;a.P.UNIVERSE_SIZE=70;a.P.genomeOn=0;a.P.divideOn=0;a.P.eatMergeOn=0;a.P.parasiteOn=0;a.P.selectOn=0;})()");
await b.mouse(5,5);
const rows=[];
for(let t=0;t<12;t++){ rows.push(JSON.parse(await b.ev(`(function(){var a=window.__ca2,cs=a.getCells(),ps=a.getParasites?a.getParasites():[];var att=ps.filter(function(p){return p.host}).length;var mr=Math.max.apply(null,cs.map(c=>c.radius));return JSON.stringify({t:${t*5},n:cs.length,cl:a.clusters,par:a.parasites,att:att,merges:a.merges,eaten:a.eaten,div:a.divides,pb:a.pbirth,pd:a.pdeath,maxR:Math.round(mr),oob:a.oob})})()`))); await b.sleep(5000);} 
console.log(rows.map(r=>JSON.stringify(r)).join('\n')); console.log('errs',b.errs);
b.close();process.exit(0)})();
