// wing strip: tracks a tagged parasite, captures 12 zoomed frames ~35 ms apart, logs smoothed speed and flap phase per frame.
const H=require('./harness.js'),D=require('./dbg-inject.js'),fs=require('fs');
(async()=>{const srv=await D.serve(8870),b=await H.launch(8871,'http://127.0.0.1:8870/index.html?simab=1',[]);try{
 await b.send('Emulation.setDeviceMetricsOverride',{width:760,height:460,deviceScaleFactor:1,mobile:false});
 await b.sleep(8000);
 await b.ev(`__ca2.P.grain=0;__ca2.P.parasiteSize=3;__ca2.P.showAxis=0;0`);
 await b.ev(`(function(){var c=__ca2.contBox,tp={x:c.x+c.w/2,y:c.y+c.h/2,e:8,host:null,a:0,ph:0};window.__tp=tp;__ca2.parasiteList.push(tp);return 1})()`);
 await b.sleep(400);
 const log=[];
 for(let k=0;k<14;k++){
  const st=JSON.parse(await b.ev(`(function(){var p=window.__tp;return JSON.stringify({x:p.x,y:p.y,sp:p.sp||0,s:Math.sin(p.fp||0)})})()`));
  const r=await b.send('Page.captureScreenshot',{format:'png',clip:{x:Math.max(0,st.x-24),y:Math.max(0,st.y-24),width:48,height:48,scale:4}});
  fs.writeFileSync('/tmp/ws'+k+'.png',Buffer.from(r.data,'base64')); log.push(k+': sp='+st.sp.toFixed(2)+' sin(phase)='+st.s.toFixed(2));
  await b.sleep(30);
 }
 console.log(log.join('\n'));
 }finally{b.close();srv.close();process.exit(0);}})();
