// Project test: three-line title spacing must survive a browser whose ink box is integer-rounded/padded
// (older WebKit suspicion). Usage: node t-title-metric-artefact.js <port> <base> <variant: sane|round|pad>
// Seeds ca2.global from /tmp/srv.json (public read-only preset snapshot), blocks the Worker, never writes anything.
// Needs window.__lay (test copies inject: window.__lay=function(){return lay();} before function lay) - runtime source is not changed.
const C=require('./cdplib.js'),fs=require('fs');
const T=(p,ms)=>Promise.race([p,new Promise(r=>setTimeout(()=>r('TIMEOUT'),ms))]);
(async()=>{const port=+process.argv[2]||9803,base=process.argv[3]||'http://localhost:8137/index.html',v=process.argv[4]||'sane';
const b=await C.launch(port,'about:blank',[]);const ev=e=>T(b.ev(e),40000);
await b.send('Network.enable');await b.send('Network.setBlockedURLs',{urls:['*ca2-presets.middots.workers.dev*']});
await b.send('Emulation.setDeviceMetricsOverride',{width:375,height:553,deviceScaleFactor:2,mobile:true});
const g=fs.readFileSync('/tmp/srv.json','utf8');
const patch={sane:'',round:`var o=CanvasRenderingContext2D.prototype.measureText;CanvasRenderingContext2D.prototype.measureText=function(s){var m=o.call(this,s);return{width:m.width,actualBoundingBoxLeft:Math.round(m.actualBoundingBoxLeft),actualBoundingBoxRight:Math.ceil(m.actualBoundingBoxRight)+1}};`,
 pad:`var o=CanvasRenderingContext2D.prototype.measureText;CanvasRenderingContext2D.prototype.measureText=function(s){var m=o.call(this,s);return{width:m.width,actualBoundingBoxLeft:m.actualBoundingBoxLeft,actualBoundingBoxRight:m.width}};`}[v];
await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`try{localStorage.setItem('ca2.global',${JSON.stringify(g)})}catch(e){}`+patch});
await b.send('Page.navigate',{url:base});await b.sleep(10000);
for(let i=0;i<20;i++){if(await ev(`typeof __ca2Mode==='function'&&__ca2.P?1:0`)===1)break;await b.sleep(2000);}
await b.sleep(3000);
console.log(v,await ev(`(function(){var L=window.__lay();return JSON.stringify({mode:__ca2Mode(),tl:__ca2.P.titleLead,ts:__ca2.P.textScale,lay:L&&{three:L.three,lead:L.lead,dh:L.dh,fs:L.fs,gapRatio:(L.lead-L.dh)/L.fs}})})()`));
const s=await T(b.send('Page.captureScreenshot',{format:'png'}),30000);fs.writeFileSync('/downloads/title-'+v+(process.env.TAG||'')+'.png',Buffer.from(s.data,'base64'));
b.close();process.exit(0)})();
