const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9413,'http://localhost:8765/index.html#open',[]);await b.sleep(2500);
await b.ev("(function(){var a=window.__ca2;a.P.minRefreshInterval=300;a.P.maxRefreshInterval=300;a.P.grain=0;a.P.UNIVERSE_SIZE=80;})()");
await b.mouse(5,5); await b.mouse(500,400,'mousePressed',{button:'left',clickCount:1}); await b.mouse(5,5,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(1000);
const R={};
await b.ev("window.__ca2.P.audioMode=3;window.__ca2.P.audioCrackle=1");
R.kinds={};
for(let k=0;k<6;k++){ await b.ev(`window.__ca2.P.audioMicro=${k}`); await b.sleep(500);
 R.kinds[['click','tick','drop','bubble','wood','bloom'][k]]=JSON.parse(await b.ev(`(function(){return new Promise(function(res){var A=CA2Audio,d=new Float32Array(A.analyser.fftSize),pk=0,sum=0,n=0,t0=Date.now();var id=setInterval(function(){A.analyser.getFloatTimeDomainData(d);for(var i=0;i<d.length;i++){var v=Math.abs(d[i]);if(v>pk)pk=v;sum+=d[i]*d[i];n++}if(Date.now()-t0>2500){clearInterval(id);res(JSON.stringify({peak:+pk.toFixed(3),rms:+Math.sqrt(sum/n).toFixed(4)}))}},60)})})()`)); }
// plate-driven knob: audioTone live
await b.ev("window.__ca2.P.audioMode=0");
async function seq(shiftCells){
 await b.ev(`(function(){var a=window.__ca2,k=a.cont;a.getCells().forEach(function(c,i){c.maxSpeed=0;c.vx=c.vy=0;${shiftCells?"c.x=k.x+((i*37)%k.w);":"c.x=k.x+k.w*0.15+((i*13)%(k.w*0.3));"}c.y=k.y+k.h/2;});})()`);
 const rect=JSON.parse(await b.ev(`(function(){var rows=document.querySelectorAll('#controls .row');for(var i=0;i<rows.length;i++){var s=rows[i].querySelector('.lab span');if(s&&s.textContent==='tone (cutoff Hz)'){rows[i].scrollIntoView({block:'center'});var r=rows[i].querySelector('input').getBoundingClientRect();return JSON.stringify([r.left,r.top+r.height/2,r.width])}}})()`));
 const x=rect[0]+rect[2]*(1600-200)/(8000-200),y=rect[1];
 await b.mouse(x,y);for(const cc of [1,2]){await b.mouse(x,y,'mousePressed',{button:'left',clickCount:cc});await b.mouse(x,y,'mouseReleased',{button:'left',clickCount:cc});}
 const v=[];for(let i=0;i<30;i++){v.push(Math.round(await b.ev('window.__ca2.P.audioTone')));await b.sleep(200);}
 const info=await b.ev("JSON.stringify(window.__ca2.live.audioTone?{col:window.__ca2.live.audioTone.col,plate:window.__ca2.live.audioTone.plate,rule:window.__ca2.live.audioTone.rule}:null)");
 await b.mouse(x,y);for(const cc of [1,2]){await b.mouse(x,y,'mousePressed',{button:'left',clickCount:cc});await b.mouse(x,y,'mouseReleased',{button:'left',clickCount:cc});}
 return {v,info:JSON.parse(info),back:await b.ev('window.__ca2.P.audioTone')};
}
R.spread=await seq(1); R.cluster=await seq(0);
// volume cap
await b.ev("(function(){})()");
console.log(JSON.stringify(R));console.log('errs',b.errs);b.close();process.exit(0)})();
