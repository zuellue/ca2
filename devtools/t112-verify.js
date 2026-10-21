const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8835);
// ---- A) flash: fresh + black-bg, early shots (local, fixed code) ----
async function series(tag,seed){
  const b=await H.launch(9582,'http://localhost:8835/index.html?nosim=1',[]);
  if(seed){await b.sleep(3500);await b.ev(`(()=>{try{const v=JSON.parse(localStorage.getItem('ca2.config'));v.bgTarget=[22,22,22];v.bgIndex=1;localStorage.setItem('ca2.config',JSON.stringify(v));}catch(e){}return 1})()`);}
  const t0=Date.now(); await b.send('Page.navigate',{url:'http://localhost:8835/index.html?nosim=1'});
  for(const ms of [150,500,1200,3000]){
    const w=t0+ms-Date.now(); if(w>0) await b.sleep(w);
    for(let a=0;a<5;a++){try{const r=await b.send('Page.captureScreenshot',{format:'png'});if(r&&r.data){require('fs').writeFileSync('/tmp/fix-'+tag+'-'+ms+'.png',Buffer.from(r.data,'base64'));break;}}catch(e){}await b.sleep(150);}
  }
  // first-paint colour check: sample pixel at centre right after nav
  console.log(tag+' bodyBg@boot '+await b.ev(`getComputedStyle(document.body).backgroundColor`));
  b.close();
}
await series('fresh',false);
await series('black',true);
// ---- B) secc on mobile metrics ----
{const b=await H.launch(9583,'http://localhost:8835/index.html?nosim=1',[]);
await b.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
await b.sleep(4000);
console.log('seccMobile '+await b.ev(`(()=>{const r=document.getElementById('secc').getBoundingClientRect();return JSON.stringify({left:+r.left.toFixed(1),winW:window.innerWidth,hidden:r.left>=window.innerWidth});})()`));
// ---- C) favicon rule + cost ----
console.log('fav '+await b.ev(`(()=>{const out=[];for(let k=0;k<8;k++){window.__favicon.draw();const l=window.__favicon.link;if(!l)return 'nolink';out.push(l.href.length);}
  const l=window.__favicon.link;const img=new Image();return new Promise(res=>{img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');x.drawImage(img,0,0);
  const d=x.getImageData(0,0,32,32).data;let alpha0=0,blob=0,cols={};
  for(let i=0;i<d.length;i+=4){if(d[i+3]<10)alpha0++;else{blob++;cols[d[i]+','+d[i+1]+','+d[i+2]]=1;}}
  res(JSON.stringify({hrefLen:l.href.length,transparentPx:alpha0,inkPx:blob,distinctColours:Object.keys(cols).length,cornerAlpha:d[3]}));};img.src=l.href;});})()`));
// cost: 300 full updates + components
console.log('cost '+await b.ev(`(()=>{const F=window.__favicon;const t0=performance.now();for(let i=0;i<300;i++)F.draw();const full=(performance.now()-t0)/300;
  const cells=F.pickCells();const cv2=document.createElement('canvas');cv2.width=cv2.height=32;const g2=cv2.getContext('2d');
  const t1=performance.now();for(let i=0;i<300;i++)F.drawInto(g2,32,cells);const drawOnly=(performance.now()-t1)/300;
  const t2=performance.now();for(let i=0;i<300;i++)cv2.toDataURL('image/png');const enc=(performance.now()-t2)/300;
  return JSON.stringify({fullMs:+full.toFixed(3),drawMs:+drawOnly.toFixed(3),encodeMs:+enc.toFixed(3),perSecAt12fps:+(full*12).toFixed(1),perSecAt60fps:+(full*60).toFixed(1)});})()`));
// sample icons strip for the report
await b.ev(`(()=>{const F=window.__favicon;const c=document.createElement('canvas');c.id='favstrip';c.width=200;c.height=64;document.body.appendChild(c);const x=c.getContext('2d');
  x.fillStyle='#888';x.fillRect(0,0,200,64);
  [64,32,16].forEach((sz,i)=>{const cells=F.pickCells();const off=document.createElement('canvas');off.width=off.height=sz;F.drawInto(off.getContext('2d'),sz,cells);x.drawImage(off,[4,76,120][i],[0,16,24][i],sz,sz);});
  return 1})()`);
await b.shot('/tmp/favstrip-full.png');
b.close();}
s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
