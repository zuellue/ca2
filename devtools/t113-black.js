const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8836);const b=await H.launch(9584,'http://localhost:8836/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
console.log('seed '+await b.ev(`(()=>{const v=JSON.parse(localStorage.getItem('ca2.config')||'{}');v.bgTarget=[22,22,22];v.bgIndex=1;localStorage.setItem('ca2.config',JSON.stringify(v));return localStorage.getItem('ca2.config').slice(0,80);})()`));
const t0=Date.now(); await b.send('Page.navigate',{url:'http://localhost:8836/index.html?nosim=1'});
for(const ms of [150,500,1200,3000]){
  const w=t0+ms-Date.now(); if(w>0) await b.sleep(w);
  for(let a=0;a<5;a++){try{const r=await b.send('Page.captureScreenshot',{format:'png'});if(r&&r.data){require('fs').writeFileSync('/tmp/fixb-'+ms+'.png',Buffer.from(r.data,'base64'));break;}}catch(e){}await b.sleep(150);}
}
console.log('bg150..3000 body '+await b.ev(`getComputedStyle(document.body).backgroundColor`));
b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
