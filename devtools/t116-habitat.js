const H = require('/home/sandbox/ca2/devtools/harness.js');
(async () => {
  const s = await H.serve(8794); const b = await H.launch(9534, 'http://localhost:8794/index.html?perf=1', []);
  for (let i = 0; i < 90; i++) { await b.sleep(500); if (await b.ev('typeof window.__ca2') === 'object') break; }
  await b.sleep(8000);
  const J = x => JSON.stringify(x);
  console.log('boot:', await b.ev('JSON.stringify({ok:__ca2.WC.ok,cells:__ca2.cells,food:__ca2.getFood().length})'));

  // 1) OFF state: no habitat activity, no fed fields on dots
  await b.sleep(5000);
  console.log('off-state:', await b.ev('JSON.stringify({hab:__ca2.habitat(),fedFields:__ca2.getFood().filter(f=>f.fed!==undefined).length})'));

  // isotropy baseline (habitat off)
  console.log('iso-before:', await b.ev('(function(){var f=__ca2.getFood(),mx=0,my=0,ax=0,ay=0,n=0;for(var i=0;i<f.length;i++){if(f[i].vx===undefined)continue;n++;mx+=f[i].vx;my+=f[i].vy;ax+=Math.abs(f[i].vx);ay+=Math.abs(f[i].vy);}return JSON.stringify({n:n,mx:+(mx/n).toFixed(4),my:+(my/n).toFixed(4),ax:+(ax/n).toFixed(4),ay:+(ay/n).toFixed(4)})})()'));

  // 2) corpse channel: habitat on, sun off, paint all cells red, kill all
  await b.ev('__ca2.setKey("habitatOn",1);__ca2.setKey("habitatSun",0);__ca2.setKey("habitatDeadFed",6);__ca2.setKey("habitatDeadR",120);"set"');
  await b.ev('__ca2.getCells().forEach(function(c){c.g.col=[1,0,0]});"painted"');
  const killed = await b.ev('__ca2.cells');
  await b.ev('__ca2.getCells().forEach(function(c){c.alive=false});"killed"');
  await b.sleep(2500);
  console.log('after-kill:', await b.ev('JSON.stringify({killed:' + killed + ',hab:__ca2.habitat()})'));

  // 3) seeding: low threshold, sun on -> the cycle closes (death -> fed dots -> seeds)
  await b.ev('__ca2.setKey("habitatFedMin",5);__ca2.setKey("habitatConv",4);__ca2.setKey("habitatSun",5);"set2"');
  await b.sleep(8000);
  console.log('after-seed:', await b.ev('JSON.stringify(__ca2.habitat())'));
  console.log('seed-colour:', await b.ev('(function(){var cs=__ca2.getCells(),r=0,g=0,b2=0,n=0;for(var i=0;i<cs.length;i++){if(!cs[i].alive)continue;n++;r+=cs[i].g.col[0];g+=cs[i].g.col[1];b2+=cs[i].g.col[2];}return JSON.stringify({n:n,r:+(r/n).toFixed(3),g:+(g/n).toFixed(3),b:+(b2/n).toFixed(3)})})()'));

  // 4) isotropy with habitat running (sun on, seeds happened)
  console.log('iso-after:', await b.ev('(function(){var f=__ca2.getFood(),mx=0,my=0,ax=0,ay=0,n=0;for(var i=0;i<f.length;i++){if(f[i].vx===undefined)continue;n++;mx+=f[i].vx;my+=f[i].vy;ax+=Math.abs(f[i].vx);ay+=Math.abs(f[i].vy);}return JSON.stringify({n:n,mx:+(mx/n).toFixed(4),my:+(my/n).toFixed(4),ax:+(ax/n).toFixed(4),ay:+(ay/n).toFixed(4)})})()'));

  // 5) perf mark
  console.log('perf:', await b.ev('JSON.stringify({habitat:+(__ca2.PF.habitat||0).toFixed(4),foodStep:+(__ca2.PF["food step"]||0).toFixed(3)})'));

  // 6) aging: lifespan on -> age ticks, nobody outlives its span by much
  await b.ev('__ca2.setKey("cellLife",6);__ca2.getCells().forEach(function(c){c.life=6*(1+Math.random()*0.6-0.3);c.age=0});"life"');
  await b.sleep(9000);
  console.log('aging:', await b.ev('(function(){var cs=__ca2.getCells(),mx=0,over=0,n=0;for(var i=0;i<cs.length;i++){if(!cs[i].alive)continue;n++;var a=cs[i].age||0,l=cs[i].life||0;if(a>mx)mx=a;if(l&&a>l+1)over++;}return JSON.stringify({n:n,maxAge:+mx.toFixed(1),over:over,deaths:__ca2.deaths})})()'));

  console.log('errs', b.errs);
  b.close();
  // boot 2: JS engine path (?nosim=1)
  const b2 = await H.launch(9535, 'http://localhost:8794/index.html?perf=1&nosim=1', []);
  for (let i = 0; i < 90; i++) { await b2.sleep(500); if (await b2.ev('typeof window.__ca2') === 'object') break; }
  await b2.sleep(8000);
  console.log('boot2 (nosim):', await b2.ev('JSON.stringify({simOn:__ca2.SIMW.on,cells:__ca2.cells})'));
  await b2.ev('__ca2.setKey("habitatOn",1);__ca2.setKey("habitatSun",0);__ca2.getCells().forEach(function(c){c.g.col=[0,0,1]});"set"');
  const killed2 = await b2.ev('__ca2.cells');
  await b2.ev('__ca2.getCells().forEach(function(c){c.alive=false});"killed"');
  await b2.sleep(2500);
  console.log('after-kill2:', await b2.ev('JSON.stringify({killed:' + killed2 + ',hab:__ca2.habitat()})'));
  await b2.ev('__ca2.setKey("habitatFedMin",5);__ca2.setKey("habitatConv",4);__ca2.setKey("habitatSun",5);"set2"');
  await b2.sleep(8000);
  console.log('after-seed2:', await b2.ev('JSON.stringify(__ca2.habitat())'));
  console.log('seed-colour2:', await b2.ev('(function(){var cs=__ca2.getCells(),r=0,g=0,b2=0,n=0;for(var i=0;i<cs.length;i++){if(!cs[i].alive)continue;n++;r+=cs[i].g.col[0];g+=cs[i].g.col[1];b2+=cs[i].g.col[2];}return JSON.stringify({n:n,r:+(r/n).toFixed(3),g:+(g/n).toFixed(3),b:+(b2/n).toFixed(3)})})()'));
  console.log('errs2', b2.errs);
  b2.close(); s.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
