// t-jsrnd-batch-live: live A/B gate for the rndbatch transport (card 20261024-014-ca).
// A = ?jsrnd=1 (per-draw env.js_rnd), B = ?jsrnd=2 (shared buffer + Math.random override).
// Both worlds: seeded Math.random, stubbed clock, manually stepped raf, network-off (fetch stub),
// autoQuality pinned off. Gate: projected state BYTE equality + consumed-draw equality at frame FR.
// Also reports SIMW.step (headless SwiftShader wasm sim_step ms, exp-avg; NOT a device number).
const fs=require('fs'),path=require('path'),http=require('http');
const {launch}=require('./harness.js');
const ROOT=path.join(__dirname,'..');
const FR=+process.env.FR||120;
const M={'.html':'text/html','.js':'text/javascript','.ttf':'font/ttf','.png':'image/png','.svg':'image/svg+xml','.wasm':'application/wasm'};
function serve(port){return new Promise(res=>{const s=http.createServer((req,rsp)=>{
  let p=path.join(ROOT,decodeURIComponent(req.url.split('?')[0].split('#')[0]));if(p.endsWith('/'))p+='index.html';
  if(/\.(ttf|woff2?)$/.test(p)){rsp.writeHead(404);rsp.end('nf');return}
  fs.readFile(p,(e,d)=>{if(e){rsp.writeHead(404);rsp.end('nf');return}rsp.writeHead(200,{'content-type':M[path.extname(p)]||'application/octet-stream','cache-control':'no-store'});rsp.end(d)});}).listen(port,()=>res(s))})}
