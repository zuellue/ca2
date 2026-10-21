const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8819);const b=await H.launch(9559,'http://localhost:8819/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3500);
console.log(await b.ev(`(()=>{document.getElementById('tab').click();__ca2.setKey('cfgFontSize',20);return 'font 20';})()`));
await b.sleep(600);
console.log('font20 '+await b.ev(`(()=>{
  const r=[...document.querySelectorAll('.row')].filter(r=>r.offsetParent&&r.querySelector('.lab b'))[0];
  const lab=r.querySelector('.lab'), bb=lab.querySelector('b');
  const h0=r.offsetHeight, lh0=lab.offsetHeight;
  bb.click();
  const man=r.querySelector('.man');
  const h1=r.offsetHeight, mh=man?man.offsetHeight:-1;
  const out={h0:h0,hAfterEdit:h1,shift:h1-h0,labH:lh0,manH:mh};
  if(man){const ev=new KeyboardEvent('keydown',{key:'Escape'});man.dispatchEvent(ev);}
  return JSON.stringify(out);})()`));
console.log(await b.ev(`(()=>{__ca2.setKey('cfgFontSize',28);return 'font 28';})()`));
await b.sleep(600);
console.log('font28 '+await b.ev(`(()=>{
  const r=[...document.querySelectorAll('.row')].filter(r=>r.offsetParent&&r.querySelector('.lab b'))[0];
  const lab=r.querySelector('.lab'), bb=lab.querySelector('b');
  const h0=r.offsetHeight, lh0=lab.offsetHeight;
  bb.click();
  const man=r.querySelector('.man');
  const h1=r.offsetHeight, mh=man?man.offsetHeight:-1;
  const out={h0:h0,hAfterEdit:h1,shift:h1-h0,labH:lh0,manH:mh};
  if(man){const ev=new KeyboardEvent('keydown',{key:'Escape'});man.dispatchEvent(ev);}
  return JSON.stringify(out);})()`));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
