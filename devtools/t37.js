const L=require('/tmp/cdplib.js');const fs=require('fs');
(async()=>{const b=await L.launch(9479,'http://localhost:8765/index.html',[]);await b.sleep(6000);await b.mouse(5,5);
for(const v of [1,0]){await b.ev("window.__ca2.P.blobOutline="+v);await b.sleep(2500);
console.log(v,await b.ev("(function(){var a=window.__ca2,bl=a.blobs,c=document.querySelector('canvas'),x=c.getContext('2d'),s=c.width/innerWidth,res=[];bl.filter(function(q){return q.d.length>=6}).slice(0,6).forEach(function(q){var p=x.getImageData(Math.round(q.x*s),Math.round(q.y*s),1,1).data;res.push([q.d.length,p[0],p[1],p[2],p[3]])});return JSON.stringify({food:P=a.P.foodColor,nb:bl.length,cent:res})})()"));
if(v){const r=await b.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/downloads/blob_outline.png',Buffer.from(r.data,'base64'))}}
console.log(b.errs);b.close();process.exit(0)})();
