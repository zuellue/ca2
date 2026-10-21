const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const b=await H.launch(9585,'https://ca.abdupala.com/',[]);
for(let i=0;i<60;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3000);
console.log('title '+await b.ev('document.title'));
// dynamic favicon: transparent bg + 1-3 blobs of sim colours
console.log('fav '+await b.ev(`(()=>{window.__favicon.draw();const l=window.__favicon.link;if(!l)return 'nolink';const img=new Image();return new Promise(res=>{img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');x.drawImage(img,0,0);
  const d=x.getImageData(0,0,32,32).data;let t=0,ink=0;const cols={};
  for(let i=0;i<d.length;i+=4){if(d[i+3]<10)t++;else{ink++;if(d[i+3]>200)cols[((d[i]>>4)<<8)|((d[i+1]>>4)<<4)|(d[i+2]>>4)]=1;}}
  res(JSON.stringify({transparentPx:t,inkPx:ink,coarseColours:Object.keys(cols).length,cornerAlpha:d[3]}));};img.src=l.href;});})()`));
// 20 picks: blob count always 1..3?
console.log('picks '+await b.ev(`(()=>{const c={1:0,2:0,3:0,bad:0};for(let i=0;i<20;i++){const n=window.__favicon.pickCells().length;if(n>=1&&n<=3)c[n]++;else c.bad++;}return JSON.stringify(c)})()`));
// secc hidden on mobile metrics
await b.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
await b.sleep(800);
console.log('seccMobile '+await b.ev(`(()=>{const r=document.getElementById('secc').getBoundingClientRect();return JSON.stringify({left:+r.left.toFixed(1),winW:window.innerWidth,hidden:r.left>=window.innerWidth});})()`));
await b.send('Emulation.clearDeviceMetricsOverride');
// sample strip PNG for the report (grey plate behind to prove transparency)
console.log('strip '+await b.ev(`(()=>{const F=window.__favicon;const c=document.createElement('canvas');c.width=224;c.height=72;const x=c.getContext('2d');
  x.fillStyle='#999';x.fillRect(0,0,224,72);
  const sizes=[64,32,16];let ox=8;
  sizes.forEach(sz=>{const off=document.createElement('canvas');off.width=off.height=sz;F.drawInto(off.getContext('2d'),sz,F.pickCells());x.imageSmoothingEnabled=false;x.drawImage(off,ox,Math.round((72-sz)/2),sz,sz);ox+=sz+16;});
  return c.toDataURL('image/png').length;})()`));
const dataUrl=await b.ev(`(()=>{const F=window.__favicon;const c=document.createElement('canvas');c.width=224;c.height=72;const x=c.getContext('2d');
  x.fillStyle='#999';x.fillRect(0,0,224,72);
  const sizes=[64,32,16];let ox=8;
  sizes.forEach(sz=>{const off=document.createElement('canvas');off.width=off.height=sz;F.drawInto(off.getContext('2d'),sz,F.pickCells());x.imageSmoothingEnabled=false;x.drawImage(off,ox,Math.round((72-sz)/2),sz,sz);ox+=sz+16;});
  return c.toDataURL('image/png');})()`);
require('fs').writeFileSync('/tmp/favicon-samples.png',Buffer.from(dataUrl.split(',')[1],'base64'));
// bake static favicon.png (same rule, fixed RGB trio - what Safari keeps)
const png=await b.ev(`(()=>{const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');
  x.fillStyle='#f00';x.beginPath();x.arc(10,11,7.5,0,6.2832);x.fill();
  x.fillStyle='#0f0';x.beginPath();x.arc(22.5,12,7,0,6.2832);x.fill();
  x.fillStyle='#00f';x.beginPath();x.arc(15.5,23.5,7.5,0,6.2832);x.fill();
  return c.toDataURL('image/png');})()`);
require('fs').writeFileSync('/tmp/ca2/favicon.png',Buffer.from(png.split(',')[1],'base64'));
console.log('baked favicon.png');
console.log('errs',JSON.stringify(b.errs));b.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
