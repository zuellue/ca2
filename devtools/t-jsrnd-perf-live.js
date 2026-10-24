// t-jsrnd-perf-live: free-running live frame stats per random-transport method (card 014 follow-up).
// No determinism fixture (real clock, real raf): boots each variant, runs ~RUNS ms, reads the
// page's own exp-avg stage stats (SIMW.step = wasm sim_step ms, SIMW.pack, SIMW.ms, MB.ms).
// autoQuality pinned off (it would react to real frame times). Headless SwiftShader numbers -
// NOT device numbers; relative within-run comparison only.
const fs=require('fs'),path=require('path'),http=require('http');
const {launch}=require('./harness.js');
const ROOT=path.join(__dirname,'..');
const RUNS=+process.env.RUNS||20000;
const M={'.html':'text/html','.js':'text/javascript','.wasm':'application/wasm'};
function serve(port){return new Promise(res=>{const s=http.createServer((req,rsp)=>{
  let p=path.join(ROOT,decodeURIComponent(req.url.split('?')[0].split('#')[0]));if(p.endsWith('/'))p+='index.html';
  if(/\.(ttf|woff2?)$/.test(p)){rsp.writeHead(404);rsp.end('nf');return}
  fs.readFile(p,(e,d)=>{if(e){rsp.writeHead(404);rsp.end('nf');return}rsp.writeHead(200,{'content-type':M[path.extname(p)]||'application/octet-stream','cache-control':'no-store'});rsp.end(d)});}).listen(port,()=>res(s))})}
const PIN="(function(){try{localStorage.setItem('ca2.config',JSON.stringify(JSON.stringify({v:6,P:{autoQuality:0}})))}catch(e){}})()";
const STAT="(function(){var C=window.__ca2,WC=C.WC,S=C.SIMW||{};return JSON.stringify({ok:WC.ok,jsrnd:WC.jsrnd,pack:+(S.pack||0).toFixed(3),step:+(S.step||0).toFixed(3),js:+(S.js||0).toFixed(3),ms:+(S.ms||0).toFixed(3),mb:+(C.PF&&C.PF['metaballs total']||0).toFixed(3),cells:C.getCells().length,food:C.getFood().length,rndN:WC.rndN||0,fills:WC.rndFills||0,err:WC.err||null})})()";
async function leg(dbg,sport,url){
  const srv=await serve(sport);const h=await launch(dbg,'about:blank',[]);
  await h.send('Page.addScriptToEvaluateOnNewDocument',{source:PIN});
  await h.send('Page.navigate',{url});
  for(let i=0;i<120;i++){await h.sleep(500);if(await h.ev('!!(window.__ca2&&window.__ca2.WC&&(window.__ca2.WC.ok||window.__ca2.WC.err))'))break;}
  await h.sleep(RUNS);
  const st=JSON.parse(await h.ev(STAT));
  try{h.close()}catch(e){}srv.close();
  return st;
}
(async()=>{
  const UP='http://127.0.0.1:';
  const LEGS=process.env.LEGS||'ABC';
  if(LEGS.includes('A')){const A=await leg(9591,8591,UP+'8591/index.html?jsrnd=1');console.log('A jsrnd=1',JSON.stringify(A));}
  if(LEGS.includes('B')){const B=await leg(9592,8592,UP+'8592/index.html?jsrnd=2');console.log('B jsrnd=2',JSON.stringify(B));}
  if(LEGS.includes('C')){const C=await leg(9593,8593,UP+'8593/index.html');console.log('C default',JSON.stringify(C));}
})().catch(e=>{console.error('FATAL',String(e).slice(0,300));process.exit(1)});
