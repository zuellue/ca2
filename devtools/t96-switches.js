const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8827);const b=await H.launch(9567,'http://localhost:8827/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(4000);
await b.ev(`(()=>{document.getElementById('tab').click();return 1})()`);await b.sleep(700);
console.log(await b.ev(`(()=>{
  const heads=[...document.querySelectorAll('.grp')];const sw=heads.find(h=>h.textContent==='switches');if(!sw)return 'no switches hdr';
  const out=[];let el=sw.nextElementSibling;
  while(el&&!el.classList.contains('grp')){if(el.classList.contains('chk')){const sp=el.querySelector('span'),bb=el.querySelector('b');out.push(sp.textContent+' = '+bb.textContent);}el=el.nextElementSibling;}
  return JSON.stringify(out);})()`));
console.log('flip  '+await b.ev(`(()=>{
  const rows=[...document.querySelectorAll('.chk')];const snd=rows.find(r=>r.querySelector('span').textContent==='sound');
  const c=snd.querySelector('input');c.click();
  const after=snd.querySelector('b').textContent;c.click();
  return JSON.stringify({afterFirstClick:after,backAgain:snd.querySelector('b').textContent});})()`));
console.log('choice '+await b.ev(`(()=>{
  const rows=[...document.querySelectorAll('.chk')];const ax=rows.find(r=>r.querySelector('span').textContent==='axis layering');
  const b4=ax.querySelector('b').textContent;ax.click();const af=ax.querySelector('b').textContent;ax.click();
  return JSON.stringify({before:b4,afterClick:af,backAgain:ax.querySelector('b').textContent});})()`));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
