// test-only, bounded: mode 2 right after the switch; hook at the guard exit records any dot still on ink (flags: blob, _pk) and the per-frame end state.
process.env.GUARDHOOK='1';
const H=require('./harness.js'),D=require('./dbg-inject.js');const port=8890;
(async()=>{const srv=await D.serve(port),b=await H.launch(port+1,'http://127.0.0.1:'+port+'/index.html?simab=1',[]);try{
 await b.send('Emulation.setDeviceMetricsOverride',{width:760,height:460,deviceScaleFactor:1,mobile:false});
 await b.sleep(6000);
 await b.ev(`window.__v=[];window.__g=0;window.__gh=function(food,on){window.__g++;var c=0;for(var i=0;i<food.length;i++){var f=food[i];if(on(f.x,f.y)){c++;if(window.__v.length<20)window.__v.push({g:window.__g,x:+f.x.toFixed(1),y:+f.y.toFixed(1),pk:f._pk,blob:!!f.blob,n:food.length})}}window.__lastGuardOn=c;};0`);
 await b.ev(`__ca2.P.grain=0;__ca2.P.pixelRatio=1;__ca2.P.foodMode=2;__ca2.P.UNIVERSE_SIZE=12;0`);
 for(let i=0;i<6;i++){await b.sleep(1000);console.log(await b.ev(`JSON.stringify({guards:window.__g,lastGuardOn:window.__lastGuardOn,viol:window.__v.length,n:__ca2.foodList.length,sample:__ca2.foodList.filter(function(f){return __ca2.sepDiskHit(f.x,f.y,Math.max(0.5,__ca2.P.foodSize/2))}).length})`));}
 console.log('first violations',await b.ev('JSON.stringify(window.__v.slice(0,8))'),'errs',b.errs.length);
 }finally{b.close();srv.close();process.exit(0);}})();
