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
const cases=[[2.755,2.5,2.65],[2.755,1,2.65],[2.755,0.5,2.65],[2.755,0,2.65],[2.755,2.5,0],[1,1,1],[0.8,1,1.3],[1.535,2.5,0.5],[0.5,1,1],[2,3,2]];
console.log(v,await ev(`(function(){var P=__ca2.P,s0=[P.textScale,P.titleTrack,P.titleLead],out=[];`+JSON.stringify(cases)+`.forEach(function(c){P.textScale=c[0];P.titleTrack=c[1];P.titleLead=c[2];var L=window.__lay();out.push([c.join('/'),L.three,+L.fs.toFixed(3),+L.lead.toFixed(6),+L.ex.toFixed(6)].join(' '))});P.textScale=s0[0];P.titleTrack=s0[1];P.titleLead=s0[2];return out.join('\\n')})()`));
const s=await T(b.send('Page.captureScreenshot',{format:'png'}),30000);fs.writeFileSync('/downloads/title-'+v+(process.env.TAG||'')+'.png',Buffer.from(s.data,'base64'));
b.close();process.exit(0)})();
