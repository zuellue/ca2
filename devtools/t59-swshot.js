const H=require('./harness.js');
(async()=>{const s=await H.serve(8771);const b=await H.launch(9513,'https://ca.abdupala.com/',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3000);
await b.ev("document.getElementById('panel').classList.add('open');'ok'");await b.sleep(1200);
// scroll background swatch into view and hover its centre
const p=JSON.parse(await b.ev(`(function(){var inp=[].slice.call(document.querySelectorAll('input[type=color]'))[0];inp.scrollIntoView({block:'center'});var r=inp.parentNode.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),wx:+r.x.toFixed(0)})})()`));
console.log('target',p);
await b.sleep(400);
await b.shot('/tmp/sw-before.png');
await b.mouse(p.x,p.y);await b.sleep(250);await b.shot('/tmp/sw-hov1.png');await b.sleep(600);await b.shot('/tmp/sw-hov2.png');
console.log(await b.ev(`(function(){var sw=[].slice.call(document.querySelectorAll('.cswatch')).map(function(d){var r=d.getBoundingClientRect();return d.style.display+'@'+r.x.toFixed(0)+','+r.y.toFixed(0)});return JSON.stringify(sw)})()`));
b.close();s.close();process.exit(0)})();
