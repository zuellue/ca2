// body plans: shape diversity metric, source budget, wasm/JS parity with shapes, perf on/off.
const H=require('./harness.js');const fs=require('fs');
(async()=>{const s=await H.serve(8770);const b=await H.launch(9512,'http://localhost:8770/index.html',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(5000);
await b.ev("__ca2.P.minRefreshInterval=9999;__ca2.P.maxRefreshInterval=9999;__ca2.setKey('UNIVERSE_SIZE',70);'ok'");
await b.sleep(4000);
const st=await b.ev("JSON.stringify(__ca2.shapeStat())");
console.log('SHAPE-ON',st);
const src=await b.ev("JSON.stringify(__ca2.srcStat())");
console.log('SRC',src);
// shapes off: everything back to single discs
await b.ev("__ca2.setKey('cellShapes',0);'ok'");await b.sleep(300);
const off=await b.ev("JSON.stringify({src:__ca2.srcStat(),cells:__ca2.cells})");
console.log('SHAPES-OFF',off);
await b.ev("__ca2.setKey('cellShapes',1);'ok'");await b.sleep(300);
// wasm vs JS parity with shapes on
const cmp=await b.ev("__ca2.cmpWC()");
console.log('CMPWC',cmp);
// perf: field ms with shapes on vs off (same frame conditions, exponential PF average; sample after settle)
const perf=async(label)=>{await b.sleep(6000);return label+':'+await b.ev("JSON.stringify({field:__ca2.PF['mb:field'],pix:__ca2.PF['mb:pixel loop'],sim:__ca2.PF['sim+ui draw'],src:__ca2.srcStat()})")};
console.log(await perf('ON '));
await b.ev("__ca2.setKey('cellShapes',0);'ok'");
console.log(await perf('OFF'));
await b.ev("__ca2.setKey('cellShapes',1);'ok'");
// heading coherence: string cells' dir should track their velocity over time
const hd=await b.ev(`(function(){var cs=__ca2.getCells(),out=[];cs.forEach(function(c){if(c.shp&&c.shp.t===1&&Math.hypot(c.vx,c.vy)>0.5){var d=Math.atan2(c.vy,c.vx)-c.shp.dir;while(d>3.1416)d-=6.2832;while(d<-3.1416)d+=6.2832;out.push(Math.abs(d));}});out.sort(function(a,b2){return a-b2});return JSON.stringify({n:out.length,medRad:out.length?+out[Math.floor(out.length/2)].toFixed(3):null})})()`);
console.log('HEADING',hd);
const shot=await b.send('Page.captureScreenshot',{format:'png'});
fs.writeFileSync('/tmp/ca2work/local-shapes.png',Buffer.from(shot.data,'base64'));
await b.sleep(4000);
const shot2=await b.send('Page.captureScreenshot',{format:'png'});
fs.writeFileSync('/tmp/ca2work/local-shapes2.png',Buffer.from(shot2.data,'base64'));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
