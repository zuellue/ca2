const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8821);const b=await H.launch(9561,'http://localhost:8821/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(4000);
await b.ev(`(()=>{document.getElementById('tab').click();return 1})()`);await b.sleep(600);
await b.ev(`(()=>{const items=[...document.querySelectorAll('#secc .sci')];items[items.length-1].click();return 1})()`);await b.sleep(900);
console.log(await b.ev(`(()=>{
  const st=document.getElementById('stats');
  st.style.fontSize='';
  const spans=[...st.children].map(e=>({t:e.textContent.slice(0,16),w:+e.getBoundingClientRect().width.toFixed(1)}));
  const g=getComputedStyle(st);
  return JSON.stringify({scrollW:st.scrollWidth,clientW:st.clientWidth,rectW:+st.getBoundingClientRect().width.toFixed(1),cols:g.gridTemplateColumns,font:g.fontSize,ff:g.fontFamily.slice(0,30),spans:spans});})()`));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
