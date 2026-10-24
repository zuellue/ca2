// t-food-ink-shotdiff: pixel-diff two page screenshots (same world state) from the samestate harness.
// Serves /tmp over http, loads both PNGs in one blank page, diffs them, returns stats + crops around the
// first diff cluster. usage: node t-food-ink-shotdiff.js A.png B.png outprefix
const http=require('http'),fs=require('fs'),{launch}=require('./harness.js');
const A=process.argv[2],B=process.argv[3],OUT=process.argv[4]||'/tmp/foodink-diff';
(async()=>{
 const s=http.createServer((req,rsp)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'){rsp.writeHead(200,{'content-type':'text/html'});rsp.end('<html><body></body></html>');return}fs.readFile(p,(e,d)=>{if(e){rsp.writeHead(404);rsp.end();return}rsp.writeHead(200,{'content-type':p.endsWith('.png')?'image/png':'application/octet-stream'});rsp.end(d)})}).listen(8389);
 const h=await launch(9489,'http://127.0.0.1:8389/',[]);
 const r=await h.ev(`(async function(){
  function ld(u){return new Promise(function(res,rej){var im=new Image();im.onload=function(){res(im)};im.onerror=rej;im.src=u})}
  var ia=await ld('http://127.0.0.1:8389${A}'),ib=await ld('http://127.0.0.1:8389${B}');
  var w=ia.width,hh=ia.height;
  function dat(im){var c=document.createElement('canvas');c.width=w;c.height=hh;var x=c.getContext('2d');x.drawImage(im,0,0);return x.getImageData(0,0,w,hh).data}
  var da=dat(ia),db=dat(ib),n=w*hh,diff=[],i;
  for(i=0;i<n;i++){var o=i*4;if(da[o]!==db[o]||da[o+1]!==db[o+1]||da[o+2]!==db[o+2])diff.push(i)}
  var aBright=0,bDark=0,mx=0,my=0;
  for(i=0;i<diff.length;i++){var o=diff[i]*4;var va=Math.max(da[o],da[o+1],da[o+2]),vb=Math.max(db[o],db[o+1],db[o+2]);if(va>200)aBright++;if(vb<40)bDark++;if(va>mx)mx=va;if(vb>my)my=vb}
  function cropAt(px){var c=document.createElement('canvas');c.width=121;c.height=121;var x=c.getContext('2d');x.drawImage(px.im,Math.max(0,Math.min(px.im.width-121,px.x-60)),Math.max(0,Math.min(px.im.height-121,px.y-60)),121,121,0,0,121,121);return c.toDataURL('image/png')}
  var first=diff.length?{x:diff[0]%w,y:Math.floor(diff[0]/w)}:null;
  var mi=Math.floor(diff.length/2),mid=diff.length?{x:diff[mi]%w,y:Math.floor(diff[mi]/w)}:null;
  return JSON.stringify({w:w,h:hh,n:diff.length,aBrightOver200:aBright,bDarkUnder40:bDark,maxA:mx,maxB:my,first:first,mid:mid,
   cropA_first:first?cropAt({im:ia,x:first.x,y:first.y}):null,cropB_first:first?cropAt({im:ib,x:first.x,y:first.y}):null,
   cropA_mid:mid?cropAt({im:ia,x:mid.x,y:mid.y}):null,cropB_mid:mid?cropAt({im:ib,x:mid.x,y:mid.y}):null})
 })()`,60000);
 if(typeof r==='string'&&r.indexOf('EXC:')===0){console.error(r);process.exit(1)}
 const o=JSON.parse(r);
 for(const k of ['cropA_first','cropB_first','cropA_mid','cropB_mid'])if(o[k]){fs.writeFileSync(OUT+'-'+k+'.png',Buffer.from(o[k].split(',')[1],'base64'));o[k]=OUT+'-'+k+'.png'}
 console.log('SHOTDIFF '+JSON.stringify(o));
 h.close();s.close();process.exit(0)})().catch(e=>{console.error('FATAL',e&&e.message||e);process.exit(1)});
