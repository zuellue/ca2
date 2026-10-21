const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const b=await H.launch(9578,'https://ca.abdupala.com/',[]);
for(let i=0;i<60;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(5000);
await b.ev(`(()=>{document.getElementById('tab').click();return 1})()`);await b.sleep(1200);
const probe=`(()=>{const st=document.getElementById('stats');const pn=document.getElementById('panel')||st.closest('div');
  const r0=st.querySelector('span').getBoundingClientRect();
  return JSON.stringify({statsW:st.clientWidth,statsSW:st.scrollWidth,rowTop:+r0.top.toFixed(1),fitFont:getComputedStyle(st).fontSize,bodySW:document.documentElement.scrollWidth,winW:window.innerWidth,docScrollW:document.body.scrollWidth,panelH:pn?pn.scrollHeight+'/'+pn.clientHeight:'?'});})()`;
console.log('before '+await b.ev(probe));
await b.ev(`(()=>{const items=[...document.querySelectorAll('#secc .sci')];items[items.length-1].click();return 1})()`);
await b.sleep(1500);
console.log('after  '+await b.ev(probe));
console.log('errs',JSON.stringify(b.errs));b.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
