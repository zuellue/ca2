// t123: parameter sweep ON THE LIVE GLOBAL PRESET BASE (the worker's 134-key preset is the production default;
// repo defaults alone are masked). Fresh chrome profile per combo (harness rule), preset lands from the worker,
// overrides are applied after it lands. Never writes to the preset - admin writes are the owner's channel.
// Usage: node devtools/t123-preset-sweep.js [combosJsonFile] [secsPerCombo]
//   combos file: [["divideAt",3,"clusterCohesion",0.35,"interactionRadius",12], ...] (flat key/value lists)
// Default grid: the architect's axes divideAt {2.2,3,4} x clusterCohesion {0.19,0.35,0.5} x interactionRadius {0.1,6,12,20}.
const H = require('./harness.js');
const fs = require('fs');
const combos = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) : (function () {
  const out = []; for (const d of [2.2, 3, 4]) for (const c of [0.19, 0.35, 0.5]) for (const ir of [0.1, 6, 12, 20]) out.push(['divideAt', d, 'clusterCohesion', c, 'interactionRadius', ir]);
  return out;
})();
const SECS = +process.argv[3] || 45;
async function one(combo, idx) {
  const s = await H.serve(8730 + (idx % 50)); const b = await H.launch(9530 + (idx % 50), 'http://localhost:' + (8730 + (idx % 50)) + '/index.html?perf=1', []);
  try {
    for (let i = 0; i < 90; i++) { await b.sleep(500); if (await b.ev('typeof window.__ca2') === 'object') break; }
    await b.sleep(9000); // the global preset lands async from the worker; overrides go on top of it
    for (let i = 0; i < 20; i++) { await b.sleep(500); if (await b.ev('__ca2.trans===false') === true) break; } // never sample or override mid-morph: lerped values are not the preset
    const base = await b.ev('JSON.stringify({US:__ca2.P.UNIVERSE_SIZE,dA:__ca2.P.divideAt,coh:__ca2.P.clusterCohesion,ir:__ca2.P.interactionRadius})');
    for (let k = 0; k < combo.length; k += 2) await b.ev('__ca2.setKey(' + JSON.stringify(combo[k]) + ',' + combo[k + 1] + ');"set"');
    const s0 = await b.ev('JSON.stringify({b:__ca2.births,d:__ca2.deaths,e:__ca2.eaten,dv:__ca2.divides,pr:__ca2.pairings,m:__ca2.merges,f:__ca2.fusions})');
    const pops = [], cls = [], feds = [];
    for (let t = 0; t < Math.round(SECS / 5); t++) {
      await b.sleep(5000);
      const snap = JSON.parse(await b.ev('JSON.stringify({n:__ca2.getCells().filter(function(c){return c.alive}).length,cl:__ca2.clusters,fd:(function(){var n=0,f=__ca2.getFood();for(var i=0;i<f.length;i++)if((f[i].fed||0)>0)n++;return n})(),fm:__ca2.habitat().fedMax})'));
      pops.push(snap.n); cls.push(snap.cl); feds.push(snap.fd > 0 ? 1 : 0);
    }
    const s1 = JSON.parse(await b.ev('JSON.stringify({b:__ca2.births,d:__ca2.deaths,e:__ca2.eaten,dv:__ca2.divides,pr:__ca2.pairings,m:__ca2.merges,f:__ca2.fusions,pulse:__ca2.habStat.pulse})'));
    const mean = pops.reduce((a, x) => a + x, 0) / pops.length, sd = Math.sqrt(pops.reduce((a, x) => a + (x - mean) * (x - mean), 0) / pops.length);
    console.log(JSON.stringify({ combo: combo, presetBase: JSON.parse(base), births: s1.b - JSON.parse(s0).b, deaths: s1.d - JSON.parse(s0).d, eaten: s1.e - JSON.parse(s0).e, divides: s1.dv - JSON.parse(s0).dv, pairings: s1.pr - JSON.parse(s0).pr, merges: s1.m - JSON.parse(s0).m, fusions: s1.f - JSON.parse(s0).f, pulses: s1.pulse, popMean: +mean.toFixed(0), popMin: Math.min.apply(0, pops), popMax: Math.max.apply(0, pops), popSdMean: +(sd / mean).toFixed(3), clMean: +(cls.reduce((a, x) => a + x, 0) / cls.length).toFixed(2), clMax: Math.max.apply(0, cls), fedPresence: +(feds.reduce((a, x) => a + x, 0) / feds.length).toFixed(2), errs: b.errs.length }));
  } finally { b.close(); s.close(); }
}
(async () => {
  for (let i = 0; i < combos.length; i++) { try { await one(combos[i], i); } catch (e) { console.log(JSON.stringify({ combo: combos[i], error: String(e).slice(0, 200) })); } }
  process.exit(0);
})();
