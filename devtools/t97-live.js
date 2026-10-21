const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const b=await H.launch(9568,'https://ca.abdupala.com/?nosim=1',[]);
for(let i=0;i<50;i++){await b.sleep(600);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(5000);
await b.ev(`(()=>{document.getElementById('tab').click();return 1})()`);await b.sleep(900);
await b.ev(`(()=>{const items=[...document.querySelectorAll('#secc .sci')];items[items.length-1].click();return 1})()`);await b.sleep(1200);
console.log('LIVE stats '+await b.ev(`(()=>{const st=document.getElementById('stats');
  const labels=[...st.querySelectorAll('span:not(.n)')].map(e=>e.textContent);
  return JSON.stringify({labels:labels,align:getComputedStyle(st.querySelector('.n')).textAlign,labelFont:getComputedStyle(st).fontSize,valueFont:getComputedStyle(st.querySelector('.n')).fontSize,scrollW:st.scrollWidth,clientW:st.clientWidth});})()`));
console.log('LIVE switches '+await b.ev(`(()=>{
  const rows=[...document.querySelectorAll('.chk')];
  const pick=n=>{const r=rows.find(r=>r.querySelector('span').textContent===n);return r?r.querySelector('b').textContent:'?';};
  return JSON.stringify({sound:pick('sound'),genome:pick('genome'),symbiosis:pick('symbiosis'),axisLayering:pick('axis layering'),soundMode:pick('sound mode'),configFont:pick('config font')});})()`));
console.log('LIVE boundGap '+await b.ev(`(()=>{const r=[...document.querySelectorAll('.row')].find(r=>r.querySelector('.lab span')&&/wall gap/.test(r.querySelector('.lab span').textContent));return r?('row: '+r.querySelector('.lab span').textContent+' = '+r.querySelector('.lab b').textContent):'MISSING';})()`));
console.log('errs',b.errs);b.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
