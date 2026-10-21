const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8820);const b=await H.launch(9560,'http://localhost:8820/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3500);
await b.ev(`(()=>{document.getElementById('tab').click();return 1})()`);
await b.sleep(700);
console.log('edit13 '+await b.ev(`(()=>{
  const rows=[...document.querySelectorAll('.row')].filter(r=>r.offsetParent&&r.querySelector('.lab b'));
  const out=[];
  for(const ri of [0,1]){const r=rows[ri],lab=r.querySelector('.lab'),bb=lab.querySelector('b');
    const h0=r.offsetHeight;bb.click();const man=r.querySelector('.man');
    out.push({h0:h0,h1:r.offsetHeight,shift:r.offsetHeight-h0,caret:man?getComputedStyle(man).caretColor:''});
    if(man){man.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));}}
  return JSON.stringify(out);})()`));
await b.ev(`(()=>{__ca2.setKey('cfgFontSize',28);return 1})()`);await b.sleep(500);
console.log('edit28 '+await b.ev(`(()=>{
  const r=[...document.querySelectorAll('.row')].filter(r=>r.offsetParent&&r.querySelector('.lab b'))[0];
  const bb=r.querySelector('.lab b');const h0=r.offsetHeight;bb.click();const man=r.querySelector('.man');
  const o={h0:h0,h1:r.offsetHeight,shift:r.offsetHeight-h0,caret:man?getComputedStyle(man).caretColor:''};
  if(man){man.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));}
  return JSON.stringify(o);})()`));
await b.ev(`(()=>{__ca2.setKey('cfgFontSize',13);return 1})()`);await b.sleep(400);
console.log('perf '+await b.ev(`(()=>{
  const items=[...document.querySelectorAll('#secc .sci')];items[items.length-1].click();
  return 'solo perf';})()`));
await b.sleep(900);
console.log('stats '+await b.ev(`(()=>{
  const st=document.getElementById('stats');
  const labels=[...st.querySelectorAll('span:not(.n)')].map(e=>e.textContent);
  const align=getComputedStyle(st.querySelector('.n')).textAlign;
  const fs=getComputedStyle(st).fontSize, sw=st.scrollWidth, cw=st.clientWidth;
  return JSON.stringify({labels:labels,valuesAlign:align,fontSize:fs,scrollW:sw,clientW:cw});})()`));
await b.shot('/tmp/owner-stats.png');
console.log('narrow '+await b.ev(`(()=>{__ca2.setKey('panelWidth',210);return 1})()`));
await b.sleep(900);
console.log('statsN '+await b.ev(`(()=>{
  const st=document.getElementById('stats');
  return JSON.stringify({fontSize:getComputedStyle(st).fontSize,scrollW:st.scrollWidth,clientW:st.clientWidth});})()`));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
