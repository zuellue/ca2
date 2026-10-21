// t120: birth cap + niches + drift, two viewports. Samples population series, quadrant hue spread, isotropy.
const H = require('./harness.js');
async function run(name, emu, cfg, port) {
  const s = await H.serve(8760 + port); const b = await H.launch(9560 + port, 'http://localhost:' + (8760 + port) + '/index.html?perf=1', []);
  if (emu) { await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }); await b.send('Page.reload'); }
  for (let i = 0; i < 90; i++) { await b.sleep(500); if (await b.ev('typeof window.__ca2') === 'object') break; }
  await b.sleep(6000);
  const us = await b.ev('__ca2.P.UNIVERSE_SIZE');
  await b.ev('__ca2.setKey("divideOn",0);__ca2.setKey("habitatOn",1);__ca2.setKey("habitatFloor",100000);__ca2.setKey("habitatFedMin",1);__ca2.setKey("habitatSun",3);__ca2.setKey("habitatConv",3);' + cfg + '"cfg"');
  const series = [];
  for (let t = 0; t < 15; t++) { await b.sleep(3000); series.push(await b.ev('__ca2.getCells().length')); }
  const quad = await b.ev('(function(){var cs=__ca2.getCells(),cx=__ca2.cont.x+__ca2.cont.w/2,cy=__ca2.cont.y+__ca2.cont.h/2,q=[[],[],[],[]];for(var i=0;i<cs.length;i++){var c=cs[i];if(!c.alive||!c.g||!c.g.col)continue;var k=(c.x>cx?1:0)+(c.y>cy?2:0);q[k].push(c.g.col);}var m=q.map(function(a){if(!a.length)return null;var r=0,g=0,b2=0;for(var i=0;i<a.length;i++){r+=a[i][0];g+=a[i][1];b2+=a[i][2];}return[r/a.length,g/a.length,b2/a.length,a.length]});var spread=0;for(var i=0;i<4;i++)for(var j=i+1;j<4;j++){if(!m[i]||!m[j])continue;var d=Math.hypot(m[i][0]-m[j][0],m[i][1]-m[j][1],m[i][2]-m[j][2]);if(d>spread)spread=d;}return JSON.stringify({quadHueSpread:+spread.toFixed(3),qN:m.map(function(x){return x?x[3]:0})})})()');
  const iso = await b.ev('(function(){var cs=__ca2.getCells(),vx=0,vy=0,n=0;for(var i=0;i<cs.length;i++){var c=cs[i];if(!c.alive)continue;vx+=c.vx;vy+=c.vy;n++;}return JSON.stringify({vx:+(vx/n).toFixed(3),vy:+(vy/n).toFixed(3)})})()');
  const mean = series.reduce((a, x) => a + x, 0) / series.length, sd = Math.sqrt(series.reduce((a, x) => a + (x - mean) * (x - mean), 0) / series.length);
  console.log(name, JSON.stringify({ US: +us.toFixed(0), cap2x: Math.round(2 * us), lastCells: series[14], fluctSdMean: +(sd / mean).toFixed(3), quad: JSON.parse(quad), iso: JSON.parse(iso), errs: b.errs.length }));
  console.log(name, 'series:', series.join(','));
  b.close(); s.close();
}
(async () => {
  await run('A-desktop-niches+drift', false, '', 0);
  await run('B-desktop-control(niches=1,drift=0)', false, '__ca2.setKey("habitatNiches",1);__ca2.setKey("habitatDrift",0);__ca2.setKey("habitatDriftAmp",0);', 10);
  await run('C-mobile390-niches+drift', true, '', 20);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
