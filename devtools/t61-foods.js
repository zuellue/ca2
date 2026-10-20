// living foods: worms crawl/grow/split/get eaten; spores mature/burst/settle; mode switching wipes cleanly.
const H=require('./harness.js');const fs=require('fs');
(async()=>{const s=await H.serve(8773);const b=await H.launch(9515,'http://localhost:8773/index.html',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3500);
await b.ev("__ca2.P.minRefreshInterval=9999;__ca2.P.maxRefreshInterval=9999;__ca2.P.foodLifeMs=120;'ok'");
// worms
await b.ev("__ca2.setKey('foodMode',4);'ok'");await b.sleep(9000);
console.log('WORMS',await b.ev("JSON.stringify({stat:__ca2.wormStat,n:__ca2.worms.length,lens:__ca2.worms.map(function(w){return w.d.length}).slice(0,12),food:__ca2.getFood().length})"));
// movement: worm heads should actually travel
const mv=await b.ev(`(function(){var T=__ca2.worms.map(function(w){return {x:w.x,y:w.y}});return new Promise(function(res){setTimeout(function(){var d=0;__ca2.worms.forEach(function(w,i){if(T[i])d+=Math.hypot(w.x-T[i].x,w.y-T[i].y)});res('travel '+(T.length?d/T.length:0).toFixed(1)+'px avg')},2500)})})()`);
console.log('WORM-MOVE',mv);
const shot=await b.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/ca2work/food-worms.png',Buffer.from(shot.data,'base64'));
// spores
await b.ev("__ca2.setKey('foodMode',5);'ok'");
console.log('WIPE4',await b.ev("JSON.stringify({worms:__ca2.worms.length,wormDots:__ca2.getFood().filter(function(f){return f.worm}).length})"));
await b.sleep(14000);
console.log('SPORES',await b.ev("JSON.stringify({stat:__ca2.sporeStat,n:__ca2.spores.length,stages:__ca2.spores.reduce(function(m,s){m[s.st]=(m[s.st]||0)+1;return m},{}),food:__ca2.getFood().length})"));
const shot2=await b.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/ca2work/food-spores.png',Buffer.from(shot2.data,'base64'));
// switch back to swarm: spores wiped
await b.ev("__ca2.setKey('foodMode',3);'ok'");await b.sleep(500);
console.log('WIPE5',await b.ev("JSON.stringify({spores:__ca2.spores.length,sporeDots:__ca2.getFood().filter(function(f){return f.spore}).length})"));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
