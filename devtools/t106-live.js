const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const b=await H.launch(9577,'https://ca.abdupala.com/',[]);
for(let i=0;i<60;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(5000);
await b.ev(`(()=>{document.getElementById('tab').click();return 1})()`);await b.sleep(1200);
console.log('markers '+await b.ev(`(()=>{return JSON.stringify({perf:typeof perfOn,geom:!!window.__ca2})})()`));
console.log('base '+await b.ev(`(()=>{const st=document.getElementById('stats');
  const sp=st.querySelectorAll('span');const rows=[];let maxD=0;
  for(let i=0;i<sp.length;i+=2){const L=sp[i].getBoundingClientRect(),V=sp[i+1].getBoundingClientRect();
    rows.push({l:sp[i].textContent,v:sp[i+1].textContent,top:+L.top.toFixed(1),vleft:+V.left.toFixed(1)});
    maxD=Math.max(maxD,Math.abs((L.top+L.height/2)-(V.top+V.height/2)));}
  return JSON.stringify({rows:rows,align:getComputedStyle(sp[1]).textAlign,cols:getComputedStyle(st).gridTemplateColumns,maxCenterDeltaPx:+maxD.toFixed(1),statsW:st.clientWidth});})()`));
await b.ev(`(()=>{const items=[...document.querySelectorAll('#secc .sci')];window.__b=[...document.getElementById('stats').querySelectorAll('span')].map(e=>{const r=e.getBoundingClientRect();return [e.textContent,+r.top.toFixed(1),+r.left.toFixed(1)];});items[items.length-1].click();return 1})()`);
await b.sleep(1500);
console.log('perfT '+await b.ev(`(()=>{const st=document.getElementById('stats');
  const after=[...st.querySelectorAll('span')].map(e=>{const r=e.getBoundingClientRect();return [e.textContent,+r.top.toFixed(1),+r.left.toFixed(1)];});
  let moved=0;for(let i=0;i<window.__b.length;i++){if(Math.abs(after[i][1]-window.__b[i][1])>0.5||Math.abs(after[i][2]-window.__b[i][2])>0.5)moved++;}
  const perfFonts=[...st.querySelectorAll('span:nth-child(odd)')].slice(5).map(e=>e.textContent+':'+getComputedStyle(e).fontSize);
  return JSON.stringify({movedOfBase:moved,totalSpans:after.length,perfFonts:perfFonts,before:window.__b,after:after.slice(0,10)});})()`));
await b.shot('/tmp/owner-stats4.png');
console.log('shot saved');
console.log('errs',JSON.stringify(b.errs));b.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
