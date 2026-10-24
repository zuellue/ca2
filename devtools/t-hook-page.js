// t-hook-page: boot ?jsrnd=1 in headless Chrome, run N s, read the foodSpot/reseedFood hook counters (WC.fsN / WC.rsN) and fault state. Hook-exercise/no-fault check only, NOT a behavior comparison.
const {serve,launch}=require('./harness.js');
const q=process.argv[2]||'jsrnd=1',port=+process.argv[3],secs=+(process.argv[4]||30);
(async()=>{const s=await serve(port);const h=await launch(port+1000,'http://127.0.0.1:'+port+'/index.html?'+q,[]);
for(let i=0;i<45&&!(await h.ev('!!window.__ca2'));i++)await h.sleep(1000);
await h.sleep(2000);await h.ev("__ca2.setKey('autoQuality',0);1");if(process.env.KEYS)await h.ev(process.env.KEYS);await h.sleep(secs*1000);
console.log(q,await h.ev(`(function(){var W=__ca2.WC;return JSON.stringify({jsrnd:W.jsrnd,simd:W.simd,fsN:W.fsN||0,rsN:W.rsN||0,hsN:W.hsN||0,hsOff:!!W.hsOff,hsErr:W.hsErr||null,habSeeds:(__ca2.habStat?__ca2.habStat.seed:null),rndN:W.rndN||0,postOff:!!W.postOff,postErr:W.postErr||null,simOff:!!W.simOff,hasFS:!!(W.e&&W.e.post_food_spot),hasRS:!!(W.e&&W.e.post_reseed_blobs),cells:__ca2.getCells().length,births:__ca2.births})})()`),JSON.stringify(h.errs));
h.close();s.close();process.exit(0)})();
