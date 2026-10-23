// test-only regression: the original "mode 2, 4 on ink at first sample" setup (load, 6 s, then foodMode=M and UNIVERSE_SIZE=12 as t-food-ink does),
// sampled every 150 ms for 4 s with the guard-exit hook. Prints max dot count reached, sampler on-ink and guard-exit on-ink per sample.
// node devtools/t-mass-trace.js [mode] [port]   (run once per tree: r3 = c401f06, r4 = r3-on-a07)
process.env.GUARDHOOK='1';
const H=require('./harness.js'),D=require('./dbg-inject.js');const mode=+(process.argv[2]||2),port=+(process.argv[3]||8900);
(async()=>{const srv=await D.serve(port),b=await H.launch(port+1,'http://127.0.0.1:'+port+'/index.html?simab=1',[]);try{
 await b.send('Emulation.setDeviceMetricsOverride',{width:760,height:460,deviceScaleFactor:1,mobile:false});
 await b.sleep(6000);
 await b.ev(`window.__v=[];window.__g=0;window.__gmax=0;window.__gh=function(food,on){window.__g++;var c=0;for(var i=0;i<food.length;i++){var f=food[i];if(on(f.x,f.y)){c++;if(window.__v.length<12)window.__v.push({g:window.__g,x:+f.x.toFixed(1),y:+f.y.toFixed(1),pk:f._pk,blob:!!f.blob,n:food.length})}}if(c>window.__gmax)window.__gmax=c;window.__lastGuardOn=c;};__ca2.P.grain=0;__ca2.P.pixelRatio=1;__ca2.P.foodMode=${mode};__ca2.P.UNIVERSE_SIZE=12;0`);
 const R=[];for(let i=0;i<27;i++){await b.sleep(150);R.push(JSON.parse(await b.ev(`JSON.stringify({n:__ca2.foodList.length,s:__ca2.foodList.filter(function(f){return __ca2.sepDiskHit(f.x,f.y,Math.max(0.5,__ca2.P.foodSize/2))}).length,gOn:window.__lastGuardOn,gmax:window.__gmax,g:window.__g})`)));}
 console.log('mode',mode,'maxN',Math.max(...R.map(r=>r.n)),'\nn',R.map(r=>r.n).join(','),'\nsampler',R.map(r=>r.s).join(','),'\nguardExitMax',R[R.length-1].gmax,'guards',R[R.length-1].g,'\nfirst',await b.ev('JSON.stringify(window.__v.slice(0,6))'),'errs',b.errs.length);
 }finally{b.close();srv.close();process.exit(0);}})();
