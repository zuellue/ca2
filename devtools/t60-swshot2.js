const H=require('./harness.js');
(async()=>{const s=await H.serve(8772);const b=await H.launch(9514,'https://ca.abdupala.com/',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3000);
await b.ev("document.getElementById('panel').classList.add('open');'ok'");await b.sleep(2500);
const pair=`(function(){var inp=[].slice.call(document.querySelectorAll('input[type=color]'))[0];var r=inp.parentNode.getBoundingClientRect();var d=document.querySelectorAll('.cswatch')[0];var dr=d.getBoundingClientRect();return JSON.stringify({disp:d.style.display,wx:+r.x.toFixed(1),wy:+r.y.toFixed(1),ox:+dr.x.toFixed(1),oy:+dr.y.toFixed(1)})})()`;
await b.ev(`(function(){var inp=[].slice.call(document.querySelectorAll('input[type=color]'))[0];inp.scrollIntoView({block:'center'});return 'ok'})()`);await b.sleep(800);
console.log('sync  ',await b.ev(pair));
const p=JSON.parse(await b.ev(pair));await b.shot('/tmp/sw2-before.png');
await b.mouse(Math.round(p.wx+14),Math.round(p.wy+14));
for(let i=0;i<5;i++){await b.sleep(200);console.log('hov'+i+'  ',await b.ev(pair));}
await b.shot('/tmp/sw2-hov.png');
b.close();s.close();process.exit(0)})();
