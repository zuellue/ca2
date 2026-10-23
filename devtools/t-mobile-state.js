const H=require('./harness.js'),D=require('./dbg-inject.js');
(async()=>{const srv=await D.serve(8830),b=await H.launch(8831,'http://127.0.0.1:8830/index.html?simab=1&mobile=1',[]);try{
 await b.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await b.sleep(7000);
 console.log(await b.ev(`JSON.stringify({mode:(window.__ca2Mode&&window.__ca2Mode()),bodyMode:document.body.dataset.ca2mode||document.body.className,iw:innerWidth,ih:innerHeight,coarse:matchMedia('(hover: none) and (pointer: coarse)').matches,cont:[__ca2.contBox.w,__ca2.contBox.h]})`));
 }finally{b.close();srv.close();process.exit(0);}})();
