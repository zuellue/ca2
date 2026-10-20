const H=require('./harness.js');
(async()=>{const s=await H.serve(8767);const b=await H.launch(9503,'http://localhost:8767/index.html?nosim=1#open',['--user-data-dir=/tmp/cprof-'+Date.now()]);
for(let i=0;i<60;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(4000);
console.log('block',await b.ev(`(function(){var bt=document.getElementById('btns');var kids=[].map.call(bt.children,function(c){return c.tagName==='BUTTON'?c.textContent:c.className});var pe=document.querySelector('.perf');return JSON.stringify({order:kids,perfRows:pe?pe.children.length:0})})()`));
await b.sleep(1500);
console.log('values',await b.ev(`(function(){var pe=document.querySelector('.perf');var o={};for(var i=0;i<pe.children.length;i+=2)o[pe.children[i].textContent]=pe.children[i+1].textContent;return JSON.stringify(o)})()`));
console.log('circle',await b.ev(`(function(){var cs=document.querySelectorAll('#secc .sc');var names=[].map.call(cs,function(c){return c.getAttribute('data-name')||c.title||''});return JSON.stringify({n:cs.length})})()`));
console.log('solo',await b.ev(`(function(){var secs=__ca2.P?'ok':'no';var cs=[].slice.call(document.querySelectorAll('#secc > div'));return cs.length})()`));
// click the perf circle via its label text
const pc=await b.ev(`(function(){var cs=[].slice.call(document.querySelectorAll('#secc *')).filter(function(e){return e.textContent==='perf'&&e.children.length===0});if(!cs.length)return 'nocirc';var r=cs[0].getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()`);
console.log('perfCircAt',pc);
if(pc!=='nocirc'){const p=JSON.parse(pc);
await b.mouse(p.x,p.y);await b.sleep(200);
await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(900);
console.log('afterSolo',await b.ev(`(function(){var rows=document.querySelectorAll('#controls .row');var vis=[].filter.call(rows,function(r){return r.style.display!=='none'}).length;var pe=document.querySelector('.perf');return JSON.stringify({visibleKnobRows:vis,perfVisible:pe&&pe.style.display!=='none'})})()`));
}
console.log('keys',await b.ev(`(function(){var ks=document.querySelectorAll('.keys .n');var w=0;ks.forEach(function(k){w=Math.max(w,k.getBoundingClientRect().width)});var pn=document.getElementById('panel');return JSON.stringify({nSpans:ks.length,maxNWidth:Math.round(w),panelClient:pn.clientWidth,panelScroll:pn.scrollWidth,keysFont:getComputedStyle(ks[0]).fontFamily.slice(0,20),keysSize:getComputedStyle(ks[0]).fontSize})})()`));
await b.shot('/tmp/perfhud.png');
b.close();s.close();process.exit(0)})();
