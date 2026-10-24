// t-food-ink-samestate: same-world A/B proof for the food-ink fallback (3b6fc54).
// pre = ca2.js @ 43ec2a49 (pre-fix), post = worktree ca2.js. Both pages get a seeded Math.random,
// a stubbed clock (performance.now/Date.now = frame counter) and a manually stepped raf queue, so
// they reach an identical world state. All comparisons are on the scene (largest 2D) canvas:
//   blackbg: pixels differing between pre/post must be only food-ink pixels (masked hash equal,
//            listed pixels dark in pre, bright in post).
//   default: full-canvas hashes must be EXACTLY equal (fix inert when food ink differs from bg).
const http=require('http'),fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const {launch}=require('./harness.js');
const ROOT=path.join(__dirname,'..'),PREJS='/tmp/ca2-prefix.js';
execSync('git -C '+ROOT+' show 43ec2a49f58245b0b58fa14b6589af0b78cb50ad:ca2.js > '+PREJS);
const M={'.html':'text/html','.js':'text/javascript','.ttf':'font/ttf','.png':'image/png','.svg':'image/svg+xml'};
function serve(port,ovr){return new Promise(res=>{const s=http.createServer((req,rsp)=>{
  let up=decodeURIComponent(req.url.split('?')[0].split('#')[0]);if(up.endsWith('/'))up+='index.html';
  let p=(ovr&&ovr[up])||path.join(ROOT,up);
  if(p.endsWith('.ttf')||p.endsWith('.woff')||p.endsWith('.woff2')){rsp.writeHead(404);rsp.end('nf');return}fs.readFile(p,(e,d)=>{if(e){rsp.writeHead(404);rsp.end('nf');return}rsp.writeHead(200,{'content-type':M[path.extname(p)]||'application/octet-stream','cache-control':'no-store'});rsp.end(d)});}).listen(port,()=>res(s))})}
