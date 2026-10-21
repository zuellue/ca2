const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8818);const b=await H.launch(9558,'http://localhost:8818/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3500);
console.log(await b.ev(`(()=>{document.getElementById('tab').click();return 'panel open';})()`));
await b.sleep(800);
console.log(await b.ev(`(()=>{
  const rows=[...document.querySelectorAll('.row')].filter(r=>r.offsetParent&&r.querySelector('.lab b'));
  const out=[];
  for(const ri of [0,1,2]){
    const r=rows[ri], lab=r.querySelector('.lab'), bb=lab.querySelector('b');
    const h0=r.offsetHeight, lh0=lab.offsetHeight;
    bb.click();
    const man=r.querySelector('.man');
    const h1=r.offsetHeight, mh=man?man.offsetHeight:-1, caret=man?getComputedStyle(man).caretColor:'';
    out.push({row:ri,h0:h0,hAfterEdit:h1,shift:h1-h0,labH:lh0,manH:mh,caret:caret});
    if(man){man.value='';const ev=new KeyboardEvent('keydown',{key:'Escape'});man.dispatchEvent(ev);}
  }
  return JSON.stringify(out);})()`));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
