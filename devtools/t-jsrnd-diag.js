// t-jsrnd-diag: per-frame draw-series diagnosis for the live A/B delta (card 014 follow-up).
// Per leg, per stepped frame: A leg {jsDraws, wasmDraws=rndN}, B leg {popsJS, wasmPops, fills}.
// Finds the first frame where the JS-side draw count diverges and the running delta.
const fs=require('fs'),path=require('path'),http=require('http');
const {launch}=require('./harness.js');
const ROOT=path.join(__dirname,'..');
const FR=+process.env.FR||24;
const M={'.html':'text/html','.js':'text/javascript','.wasm':'application/wasm'};
function serve(port){return new Promise(res=>{const s=http.createServer((req,rsp)=>{
  let p=path.join(ROOT,decodeURIComponent(req.url.split('?')[0].split('#')[0]));if(p.endsWith('/'))p+='index.html';
  if(/\.(ttf|woff2?)$/.test(p)){rsp.writeHead(404);rsp.end('nf');return}
  fs.readFile(p,(e,d)=>{if(e){rsp.writeHead(404);rsp.end('nf');return}rsp.writeHead(200,{'content-type':M[path.extname(p)]||'application/octet-stream','cache-control':'no-store'});rsp.end(d)});}).listen(port,()=>res(s))})}
const src=fs.readFileSync(__dirname+'/t-jsrnd-batch-live.js','utf8');
const DET=JSON.parse('"'+src.match(/const DET="((?:[^"\\]|\\.)*)"/)[1]+'"');
const CNT="(function(){var WC=window.__ca2.WC,out={draws:window.__draws||0,rndN:WC.rndN||0,fills:WC.rndFills||0,popsJS:window.__popsJS||0,cells:window.__ca2.getCells().length,food:window.__ca2.getFood().length};if(WC.jsrnd===2){var cap=WC.e.sim_rndcap();var rm=new Uint32Array(WC.mem.buffer,WC.e.sim_rndmeta_ptr(),2);out.pops=out.fills*cap-(rm[1]-rm[0]);out.wasmPops=out.pops-out.popsJS;}return JSON.stringify(out)})()";
async function step(h,n){for(let i=0;i<n;i++){const r=await h.ev("(function(){var q=window.__rafQ.splice(0);window.__now+=16.6667;window.__stepped=(window.__stepped||0)+1;for(var i=0;i<q.length;i++)q[i](window.__now);return window.__stepped})()");if(String(r).indexOf('EXC:')===0)throw new Error('step exc '+r);}}
async function leg(dbg,sport,url){
  const srv=await serve(sport);const h=await launch(dbg,'about:blank',[]);
  await h.send('Page.addScriptToEvaluateOnNewDocument',{source:DET});
  await h.send('Page.navigate',{url});
  for(let i=0;i<60;i++){await h.sleep(500);const r=await h.ev("(performance.getEntriesByType('resource')||[]).some(function(e){return /ca2core.*wasm/.test(e.name)&&e.responseEnd>0})");if(r===true)break;}
  await h.sleep(1000);
  let up=false,bf=0;for(let i=0;i<30;i++){await step(h,1);bf++;up=await h.ev('!!window.__ca2');if(up)break;}
  if(!up)throw new Error('no __ca2 after '+bf);
  const ready=await h.ev('!!(window.__ca2&&window.__ca2.WC.ok)');if(!ready)throw new Error('wasm not ready');
  const series=[];
  for(let f=0;f<FR-bf;f++){await step(h,1);series.push(JSON.parse(await h.ev(CNT)));}
  try{h.close()}catch(e){}srv.close();
  return {bf,series};
}
(async()=>{
  const UP='http://127.0.0.1:';
  const A=await leg(9581,8581,UP+'8581/index.html?jsrnd=1');
  const B=await leg(9582,8582,UP+'8582/index.html?jsrnd=2');
  console.log('bfA='+A.bf+' bfB='+B.bf);
  let dJS=0,firstDiv=-1;
  const n=Math.min(A.series.length,B.series.length);
  for(let f=0;f<n;f++){const a=A.series[f],b=B.series[f];
    const jsA=a.draws-a.rndN, jsB=b.popsJS; dJS=jsA-jsB;
    if(jsA!==jsB&&firstDiv<0)firstDiv=f;
    console.log('f'+f,'jsA='+jsA,'jsB='+jsB,'dJS='+dJS,'wasmA='+a.rndN,'wasmB='+(b.wasmPops||0),'cellsA='+a.cells,'cellsB='+b.cells,'foodA='+a.food,'foodB='+b.food,'fillsB='+b.fills);}
  console.log(JSON.stringify({firstDivFrame:firstDiv,finalDeltaJS:dJS}));
})().catch(e=>{console.error('FATAL',String(e).slice(0,300));process.exit(1)});
