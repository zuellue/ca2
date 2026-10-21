const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8826);const b=await H.launch(9566,'http://localhost:8826/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(4500);
await b.ev(`(()=>{document.getElementById('tab').click();return 1})()`);await b.sleep(700);
await b.ev(`(()=>{const items=[...document.querySelectorAll('#secc .sci')];items[items.length-1].click();return 1})()`);await b.sleep(1200);
console.log('default '+await b.ev(`(()=>{const st=document.getElementById('stats');
  return JSON.stringify({labelFont:getComputedStyle(st).fontSize,valueFont:getComputedStyle(st.querySelector('.n')).fontSize,scrollW:st.scrollWidth,clientW:st.clientWidth,align:getComputedStyle(st.querySelector('.n')).textAlign});})()`));
await b.shot('/tmp/owner-stats2.png');
console.log(await b.ev(`(()=>{__ca2.setKey('panelWidth',210);return 1})()`));await b.sleep(1200);
console.log('narrow  '+await b.ev(`(()=>{const st=document.getElementById('stats');
  return JSON.stringify({labelFont:getComputedStyle(st).fontSize,valueFont:getComputedStyle(st.querySelector('.n')).fontSize,scrollW:st.scrollWidth,clientW:st.clientWidth});})()`));
await b.shot('/tmp/owner-stats2-narrow.png');
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
