const H=require('./harness.js');
(async()=>{const s=await H.serve(8767);const b=await H.launch(9503,'http://localhost:8767/index.html?nosim=1#open',['--user-data-dir=/tmp/cprof-'+Date.now()]);
for(let i=0;i<60;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(4000);
const p=JSON.parse(await b.ev(`(function(){var cs=document.querySelectorAll('#secc .sc');var c=cs[cs.length-1];var r=c.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()`));
console.log('lastCirc',p);
await b.mouse(p.x,p.y);await b.sleep(250);
await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(1000);
console.log('afterSolo',await b.ev(`(function(){var rows=document.querySelectorAll('#controls .row');var vis=[].filter.call(rows,function(r){return r.style.display!=='none'}).length;var grps=document.querySelectorAll('#controls .grp');var vg=[].filter.call(grps,function(g){return g.style.display!=='none'}).length;var pe=document.querySelector('.perf');var pv=pe&&getComputedStyle(pe).display!=='none';return JSON.stringify({visibleKnobRows:vis,visibleGrpHdrs:vg,perfVisible:pv,perfText:pe?pe.children[1].textContent:'-'})})()`));
await b.shot('/tmp/perf-solo.png');
// click config circle (first) to restore
const p0=JSON.parse(await b.ev(`(function(){var c=document.querySelectorAll('#secc .sc')[0];var r=c.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()`));
await b.mouse(p0.x,p0.y);await b.sleep(250);
await b.mouse(p0.x,p0.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p0.x,p0.y,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(1000);
console.log('restored',await b.ev(`(function(){var rows=document.querySelectorAll('#controls .row');var vis=[].filter.call(rows,function(r){return r.style.display!=='none'}).length;return JSON.stringify({visibleKnobRows:vis})})()`));
b.close();s.close();process.exit(0)})();