const DET=cfg=>"(function(){window.__now=1000;var s=0x9e3779b9;Math.random=function(){s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};window.__rafQ=[];window.__stepped=0;window.requestAnimationFrame=function(cb){window.__rafQ.push(cb);return window.__rafQ.length};window.cancelAnimationFrame=function(){};performance.now=function(){return window.__now};Date.now=function(){return window.__now};"+(cfg?"try{localStorage.setItem('ca2.config',"+JSON.stringify(JSON.stringify(cfg))+")}catch(e){}":"")+"})()";
const BLACK={v:6,P:{foodColor:'#000000',autoQuality:0},bgTarget:[0,0,0],bgIndex:0};
const DEFQ={v:6,P:{autoQuality:0}}; // autoQuality reacts to REAL frame times -> nondeterministic res under the harness; pin it off in both worlds
const PICK="var cs=document.querySelectorAll('canvas'),cv=null,big=0;for(var i=0;i<cs.length;i++){var c=cs[i];try{var x=c.getContext('2d');if(x&&c.width*c.height>big){big=c.width*c.height;cv=c}}catch(e){}}if(!cv)return 'NOCANVAS';var ctx=cv.getContext('2d'),W2=cv.width,H2=cv.height";
const EXTRACT="(function(){"+PICK+";var d=ctx.getImageData(0,0,W2,H2).data,h1=0x811c9dc5,h2=5381,list=[],i;for(var p=0;p<d.length;p+=4){var r=d[p],g=d[p+1],b=d[p+2],a=d[p+3];h1^=r;h1=Math.imul(h1,0x01000193);h1^=g;h1=Math.imul(h1,0x01000193);h1^=b;h1=Math.imul(h1,0x01000193);h1^=a;h1=Math.imul(h1,0x01000193);h2=(Math.imul(h2,33)+r+3*g+7*b+11*a)|0;if(r>48&&g>48&&b>48)list.push(p>>2)}return JSON.stringify({w:W2,h:H2,h1:h1>>>0,h2:h2>>>0,nlist:list.length,list:list})})()";
const MASKED=listJson=>"(function(){var L="+listJson+";"+PICK+";var d=ctx.getImageData(0,0,W2,H2).data,mark=new Uint8Array(W2*H2),i,mx=0,sum=0;for(i=0;i<L.length;i++){mark[L[i]]=1;var o=L[i]*4;var v=Math.max(d[o],d[o+1],d[o+2]);if(v>mx)mx=v;sum+=v}var h1=0x811c9dc5,h2=5381;for(var p=0;p<d.length;p+=4){var q=p>>2,r=mark[q]?0:d[p],g=mark[q]?0:d[p+1],b=mark[q]?0:d[p+2],a=mark[q]?0:d[p+3];h1^=r;h1=Math.imul(h1,0x01000193);h1^=g;h1=Math.imul(h1,0x01000193);h1^=b;h1=Math.imul(h1,0x01000193);h1^=a;h1=Math.imul(h1,0x01000193);h2=(Math.imul(h2,33)+r+3*g+7*b+11*a)|0}return JSON.stringify({h1:h1>>>0,h2:h2>>>0,maxvAtList:mx,meanvAtList:L.length?Math.round(sum/L.length):0,n:L.length})})()";
const CROP=(cx,cy)=>"(function(){"+PICK+";var s=121,x0=Math.max(0,Math.min(W2-s,"+cx+"-60)),y0=Math.max(0,Math.min(H2-s,"+cy+"-60));var oc=document.createElement('canvas');oc.width=s;oc.height=s;oc.getContext('2d').drawImage(cv,x0,y0,s,s,0,0,s,s);return oc.toDataURL('image/png')})()";
async function boot(dbg,url,cfg){
  const h=await launch(dbg,'about:blank',[]);
  await h.send('Page.addScriptToEvaluateOnNewDocument',{source:DET(cfg)});
  await h.send('Page.navigate',{url});
  for(let i=0;i<90;i++){await h.sleep(400);if(await h.ev('!!window.__ca2'))break;await step(h,1);}
  await h.ev('(document.fonts&&document.fonts.ready?document.fonts.ready.then(function(){return 1}):Promise.resolve(1))');
  return h;
}
async function step(h,n){const r=await h.ev("(function(){for(var k=0;k<"+n+";k++){window.__stepped++;var t=window.__now+33.333;window.__now=t;var q=window.__rafQ.splice(0);for(var i=0;i<q.length;i++)q[i](t)}return window.__now})()",120000);if(typeof r==='string'&&r.indexOf('EXC:')===0)throw new Error(r);return r}
async function run(dbg,url,cfg,frames,shotPath){
  const h=await boot(dbg,url,cfg);
  const done=await h.ev('window.__stepped||0');
  for(let f=done;f<frames;f+=5)await step(h,5);
  const now=await h.ev('window.__now');
  const ex=JSON.parse(await h.ev(EXTRACT));
  const cropAt=ex.nlist?[ex.list[0]%ex.w,Math.floor(ex.list[0]/ex.w)]:null;
  let crop=null; if(cropAt){const du=await h.ev(CROP(cropAt[0],cropAt[1]));crop='/tmp/foodink-ss-'+path.basename(shotPath,'.png')+'-crop.png';fs.writeFileSync(crop,Buffer.from(du.split(',')[1],'base64'));}
  await h.shot(shotPath);
  return {h,ex,now,crop,cropAt};
}
(async()=>{
  const sPost=await serve(8381,null),sPre=await serve(8382,{'/ca2.js':PREJS});
  const UP='http://127.0.0.1:',FR=120;
  // blackbg pair (kept alive for masked re-hash)
  const A=await run(9481,UP+'8381/index.html',BLACK,FR,'/tmp/foodink-ss-A-post-blackbg.png');
  const B=await run(9482,UP+'8382/index.html',BLACK,FR,'/tmp/foodink-ss-B-pre-blackbg.png');
  const uni=Array.from(new Set(A.ex.list.concat(B.ex.list)));
  const uj=JSON.stringify(uni);
  const mA=JSON.parse(await A.h.ev(MASKED(uj))),mB=JSON.parse(await B.h.ev(MASKED(uj)));
  A.h.close();B.h.close();
  // default pair
  const C=await run(9483,UP+'8381/index.html',DEFQ,FR,'/tmp/foodink-ss-C-post-default.png');
  const D=await run(9484,UP+'8382/index.html',DEFQ,FR,'/tmp/foodink-ss-D-pre-default.png');
  C.h.close();D.h.close();
  sPost.close();sPre.close();
  const out={
    frames:{A:A.now,B:B.now,C:C.now,D:D.now},
    blackbg:{
      A:{nlist:A.ex.nlist,h1:A.ex.h1,h2:A.ex.h2},B:{nlist:B.ex.nlist,h1:B.ex.h1,h2:B.ex.h2},
      unionN:uni.length,maskedA:mA,maskedB:mB,
      onlyFoodDiff:mA.h1===mB.h1&&mA.h2===mB.h2,
      preInvisibleAtList:mB.maxvAtList<48},
    defaults:{
      C:{nlist:C.ex.nlist,h1:C.ex.h1,h2:C.ex.h2},D:{nlist:D.ex.nlist,h1:D.ex.h1,h2:D.ex.h2},
      identical:C.ex.h1===D.ex.h1&&C.ex.h2===D.ex.h2},
    crops:{A:A.crop,B:B.crop,cropAt:A.cropAt},
  };
  console.log('SAMESTATE '+JSON.stringify(out));
  process.exit(0);
})().catch(e=>{console.error('FATAL',e&&e.message||e);process.exit(1)});
