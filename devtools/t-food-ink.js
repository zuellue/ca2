// food vs letter-ink exclusion: samples dots on ink over time. node devtools/t-food-ink.js [mode]
const H=require('./harness.js');
const mode=+(process.argv[2]||3), port=8700+(process.env.PO|0)*10;
(async()=>{const srv=await H.serve(port),b=await H.launch(port+1,'http://127.0.0.1:'+port+'/index.html?simab=1',[]);try{
 await b.send('Emulation.setDeviceMetricsOverride',{width:760,height:460,deviceScaleFactor:1,mobile:false});
 await b.sleep(6000);
 await b.ev(`__ca2.P.grain=0;__ca2.P.pixelRatio=1;__ca2.P.foodMode=${mode};__ca2.P.UNIVERSE_SIZE=12;0`);
 const S=[];
 for(let i=0;i<25;i++){await b.sleep(1000);const r=await b.ev(`JSON.stringify(Object.assign({fig:__ca2.foodInkFig},__ca2.foodInkGuardStat()))`);S.push(JSON.parse(r));}
 const on=S.map(s=>s.onInk),n=S.map(s=>s.n);
 console.log(JSON.stringify(S[S.length-1].fig));console.log("mode",mode,'n',n.join(','),'\nonInk',on.join(','),'mask',S[0].sw,'errs',b.errs.length);
 }finally{b.close();srv.close();process.exit(0);}})();
