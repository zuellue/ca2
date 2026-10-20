const H=require('./harness.js');
(async()=>{const s=await H.serve(8779);const b=await b0();async function b0(){return H.launch(9521,'http://localhost:8779/index.html#open',[]);}
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3000);
for(let i=0;i<20;i++){await b.sleep(300);var tf=await b.ev("getComputedStyle(document.getElementById('swl')).transform");if(tf==='matrix(1, 0, 0, 1, 0, 0)')break;}
const p=JSON.parse(await b.ev("(function(){var r=document.querySelectorAll('#swl .swc')[1].getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()"));
await b.ev(`(function(){var sp=document.querySelectorAll('#swl .swr span')[1];window.__tl=[];window.__rec=setInterval(function(){window.__tl.push([Math.round(performance.now()),sp.style.opacity,getComputedStyle(sp).opacity])},100);return 'ok'})()`);
await b.mouse(p.x,p.y);await b.sleep(150);
const t0=Date.now();
await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(5000);
console.log(await b.ev(`(function(){clearInterval(window.__rec);return JSON.stringify(window.__tl)})()`));
b.close();s.close();process.exit(0)})();
