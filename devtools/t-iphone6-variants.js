// iPhone 6 (iOS 12) UA + 375x553 viewport; variant: base | nofont | noworker. Screenshot + effective params.
const C=require('./cdplib.js'),fs=require('fs');
const T=(p,ms)=>Promise.race([p,new Promise(r=>setTimeout(()=>r('TIMEOUT'),ms))]);
(async()=>{const v=process.argv[3]||'base',port=+process.argv[2]||9801;
const b=await C.launch(port,'about:blank',[]);const ev=e=>T(b.ev(e),40000);
await b.send('Network.enable');
await b.send('Emulation.setUserAgentOverride',{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 12_5_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1'});
await b.send('Emulation.setDeviceMetricsOverride',{width:+(process.argv[5]||375),height:+(process.argv[4]||553),deviceScaleFactor:2,mobile:true});
await b.send('Emulation.setTouchEmulationEnabled',{enabled:true});
if(v==='nofont')await b.send('Network.setBlockedURLs',{urls:['*Ca2-Thin.ttf*']});
if(v==='noworker')await b.send('Network.setBlockedURLs',{urls:['*ca2-presets.middots.workers.dev*']});
await b.send('Page.navigate',{url:'https://ca.abdupala.com/index.html'});await b.sleep(10000);
for(let i=0;i<20;i++){if(await ev(`typeof __ca2Mode==='function'&&__ca2.P?1:0`)===1)break;await b.sleep(2000);}
await b.sleep(3000);
console.log(v,await ev(`JSON.stringify({mode:__ca2Mode(),ts:__ca2.P.textScale,tl:__ca2.P.titleLead,tt:__ca2.P.titleTrack,W:innerWidth,H:innerHeight,font:document.fonts&&document.fonts.check('40px "Ca2-Thin"')})`));
const s=await T(b.send('Page.captureScreenshot',{format:'png'}),30000);fs.writeFileSync('/downloads/iph6-'+v+'.png',Buffer.from(s.data,'base64'));
b.close();process.exit(0)})();
