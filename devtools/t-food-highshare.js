// test-only fixture: replace the ink mask with a ~96% ink mask (free band only), check spawns land only on free pixels (free-pixel path of foodSpot)
const H=require('./harness.js'),D=require('./dbg-inject.js');
const port=8780;
(async()=>{const srv=await D.serve(port),b=await H.launch(port+1,'http://127.0.0.1:'+port+'/index.html?simab=1',[]);try{
 await b.send('Emulation.setDeviceMetricsOverride',{width:760,height:460,deviceScaleFactor:1,mobile:false});
 await b.sleep(6000);
 await b.ev(`(function(){var S=__ca2.sepState,n=S.mw*S.mh,d=new Uint8ClampedArray(n*4);for(var i=0;i<n;i++)d[i*4+3]=255;var y0=Math.floor(S.mh*0.5),y1=y0+Math.floor(S.mh*0.04);for(var y=y0;y<y1;y++)for(var x=0;x<S.mw;x++)d[(y*S.mw+x)*4+3]=0;S.img=d;__ca2.foodList.length=0;__ca2.P.foodDensity=0.01;window.__band=[y0*2,y1*2];})();0`);
 const S=[];
 for(let i=0;i<12;i++){await b.sleep(1000);S.push(JSON.parse(await b.ev(`JSON.stringify((function(){var o=0,inb=0,l=__ca2.foodList;l.forEach(function(f){if(__ca2.sepDiskHit(f.x,f.y,Math.max(0.5,__ca2.P.foodSize/2)))o++;});return {n:l.length,onInk:o}})())`)));}
 console.log('n',S.map(s=>s.n).join(','),'\nonInk',S.map(s=>s.onInk).join(','),'errs',b.errs.length);
 }finally{b.close();srv.close();process.exit(0);}})();
