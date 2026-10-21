const H=require('./harness.js');
(async()=>{const s=await H.serve(8770);const b=await H.launch(9505,'http://localhost:8770/index.html?nosim=1#open',['--user-data-dir=/tmp/cprof-'+Date.now()]);
for(let i=0;i<60;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(4000);
console.log('struct',await b.ev(`(function(){return JSON.stringify({swl:document.querySelectorAll('#swl').length,keys:document.querySelectorAll('.keys').length,swc:document.querySelectorAll('.swc').length,swcInPanel:document.querySelectorAll('#panel .swc').length,nativeColor:document.querySelectorAll('input[type=color]').length,btns:[].map.call(document.getElementById('btns').children,function(c){return c.textContent||c.className})})})()`));
console.log('homes',await b.ev(`(function(){var out=[];document.querySelectorAll('#panel .swc').forEach(function(c){var r=c.parentElement;var sec=r.previousElementSibling;var p=r;while(p&&!p.classList.contains('grp'))p=p.previousElementSibling;out.push((p?p.textContent:'?')+':'+r.querySelector('span').textContent)});return JSON.stringify(out)})()`));
// toggle 'knob lines' switch
const p=JSON.parse(await b.ev(`(function(){var cs=document.querySelectorAll('#panel .swc');var r=cs[1].getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()`));
await b.mouse(p.x,p.y);await b.sleep(250);
console.log('hover',await b.ev("document.querySelectorAll('#panel .swc')[1].style.background"));
await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(600);
console.log('on',await b.ev(`(function(){var r=document.querySelectorAll('#panel .swc')[1].parentElement;return JSON.stringify({on:__ca2.P.swLineColor,line:__ca2.P.lineColor,b:r.querySelector('b').textContent,fill:document.querySelectorAll('#panel .swc')[1].style.background})})()`));
await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(600);
console.log('off',await b.ev(`(function(){var r=document.querySelectorAll('#panel .swc')[1].parentElement;return JSON.stringify({on:__ca2.P.swLineColor,line:__ca2.P.lineColor,b:r.querySelector('b').textContent})})()`));
// perf solo
const pc=JSON.parse(await b.ev(`(function(){var cs=document.querySelectorAll('#secc .sc');var c=cs[cs.length-1];var r=c.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()`));
await b.mouse(pc.x,pc.y);await b.sleep(250);
await b.mouse(pc.x,pc.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(pc.x,pc.y,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(1200);
console.log('perfSolo',await b.ev(`(function(){var rows=document.querySelectorAll('#controls .row');var vis=[].filter.call(rows,function(r){return r.style.display!=='none'}).length;var st=document.querySelectorAll('#stats > span');var labels=[],nCount=0;st.forEach(function(s){if(s.className==='n')nCount++;else labels.push(s.textContent)});return JSON.stringify({visibleRows:vis,statSpans:st.length,nValues:nCount,labels:labels})})()`));
await b.shot('/tmp/owner-perf.png');
const cc=JSON.parse(await b.ev(`(function(){var c=document.querySelectorAll('#secc .sc')[0];var r=c.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()`));
await b.mouse(cc.x,cc.y);await b.sleep(250);
await b.mouse(cc.x,cc.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(cc.x,cc.y,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(1200);
console.log('restored',await b.ev(`(function(){var vis=[].filter.call(document.querySelectorAll('#controls .row'),function(r){return r.style.display!=='none'}).length;return JSON.stringify({visibleRows:vis,statSpans:document.querySelectorAll('#stats > span').length})})()`));
b.close();s.close();process.exit(0)})();
