// test-only: serves the repo like harness.serve but appends read-only debug getters to window.__ca2 at serve time.
// Nothing here ships in ca2.js. Usage: const srv = await require('./dbg-inject.js').serve(port)
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),M={'.html':'text/html','.js':'text/javascript','.ttf':'font/ttf','.png':'image/png','.svg':'image/svg+xml'};
const ANCHOR='get axisInfo() { return axisInfo; },';
const EXTRA=' get foodList() { return food; }, get cellList() { return cells; }, get parasiteList() { return parasites; }, get circleList() { return circlesNow; }, get contBox() { return cont; }, get sepState() { return SEP; }, get fleeT() { return fleeT; }, get frameDtf() { return frameDtf; },';
const GA='    food.length = w;\n  }\n  function separatorPass()';
const GH='    food.length = w;\n    if (window.__gh) window.__gh(food, foodOnInk);\n  }\n  function separatorPass()';
exports.serve=port=>new Promise(res=>{const s=http.createServer((req,rsp)=>{
  let p=path.join(ROOT,decodeURIComponent(req.url.split('?')[0].split('#')[0])); if(p.endsWith('/'))p+='index.html';
  fs.readFile(p,(e,d)=>{if(e){rsp.writeHead(404);rsp.end('nf');return;}
    if(path.basename(p)==='ca2.js'){let t=d.toString();if(t.split(ANCHOR).length!==2)throw new Error('debug anchor not unique');t=t.replace(ANCHOR,ANCHOR+EXTRA);if(process.env.GUARDHOOK&&t.split(GA).length===2)t=t.replace(GA,GH);d=Buffer.from(t);}
    rsp.writeHead(200,{'content-type':M[path.extname(p)]||'application/octet-stream','cache-control':'no-store'});rsp.end(d);});
}).listen(port,()=>res(s));});
