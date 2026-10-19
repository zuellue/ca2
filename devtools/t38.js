const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9480,'http://localhost:8765/index.html',[]);await b.sleep(5000);await b.mouse(5,5);
for(const [lab,fit,R] of [['new',1,1.5],['old',0,0]]){
await b.ev("(function(){var a=window.__ca2;a.P.minRefreshInterval=9999;a.P.maxRefreshInterval=9999;a.P.edgeFit="+fit+";a.P.boundZoneR="+R+";window.__mx=0;window.__n=0;window.__ov=0;a.getCells().forEach(function(c,i){c.radius=i%2?90:12;c.maxSpeed=Math.max(c.maxSpeed,3)});window.__iv=setInterval(function(){var k=a.cont;a.getCells().forEach(function(c){var o=Math.max(k.x-(c.x-c.radius),(c.x+c.radius)-(k.x+k.w),k.y-(c.y-c.radius),(c.y+c.radius)-(k.y+k.h));if(c.radius>40){window.__n++;if(o>0)window.__ov=(window.__ov||0)+1;if(o>window.__mx)window.__mx=o}})},50)})()");
await b.sleep(20000);
console.log(lab,await b.ev("clearInterval(window.__iv);JSON.stringify({maxOvershootPx:Math.round(window.__mx),samplesBig:window.__n,overSamples:window.__ov||0,cells:window.__ca2.getCells().length,plate:[window.__ca2.cont.w,window.__ca2.cont.h].map(Math.round)})"));}
console.log(b.errs);b.close();process.exit(0)})();
