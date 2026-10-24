// capture-boot-corpus: captured, hash-manifested 120-frame boot-sequence corpus for the
// rndbatch parity gate (card 20261024-373-ca). Same deterministic world as
// devtools/t-jsrnd-batch-live.js (seeded Math.random, stubbed clock, manually stepped raf,
// network-off, autoQuality pinned off, fixed 1300x800 viewport, fonts 404, wasm settled
// BEFORE frame 1 so the boot is aligned), but every stepped frame's canonical state is
// recorded per leg (A=?jsrnd=1, B=?jsrnd=2) into devtools/fixtures/boot-sequence/ with a
// sha256 manifest. The corpus gate (t-jsrnd-batch-corpus.js) then runs the byte-parity
// check with NO live page.
// Frames are stepped by an in-page async loop (raf splice + __now += 16.6667, setTimeout(0)
// macrotask yield between frames, exactly the boundaries the live gate's per-frame CDP
// evals provide). Timing fields (SIMW.step) are deliberately NOT captured - not state.
// Deterministic by construction: same repo bytes + same harness => same corpus.
const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const {launch}=require('./harness.js');
const ROOT=path.join(__dirname,'..');
const OUT=process.env.OUTDIR?path.resolve(process.env.OUTDIR):path.join(__dirname,'fixtures','boot-sequence');
const FR=+process.env.FR||120;
const M={'.html':'text/html','.js':'text/javascript','.ttf':'font/ttf','.png':'image/png','.svg':'image/svg+xml','.wasm':'application/wasm'};
function serve(port){return new Promise(res=>{const s=http.createServer((req,rsp)=>{
  let p=path.join(ROOT,decodeURIComponent(req.url.split('?')[0].split('#')[0]));if(p.endsWith('/'))p+='index.html';
  if(/\.(ttf|woff2?)$/.test(p)){rsp.writeHead(404);rsp.end('nf');return}
  fs.readFile(p,(e,d)=>{if(e){rsp.writeHead(404);rsp.end('nf');return}rsp.writeHead(200,{'content-type':M[path.extname(p)]||'application/octet-stream','cache-control':'no-store'});rsp.end(d)});}).listen(port,()=>res(s))})}
