// t-kernel-hits: measured kernel call counts + sampled Math.random caller attribution per foodMode (jsrnd=1 or default), headless, one run per mode, N s.
// WC.e is replaced by a counting Proxy (calls only, stream unchanged); Math.random wrapper counts every call and samples 1 in 10 stacks for the top JS function. NOT a behavior comparison.
const {serve,launch}=require('./harness.js');
const q=process.argv[2]||'jsrnd=1',port=+process.argv[3],mode=+process.argv[4],secs=+(process.argv[5]||15);
(async()=>{const s=await serve(port);const h=await launch(port+1000,'http://127.0.0.1:'+port+'/index.html?'+q,[]);
for(let i=0;i<45&&!(await h.ev('!!window.__ca2'));i++)await h.sleep(1000);
await h.sleep(2000);await h.ev("__ca2.setKey('autoQuality',0);1");
await h.ev(`(function(){var W=__ca2.WC,E=W.e,cnt=window.__kc={},rc=window.__rc={total:0,by:{}},o=Math.random,i=0;
W.e=new Proxy(E,{get:function(t,k){var v=t[k];if(typeof v!=='function')return v;return function(){cnt[k]=(cnt[k]||0)+1;return v.apply(t,arguments)}}});
Math.random=function(){rc.total++;if(++i%10===0){var m=(new Error().stack||'').split('\\n')[2]||'';m=m.replace(/^\\s*at\\s+/,'').replace(/\\s*\\(.*$/,'').slice(0,40);rc.by[m]=(rc.by[m]||0)+1}return o()};return 1})()`);
await h.ev("__ca2.setKey('foodMode',"+mode+");1");await h.sleep(secs*1000);
const r=JSON.parse(await h.ev("JSON.stringify({kc:window.__kc,rc:window.__rc,W:{lbN:__ca2.WC.lbN||0,wmN:__ca2.WC.wmN||0,fsN:__ca2.WC.fsN||0,rsN:__ca2.WC.rsN||0,rndN:__ca2.WC.rndN||0,postOff:!!__ca2.WC.postOff,simOff:!!__ca2.WC.simOff}})"));
const kk={};for(const k in r.kc)if(/fd1_tick|sw_run|wm_run|sp_run|bs_run|pa_run|tr_run|post_life_births|post_worm_step|post_reseed_blobs/.test(k))kk[k]=r.kc[k];
const top=Object.entries(r.rc.by).sort((a,b)=>b[1]-a[1]).slice(0,8);
console.log(JSON.stringify({q,mode,secs,kernelCalls:kk,mathRandomTotal:r.rc.total,sampled1in10Top:top,W:r.W}));
h.close();s.close();process.exit(0)})();
