// controlled A/B (run once per tree): same seeded Math.random, same params, hostless parasite with no cell in sight and default hard timeout.
// Prints parasite energy and aliveness every 5 s for 40 s. node devtools/t-energy-ab.js [port]
const H=require('./harness.js'),D=require('./dbg-inject.js');
const port=+(process.argv[2]||8840);
(async()=>{const srv=await D.serve(port),b=await H.launch(port+1,'http://127.0.0.1:'+port+'/index.html?simab=1',[]);try{
 await b.send('Emulation.setDeviceMetricsOverride',{width:760,height:460,deviceScaleFactor:1,mobile:false});
 await b.send('Page.addScriptToEvaluateOnNewDocument',{source:'(function(){var s=12345;Math.random=function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}})()'});
 await b.send('Page.reload');
 await b.sleep(9000);
 await b.ev(`__ca2.P.grain=0;__ca2.P.UNIVERSE_SIZE=2;0`);
 await b.sleep(2000);
 await b.ev(`(function(){var c=__ca2.contBox;c.tw=720;c.th=440;return 1})()`);
 await b.sleep(4000);
 console.log('setup',await b.ev(`(function(){var B=__ca2.contBox,cells=__ca2.cellList.filter(function(c){return c.alive}),best=null,bd=-1;
  __ca2.circleList.forEach(function(c){var m=1e9;cells.forEach(function(q){m=Math.min(m,Math.hypot(q.x-c.x,q.y-c.y))});if(m>bd){bd=m;best=c}});
  cells.forEach(function(c){c.maxSpeed=0.02;c.vx=0;c.vy=0});
  __ca2.P.parasiteSight=Math.max(20,Math.min(bd*0.8,60));__ca2.parasiteList.length=0;
  var tp={x:best.x+25,y:best.y+25,e:8,host:null,a:0,ph:1,lost:performance.now()};window.__tp=tp;__ca2.parasiteList.push(tp);
  return JSON.stringify({nearestCell:Math.round(bd),sight:__ca2.P.parasiteSight,hardMs:__ca2.P.parasiteHardMs,hard:__ca2.P.parasiteHard})})()`));
 for(let i=0;i<=8;i++){console.log(i*5,await b.ev(`(function(){var p=window.__tp;return JSON.stringify({alive:__ca2.parasiteList.indexOf(p)>=0,e:+p.e.toFixed(3),host:!!p.host,circ:!!p.circ})})()`));await b.sleep(5000);}
 }finally{b.close();srv.close();process.exit(0);}})();