const DET="(function(){window.__now=1000;window.__fetchBlocked=0;var __of=window.fetch;window.fetch=function(u){u=String(u&&u.url||u);if(u.indexOf('http')===0&&u.indexOf('http://127.0.0.1:')!==0){window.__fetchBlocked++;return Promise.reject(new Error('fixture-offline'))}return __of.apply(this,arguments)};var s=0x9e3779b9;Math.random=function(){window.__draws=(window.__draws||0)+1;s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};window.__rafQ=[];window.requestAnimationFrame=function(cb){window.__rafQ.push(cb);return window.__rafQ.length};window.cancelAnimationFrame=function(){};performance.now=function(){return window.__now};Date.now=function(){return window.__now};try{localStorage.setItem('ca2.config',JSON.stringify(JSON.stringify({v:6,P:{autoQuality:0}})))}catch(e){}})()";
const STATE="(function(){function ser(o,d){if(o===null)return 'null';var t=typeof o;if(t==='number'||t==='boolean'||t==='string')return String(o);if(t==='undefined')return 'u';if(t==='function')return 'f';if(d>1)return '[o]';if(ArrayBuffer.isView(o)){var hh=0x811c9dc5;for(var i=0;i<o.length;i++){hh^=+o[i]&0xff;hh=Math.imul(hh,0x01000193)}return '[ta'+o.length+':'+(hh>>>0)+']'}if(Array.isArray(o)){if(o.length>256){var h2=0x811c9dc5;for(var i=0;i<o.length;i++){var q=ser(o[i],9);for(var j=0;j<q.length;j++){h2^=q.charCodeAt(j);h2=Math.imul(h2,0x01000193)}}return '[arr'+o.length+':'+(h2>>>0)+']'}var x='[';for(var i=0;i<o.length;i++){x+=(i?',':'')+ser(o[i],d+1)}return x+']'}var k=Object.keys(o).sort(),x='{';for(var i=0;i<k.length;i++){x+=(i?',':'')+k[i]+':'+ser(o[k[i]],d+1)}return x+'}'}var WC=window.__ca2.WC,cons=window.__draws||0,rm=null;if(WC.jsrnd===2){var cap=WC.e.sim_rndcap();rm=new Uint32Array(WC.mem.buffer,WC.e.sim_rndmeta_ptr(),2);var pops=(WC.rndFills||0)*cap-(rm[1]-rm[0]);cons=pops+((window.__draws||0)-(WC.rndFills||0)*cap);} /* pops + pre-override direct draws; base/fill draws are not consumption */var cells=window.__ca2.getCells(),food=window.__ca2.getFood(),st='C'+cells.map(function(c){return ser(c,0)}).join('|')+'F'+food.map(function(f){return ser(f,0)}).join('|')+'E'+window.__ca2.births+','+window.__ca2.deaths+','+window.__ca2.eaten+','+window.__ca2.divides+','+window.__ca2.merges+'D'+cons+'P'+ser(window.__ca2.P,0);var h=0x811c9dc5;for(var i=0;i<st.length;i++){h^=st.charCodeAt(i);h=Math.imul(h,0x01000193)}return JSON.stringify({h:h>>>0,len:st.length,cells:cells.length,food:food.length,consumed:cons,fills:WC.rndFills||0,rndN:WC.rndN||0,fb:window.__fetchBlocked||0,simStep:+(WC.ok&&window.__ca2.SIMW?window.__ca2.SIMW.step||0:-1).toFixed(3)})})()";
async function step(h,n){for(let i=0;i<n;i++){const r=await h.ev("(function(){var q=window.__rafQ.splice(0);window.__now+=16.6667;window.__stepped=(window.__stepped||0)+1;for(var i=0;i<q.length;i++)q[i](window.__now);return window.__stepped})()");if(String(r).indexOf('EXC:')===0)throw new Error('step exc '+r);}}
async function leg(dbg,sport,url){console.log("LEG-START",url,Date.now());
  const srv=await serve(sport);const h=await launch(dbg,'about:blank',[]);
  await h.send('Page.addScriptToEvaluateOnNewDocument',{source:DET});
  await h.send('Page.navigate',{url});
  // ca2.js defers init (__ca2 creation) to a raf callback; the DET raf queue only fires when stepped,
  // so init needs >=1 stepped frame. For an aligned boot the wasm must be loaded BEFORE frame 1:
  // wait for the wasm resource + instantiate settle first (no frames run meanwhile).
  for(let i=0;i<60;i++){await h.sleep(500);const r=await h.ev("(performance.getEntriesByType('resource')||[]).some(function(e){return /ca2core.*wasm/.test(e.name)&&e.responseEnd>0})");if(r===true)break;}
  await h.sleep(1000);
  let up=false,bf=0;for(let i=0;i<30;i++){await step(h,1);bf++;up=await h.ev('!!window.__ca2');if(up)break;}
  if(!up)throw new Error('no __ca2 after '+bf+' boot frames');
  console.log("LEG-BOOTED",url);const ready=await h.ev("!!(window.__ca2&&window.__ca2.WC.ok)");
  if(!ready)throw new Error('wasm never ready at '+url+' err='+await h.ev('window.__ca2&&window.__ca2.WC.err'));
  await step(h,FR-bf);
  const rawSt=await h.ev(STATE);console.log("RAW",url,String(rawSt).slice(0,240));const st=JSON.parse(rawSt);
  st.errs=h.errs.slice(0,3);
  try{h.close()}catch(e){}
  srv.close();
  return st;
}
(async()=>{
  const UP='http://127.0.0.1:';
  const A=await leg(9561,8561,UP+'8561/index.html?jsrnd=1');console.log('A jsrnd=1',JSON.stringify(A));
  const B=await leg(9562,8562,UP+'8562/index.html?jsrnd=2');console.log('B jsrnd=2',JSON.stringify(B));
  const eq=A.h===B.h&&A.len===B.len&&A.consumed===B.consumed&&A.fb===B.fb;
  console.log(JSON.stringify({gate:eq?'LIVE-BYTE-EQUAL':'LIVE-MISMATCH',hA:A.h,hB:B.h,consumedA:A.consumed,consumedB:B.consumed,cellsA:A.cells,cellsB:B.cells,foodA:A.food,foodB:B.food,simStepA:A.simStep,simStepB:B.simStep,rndNA:A.rndN,rndNB:B.rndN,fillsB:B.fills,frameCount:FR}));
})().catch(e=>{console.error('FATAL',String(e).slice(0,400));process.exit(1)});
