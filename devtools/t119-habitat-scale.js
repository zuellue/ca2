// t119: habitat scaling rules - deadR as dish-width ratio, seed capacity gate, area-scaled conv; two viewports
const H = require('./harness.js');
async function viewport(name, extra, port) {
  const s = await H.serve(8780 + port); const b = await H.launch(9540 + port, 'http://localhost:' + (8780 + port) + '/index.html?perf=1', extra);
  for (let i = 0; i < 90; i++) { await b.sleep(500); if (await b.ev('typeof window.__ca2') === 'object') break; }
  await b.sleep(6000);
  const geo = await b.ev('JSON.stringify({iw:innerWidth,ih:innerHeight,W:__ca2.W,H:__ca2.H,cw:__ca2.cont.w,ch:__ca2.cont.h,US:__ca2.P.UNIVERSE_SIZE,deadR:__ca2.P.habitatDeadR,effR:+(__ca2.P.habitatDeadR*__ca2.cont.w).toFixed(1),areaRatio:+(__ca2.cont.w*__ca2.cont.h/(__ca2.W*__ca2.H)).toFixed(3)})');
  await b.ev('__ca2.setKey("divideOn",0);__ca2.setKey("habitatOn",1);__ca2.setKey("habitatFloor",100000);__ca2.setKey("habitatFedMin",1);__ca2.setKey("habitatSun",5);__ca2.setKey("habitatConv",5);"cfg"');
  await b.ev('__ca2.getCells().forEach(function(c){c.alive=false});"killed"');
  await b.sleep(2000);
  const s0 = await b.ev('JSON.stringify({cells:__ca2.getCells().length,seed:__ca2.habStat.seed,pulse:__ca2.habStat.pulse})');
  await b.sleep(5000);
  const s1 = await b.ev('JSON.stringify({cells:__ca2.getCells().length,seed:__ca2.habStat.seed})');
  await b.sleep(20000);
  const s2 = await b.ev('JSON.stringify({cells:__ca2.getCells().length,seed:__ca2.habStat.seed,pulse:__ca2.habStat.pulse,fedMax:__ca2.habitat().fedMax})');
  console.log(name, 'geo:', geo);
  console.log(name, 't+2s:', s0, ' t+7s:', s1, ' t+27s:', s2, ' errs:', JSON.stringify(b.errs));
  b.close(); s.close();
}
(async () => {
  await viewport('desktop(1300x800)', [], 0);
  await viewport('mobile(390x844)', ['--window-size=390,844'], 10);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