// DET: identical deterministic-world injection to t-jsrnd-batch-live.js (verbatim).
const DET="(function(){window.__now=1000;window.__fetchBlocked=0;var __of=window.fetch;window.fetch=function(u){u=String(u&&u.url||u);if(u.indexOf('http')===0&&u.indexOf('http://127.0.0.1:')!==0){window.__fetchBlocked++;return Promise.reject(new Error('fixture-offline'))}return __of.apply(this,arguments)};var s=0x9e3779b9;Math.random=function(){window.__draws=(window.__draws||0)+1;s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};window.__rafQ=[];window.requestAnimationFrame=function(cb){window.__rafQ.push(cb);return window.__rafQ.length};window.cancelAnimationFrame=function(){};performance.now=function(){return window.__now};Date.now=function(){window.__now};try{localStorage.setItem('ca2.config',JSON.stringify(JSON.stringify({v:6,P:{autoQuality:0}})))}catch(e){}})()";
// RUN: in-page boot+run loop. ser() and the consumed-draw accounting are verbatim the live
// gate's STATE serializer; SIMW.step timing is excluded. Returns JSON string.
const RUN="(async function(){var FR="+FR+";"
+"function ser(o,d){if(o===null)return 'null';var t=typeof o;if(t==='number'||t==='boolean'||t==='string')return String(o);if(t==='undefined')return 'u';if(t==='function')return 'f';if(d>1)return '[o]';if(ArrayBuffer.isView(o)){var hh=0x811c9dc5;for(var i=0;i<o.length;i++){hh^=+o[i]&0xff;hh=Math.imul(hh,0x01000193)}return '[ta'+o.length+':'+(hh>>>0)+']'}if(Array.isArray(o)){if(o.length>256){var h2=0x811c9dc5;for(var i=0;i<o.length;i++){var q=ser(o[i],9);for(var j=0;j<q.length;j++){h2^=q.charCodeAt(j);h2=Math.imul(h2,0x01000193)}}return '[arr'+o.length+':'+(h2>>>0)+']'}var x='[';for(var i=0;i<o.length;i++){x+=(i?',':'')+ser(o[i],d+1)}return x+']'}var k=Object.keys(o).sort(),x='{';for(var i=0;i<k.length;i++){x+=(i?',':'')+k[i]+':'+ser(o[k[i]],d+1)}return x+'}'}"
+"function fstate(f){var WC=window.__ca2.WC,cons=window.__draws||0,rm=null;if(WC.jsrnd===2){var cap=WC.e.sim_rndcap();rm=new Uint32Array(WC.mem.buffer,WC.e.sim_rndmeta_ptr(),2);var pops=(WC.rndFills||0)*cap-(rm[1]-rm[0]);cons=pops+((window.__draws||0)-(WC.rndFills||0)*cap);}var cells=window.__ca2.getCells(),food=window.__ca2.getFood(),st='C'+cells.map(function(c){return ser(c,0)}).join('|')+'F'+food.map(function(f2){return ser(f2,0)}).join('|')+'E'+window.__ca2.births+','+window.__ca2.deaths+','+window.__ca2.eaten+','+window.__ca2.divides+','+window.__ca2.merges+'D'+cons+'P'+ser(window.__ca2.P,0);var h=0x811c9dc5;for(var i=0;i<st.length;i++){h^=st.charCodeAt(i);h=Math.imul(h,0x01000193)}return {frame:f,up:true,h:h>>>0,len:st.length,cells:cells.length,food:food.length,consumed:cons,fills:WC.rndFills||0,rndN:WC.rndN||0,fb:window.__fetchBlocked||0,st:st}}"
+"function stepOnce(){var q=window.__rafQ.splice(0);window.__now+=16.6667;for(var i=0;i<q.length;i++)q[i](window.__now)}"
+"function tick(){return new Promise(function(r){setTimeout(r,0)})}"
+"var frames=[],up=false,bf=0;"
+"for(var i=0;i<30;i++){stepOnce();bf++;up=!!window.__ca2;if(!up){frames.push({frame:bf,up:false});await tick();continue}frames.push(fstate(bf));await tick();break}"
+"if(!up)return JSON.stringify({error:'no __ca2 after '+bf+' boot frames',frames:frames});"
+"if(!(window.__ca2.WC&&window.__ca2.WC.ok))return JSON.stringify({error:'wasm never ready',err:String(window.__ca2.WC&&window.__ca2.WC.err)});"
+"for(var f=bf+1;f<=FR;f++){stepOnce();frames.push(fstate(f));await tick()}"
+"return JSON.stringify({frames:frames,bootFrames:bf})})()";
async function captureLeg(dbg,sport,url){
  console.log("LEG-START",url,new Date().toISOString());
  const srv=await serve(sport);const h=await launch(dbg,'about:blank',[]);
  await h.send('Page.addScriptToEvaluateOnNewDocument',{source:DET});
  await h.send('Page.navigate',{url});
  // Aligned boot (same rule as the live gate): wasm loaded BEFORE frame 1; no frames
  // stepped while waiting, so frame N in leg A is frame N in leg B.
  for(let i=0;i<60;i++){await h.sleep(500);const r=await h.ev("(performance.getEntriesByType('resource')||[]).some(function(e){return /ca2core.*wasm/.test(e.name)&&e.responseEnd>0})");if(r===true)break;}
  await h.sleep(1000);
  const raw=await h.ev(RUN,600000);
  if(String(raw).indexOf('EXC:')===0)throw new Error('run exc '+String(raw).slice(0,400));
  const res=JSON.parse(raw);
  if(res.error)throw new Error(res.error+' '+String(res.err||''));
  console.log("LEG-DONE",url,"bootFrames",res.bootFrames,"frames",res.frames.length);
  try{h.close()}catch(e){}
  srv.close();
  return res;
}
function sha256(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}
(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  const UP='http://127.0.0.1:';
  const A=await captureLeg(9561,8561,UP+'8561/index.html?jsrnd=1');
  const B=await captureLeg(9562,8562,UP+'8562/index.html?jsrnd=2');
  const fa=path.join(OUT,'legA-jsrnd1.jsonl.gz'),fb=path.join(OUT,'legB-jsrnd2.jsonl.gz');
  fs.writeFileSync(fa,require('zlib').gzipSync(A.frames.map(f=>JSON.stringify(f)).join('\n')+'\n',{level:9}));
  fs.writeFileSync(fb,require('zlib').gzipSync(B.frames.map(f=>JSON.stringify(f)).join('\n')+'\n',{level:9}));
  // verdict semantics mirror the corpus gate: per-frame BYTE equality (up-flag, h, len,
  // consumed). fetchBlocked is diagnostic-only: it counts blocked attempts of the
  // preset-sync fetch (ca2.js setInterval(pullG,15000), real-time), not sim state.
  let firstDiv=-1;for(let i=0;i<FR;i++){const a=A.frames[i],b=B.frames[i];if(!a||!b){firstDiv=i+1;break}if(a.up!==b.up||(a.up&&(a.h!==b.h||a.len!==b.len||a.consumed!==b.consumed))){firstDiv=i+1;break}}
  const lastA=A.frames[A.frames.length-1],lastB=B.frames[B.frames.length-1];
  const man={
    card:'20261024-373-ca',
    generator:'devtools/capture-boot-corpus.js',
    repo:'zuellue/ca2',branch:'ca-method-measure',commit:'f3dd18b8c1617f5ccb52f26fe35b93794ccfca26',
    frames:FR,bootFramesA:A.bootFrames,bootFramesB:B.bootFrames,
    viewport:'1300x800',seed:'0x9e3779b9 (splitmix32 Math.random override, DET of t-jsrnd-batch-live.js)',
    world:'stubbed clock from __now=1000 +16.6667/step, manually stepped raf, network-off fetch stub, autoQuality pinned off, local fonts 404, wasm settled before frame 1',
    captured_utc:new Date().toISOString(),
    chrome:(()=>{try{return require('child_process').execSync('google-chrome --version').toString().trim()}catch(e){return 'unknown'}})(),
    node:process.version,
    files:{'legA-jsrnd1.jsonl.gz':sha256(fa),'legB-jsrnd2.jsonl.gz':sha256(fb)},
    capture_verdict:firstDiv===-1?'BYTE-EQUAL':'DIVERGENT@'+firstDiv,
    final:{hA:lastA.h,hB:lastB.h,consumedA:lastA.consumed,consumedB:lastB.consumed,cellsA:lastA.cells,cellsB:lastB.cells,foodA:lastA.food,foodB:lastB.food,fillsB:lastB.fills,rndNA:lastA.rndN,rndNB:lastB.rndN,diagFbA:lastA.fb,diagFbB:lastB.fb}
  };
  fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(man,null,2)+'\n');
  console.log('MANIFEST',JSON.stringify({verdict:man.capture_verdict,files:man.files,final:man.final}));
})().catch(e=>{console.error('FATAL',String(e).slice(0,400));process.exit(1)});
