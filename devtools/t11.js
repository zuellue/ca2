const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9411,'http://localhost:8765/index.html',[]);await b.sleep(2500);
await b.ev("(function(){var a=window.__ca2;a.P.minRefreshInterval=300;a.P.maxRefreshInterval=300;a.P.grain=0;a.P.UNIVERSE_SIZE=60;a.P.cellMorphMs=1500;})()");
await b.mouse(5,5);await b.sleep(3000);
const mis=`(function(){var a=window.__ca2,e=a.env,cs=a.getCells(),s=0,sp=0,ap=0,bn=0,n=cs.length||1;cs.forEach(function(c){var g=c.g;var m=(Math.abs(g.spd-e.spd)/1.1+Math.abs(g.app-e.app)+Math.abs(g.bnd-e.bnd)/1.5)/3;var cd=(Math.abs(g.col[0]-e.col[0])+Math.abs(g.col[1]-e.col[1])+Math.abs(g.col[2]-e.col[2]))/2;s+=Math.min(1,(m*3+cd*1.5)/4.5);sp+=g.spd;ap+=g.app;bn+=g.bnd});return JSON.stringify({n:cs.length,meanMisfit:+(s/n).toFixed(3),spd:+(sp/n).toFixed(2),app:+(ap/n).toFixed(2),bnd:+(bn/n).toFixed(2),env:{spd:+e.spd.toFixed(2),app:+e.app.toFixed(2),bnd:+e.bnd.toFixed(2)}})})()`;
const out=[];
for(let r=0;r<2;r++){
 await b.send('Input.dispatchKeyEvent',{type:'keyDown',key:'s'}); await b.mouse(5,5,'mousePressed',{button:'left',clickCount:1}); await b.mouse(5,5,'mouseReleased',{button:'left',clickCount:1}); await b.send('Input.dispatchKeyEvent',{type:'keyUp',key:'s'});
 await b.sleep(300); out.push('t0.3 '+await b.ev(mis));
 await b.sleep(12000); out.push('t12 '+await b.ev(mis));
}
console.log(out.join('\n'));console.log('errs',b.errs);b.close();process.exit(0)})();
