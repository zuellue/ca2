const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8828);const b=await H.launch(9570,'http://localhost:8828/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(4500);
await b.ev(`(()=>{document.getElementById('tab').click();return 1})()`);await b.sleep(900);
// 1) base stats: format + alignment + centering + pinned geometry
console.log('base '+await b.ev(`(()=>{const st=document.getElementById('stats');
  const sp=st.querySelectorAll('span');const rows=[];let maxCenterDelta=0;
  for(let i=0;i<sp.length;i+=2){const L=sp[i].getBoundingClientRect(),V=sp[i+1].getBoundingClientRect();
    rows.push({label:sp[i].textContent,value:sp[i+1].textContent,top:+L.top.toFixed(1),left:+V.left.toFixed(1),right:+V.right.toFixed(1)});
    maxCenterDelta=Math.max(maxCenterDelta,Math.abs((L.top+L.height/2)-(V.top+V.height/2)));}
  return JSON.stringify({rows:rows,align:getComputedStyle(sp[1]).textAlign,gridCols:getComputedStyle(st).gridTemplateColumns,valueWidth:getComputedStyle(sp[1]).width,maxCenterDeltaPx:+maxCenterDelta.toFixed(1)});})()`));
// 2) jitter while values change: sample via ev loop (interval starves in headless)
for (let s2=0;s2<10;s2++){
  console.log('js'+s2+' '+await b.ev(`(()=>{const st=document.getElementById('stats');const sp=st.querySelectorAll('span');const r=[];for(let i=0;i<sp.length;i+=2){const b2=sp[i+1].getBoundingClientRect();r.push(sp[i].textContent+':'+sp[i+1].textContent+'@'+b2.left.toFixed(1)+','+b2.right.toFixed(1)+','+b2.width.toFixed(1)+' fs'+getComputedStyle(sp[i+1]).fontSize);}return r.join(' | ')})()`));
  await b.sleep(400);
}
// 3) perf toggle: base rows must not move; perf rows appended below
console.log('perfT '+await b.ev(`(()=>{const st=document.getElementById('stats');
  const before=[...st.querySelectorAll('span')].map(e=>{const r=e.getBoundingClientRect();return [e.textContent,+r.top.toFixed(1),+r.left.toFixed(1)];});
  const items=[...document.querySelectorAll('#secc .sci')];items[items.length-1].click();
  window.__before=before;return 'clicked perf';})()`));
await b.sleep(1200);
console.log('perfT2 '+await b.ev(`(()=>{const st=document.getElementById('stats');
  const after=[...st.querySelectorAll('span')].map(e=>{const r=e.getBoundingClientRect();return [e.textContent,+r.top.toFixed(1),+r.left.toFixed(1)];});
  let moved=0;for(let i=0;i<window.__before.length;i++){if(Math.abs(after[i][1]-window.__before[i][1])>0.5||Math.abs(after[i][2]-window.__before[i][2])>0.5)moved++;}
  return JSON.stringify({baseSpans:window.__before.length,movedOfBase:moved,totalAfter:after.length,appendedLabels:after.slice(window.__before.length).map(a=>a[0]).filter((_,i)=>i%2===0)});})()`));
await b.shot('/tmp/owner-stats3.png');
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
