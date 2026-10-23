// parasite wing frames (zoomed) + circle-belief census. node devtools/t-wings-shot.js
const H=require('./harness.js'),D=require('./dbg-inject.js'),fs=require('fs');
(async()=>{const srv=await D.serve(8800),b=await H.launch(8801,'http://127.0.0.1:8800/index.html?simab=1',[]);try{
 await b.send('Emulation.setDeviceMetricsOverride',{width:760,height:460,deviceScaleFactor:1,mobile:false});
 await b.sleep(8000);
 await b.ev(`__ca2.P.grain=0;__ca2.P.parasiteFrac=0.6;__ca2.P.parasiteSize=3;0`);
 await b.sleep(3000);
 await b.ev(`(function(){var c=__ca2.contBox;for(var i=0;i<3;i++)__ca2.parasiteList.push({x:c.x+c.w/2+i*40,y:c.y+c.h/2,e:8,host:null,a:0,ph:i});return 1})()`);
 await b.sleep(500);
 const info=JSON.parse(await b.ev(`JSON.stringify({n:__ca2.parasiteList.length,circ:__ca2.parasiteList.filter(p=>p.circ).length,host:__ca2.parasiteList.filter(p=>p.host).length,circles:__ca2.circleList.length,cont:[__ca2.contBox.x,__ca2.contBox.y,__ca2.contBox.w,__ca2.contBox.h]})`));
 console.log(JSON.stringify(info));
 for(let k=0;k<10;k++){
  const pos=JSON.parse(await b.ev(`(function(){var p=__ca2.parasiteList[0];return p?JSON.stringify({x:p.x,y:p.y}):'null'})()`));
  if(!pos){console.log('no parasite');break;}
  const r=await b.send('Page.captureScreenshot',{format:'png',clip:{x:Math.max(0,pos.x-30),y:Math.max(0,pos.y-30),width:60,height:60,scale:5}});
  fs.writeFileSync('/tmp/wing'+k+'.png',Buffer.from(r.data,'base64'));
  await b.sleep(20);
 }
 console.log('errs',b.errs.length);
 }finally{b.close();srv.close();process.exit(0);}})();
