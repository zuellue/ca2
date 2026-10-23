// food vs letter-ink exclusion: samples dots on ink over time. node devtools/t-food-ink.js [mode]
const H=require('./harness.js'),D=require('./dbg-inject.js');
const mode=+(process.argv[2]||3), port=8700+(process.env.PO|0)*10;
(async()=>{const srv=await D.serve(port),b=await H.launch(port+1,'http://127.0.0.1:'+port+'/index.html?simab=1'+(process.env.VM?'&mobile=1':''),[]);try{
 await b.send('Emulation.setDeviceMetricsOverride',{width:+(process.env.VW||760),height:+(process.env.VH||460),deviceScaleFactor:1,mobile:!!process.env.VM});
 await b.sleep(6000);
 await b.ev(`__ca2.P.grain=0;__ca2.P.pixelRatio=1;__ca2.P.foodMode=${mode};__ca2.P.UNIVERSE_SIZE=12;0`);
 const S=[];
 for(let i=0;i<20;i++){await b.sleep(1000);const r=await b.ev(`JSON.stringify((function(){var o=0;__ca2.foodList.forEach(function(f){if(__ca2.sepDiskHit(f.x,f.y,Math.max(0.5,__ca2.P.foodSize/2)))o++});return {n:__ca2.foodList.length,onInk:o,sw:!!__ca2.sepMask.on}})())`);S.push(JSON.parse(r));}
 const on=S.map(s=>s.onInk),n=S.map(s=>s.n);
 console.log("mode",mode,'n',n.join(','),'\nonInk',on.join(','),'mask',S[0].sw,'errs',b.errs.length);
 }finally{b.close();srv.close();process.exit(0);}})();
