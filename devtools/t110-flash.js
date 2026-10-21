const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{
async function run(tag,url,pre){
  const b=await H.launch(9580,'about:blank',[]);
  if(pre) await pre(b);
  const t0=Date.now();
  await b.send('Page.navigate',{url:url});
  for(const ms of [120,300,600,1200,2500,5000]){
    const wait=t0+ms-Date.now(); if(wait>0) await b.sleep(wait);
    for(let a=0;a<5;a++){try{const r=await b.send('Page.captureScreenshot',{format:'png'});if(r&&r.data){require('fs').writeFileSync('/tmp/flash-'+tag+'-'+ms+'.png',Buffer.from(r.data,'base64'));break;}}catch(e){}await b.sleep(120);}
  }
  b.close();
}
// fresh profile state
await run('fresh','https://ca.abdupala.com/');
// saved BLACK bg (bgIndex 1) as a returning user who picked the black background
await run('blackbg','https://ca.abdupala.com/',async(b)=>{
  await b.send('Page.navigate',{url:'https://ca.abdupala.com/'});
  await b.sleep(4000);
  await b.ev(`(()=>{try{const sv=JSON.parse(localStorage.getItem('ca2')||'null')||JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('ca2'))))}catch(e){}
    // find the store key the site uses and set black bg
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);try{const v=JSON.parse(localStorage.getItem(k));if(v&&v.P){v.bgTarget=[22,22,22];v.bgIndex=1;localStorage.setItem(k,JSON.stringify(v));}}catch(e){}}
    return Object.keys(localStorage);})()`);
});
process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
