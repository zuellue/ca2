const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9460,'http://localhost:8765/index.html',[]);await b.sleep(3000);
await b.ev("(function(){var a=window.__ca2;a.P.minRefreshInterval=9999;a.P.maxRefreshInterval=9999;})()");
const g=async(x,y,l)=>{await b.mouse(x,y);await b.sleep(900);const i=JSON.parse(await b.ev("JSON.stringify(window.__ca2.cur)"));const d=await b.ev("(function(){var d=document.querySelector('#cur i').getBoundingClientRect(),c=document.getElementById('cur').style;return JSON.stringify({dw:d.width,disp:c.display,bw:c.borderWidth})})()");console.log(l,JSON.stringify({on:i.on,ring:i.ring,dot:i.dot,dp:i.dp}),d)};
await g(640,300,'mid');
const t=JSON.parse(await b.ev("JSON.stringify(window.__ca2.circles[0])"));await g(t.x,t.y,'title-circle');
const c=JSON.parse(await b.ev("JSON.stringify((function(){var a=window.__ca2,k=a.cont,cs=a.getCells().filter(function(c){return c.alive&&c.x>k.x&&c.x<k.x+k.w&&c.y>k.y&&c.y<k.y+k.h});return cs[0]?{x:cs[0].x,y:cs[0].y}:null})())"));
if(c)await g(c.x,c.y,'cell');
console.log(b.errs);b.close();process.exit(0)})();
