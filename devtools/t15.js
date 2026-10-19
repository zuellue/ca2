const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9416,'http://localhost:8765/index.html#open',[]);await b.sleep(2500);
await b.ev("(function(){var a=window.__ca2;a.P.minRefreshInterval=9999;a.P.maxRefreshInterval=9999;a.P.grain=0;})()");
await b.mouse(5,5);
const rect=JSON.parse(await b.ev(`(function(){var rows=document.querySelectorAll('#controls .row');for(var i=0;i<rows.length;i++){var s=rows[i].querySelector('.lab span');if(s&&s.textContent==='tone (cutoff Hz)'){rows[i].scrollIntoView({block:'center'});var r=rows[i].querySelector('input').getBoundingClientRect();return JSON.stringify([r.left,r.top+r.height/2,r.width])}}})()`));
const x=rect[0]+rect[2]*0.17,y=rect[1];
for(const cc of [1,2]){await b.mouse(x,y,'mousePressed',{button:'left',clickCount:cc});await b.mouse(x,y,'mouseReleased',{button:'left',clickCount:cc});}
const xs=[],ys=[];
for(let i=0;i<150;i++){await b.sleep(200);if(i%25==5)await b.ev("(function(){var a=window.__ca2;a.getCells().length=Math.floor(a.getCells().length*0.3)})()");
 const r=JSON.parse(await b.ev("JSON.stringify([window.__ca2.getCells().length,window.__ca2.P.audioTone])"));xs.push(r[0]);ys.push(r[1]);}
const m=a=>a.reduce((p,c)=>p+c,0)/a.length,mx=m(xs),my=m(ys);
const r=xs.reduce((p,c,i)=>p+(c-mx)*(ys[i]-my),0)/Math.sqrt(xs.reduce((p,c)=>p+(c-mx)**2,0)*ys.reduce((p,c)=>p+(c-my)**2,0));
console.log('n',xs.length,'cells',Math.min(...xs),Math.max(...xs),'tone',Math.round(Math.min(...ys)),Math.round(Math.max(...ys)),'r',r.toFixed(2),'errs',b.errs);b.close();process.exit(0)})();
