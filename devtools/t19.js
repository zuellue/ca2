const L=require('/tmp/cdplib.js');const o=require('/tmp/owner.json');
(async()=>{const b=await L.launch(9422,'http://localhost:8765/index.html#open',[]);await b.sleep(2500);
const P=JSON.parse(await b.ev("JSON.stringify(window.__ca2.P)"));
const diff=Object.keys(o).filter(k=>P[k]!==o[k]);
const c0=JSON.parse(await b.ev('JSON.stringify([window.__ca2.getCells().length])'));console.log('cells0',c0,'keys',Object.keys(o).length,'mismatch',JSON.stringify(diff.map(k=>[k,P[k],o[k]])));
// change several, reset all
await b.ev("(function(){var p=window.__ca2.P;p.margin=77;p.audioVol=0.3;p.grainSize=1.2;p.cellMorphMs=100;})()");
await b.ev("(function(){var bs=document.querySelectorAll('button');for(var i=0;i<bs.length;i++)if(bs[i].textContent==='reset all'){bs[i].click();return}})()");
await b.sleep(3500);
const P2=JSON.parse(await b.ev("JSON.stringify(window.__ca2.P)"));
console.log('after reset mismatch',JSON.stringify(Object.keys(o).filter(k=>P2[k]!==o[k]).map(k=>[k,P2[k],o[k]])));
// audio level
await b.mouse(5,5);await b.mouse(400,300,'mousePressed',{button:'left',clickCount:1});await b.mouse(5,5,'mouseReleased',{button:'left',clickCount:1});await b.sleep(2500);
console.log('audio',await b.ev("(function(){var d=new Float32Array(CA2Audio.analyser.fftSize),pk=0,s=0;for(var k=0;k<5;k++){CA2Audio.analyser.getFloatTimeDomainData(d);for(var i=0;i<d.length;i++){pk=Math.max(pk,Math.abs(d[i]));s+=d[i]*d[i]}}return JSON.stringify({peak:+pk.toFixed(3),rms:+Math.sqrt(s/d.length/5).toFixed(4)})})()"),b.errs);
b.close();process.exit(0)})();
