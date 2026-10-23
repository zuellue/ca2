// test-only: hook installed before load; samples dots-on-ink during the intro (mask fades in) and after, every 500 ms for 14 s. mode via argv.
process.env.GUARDHOOK='1';
const H=require('./harness.js'),D=require('./dbg-inject.js');const port=8895,mode=+(process.argv[2]||2);
(async()=>{const srv=await D.serve(port),b=await H.launch(port+1,'http://127.0.0.1:'+port+'/index.html?simab=1',[]);try{
 await b.send('Emulation.setDeviceMetricsOverride',{width:760,height:460,deviceScaleFactor:1,mobile:false});
 await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__v=[];window.__g=0;window.__gh=function(food,on){window.__g++;var c=0;for(var i=0;i<food.length;i++){var f=food[i];if(on(f.x,f.y)){c++;if(window.__v.length<12)window.__v.push({g:window.__g,x:+f.x.toFixed(1),y:+f.y.toFixed(1),pk:f._pk,blob:!!f.blob,n:food.length})}}window.__lastGuardOn=c;};`});
 await b.send('Page.reload');await b.sleep(1500);
 await b.ev(`__ca2.P.foodMode=${mode};0`);
 const R=[];for(let i=0;i<28;i++){await b.sleep(500);R.push(JSON.parse(await b.ev(`JSON.stringify({g:window.__g,gOn:window.__lastGuardOn,viol:window.__v.length,n:__ca2.foodList.length,s:__ca2.foodList.filter(function(f){return __ca2.sepDiskHit(f.x,f.y,Math.max(0.5,__ca2.P.foodSize/2))}).length})`)));}
 console.log('n',R.map(r=>r.n).join(','),'\nsampler',R.map(r=>r.s).join(','),'\nguardViol',R.map(r=>r.viol).join(','),'\nfirst',await b.ev('JSON.stringify(window.__v.slice(0,6))'),'errs',b.errs.length);
 }finally{b.close();srv.close();process.exit(0);}})();
