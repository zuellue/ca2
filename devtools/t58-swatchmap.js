const H=require('./harness.js');
(async()=>{const s=await H.serve(8770);const b=await H.launch(9512,'https://ca.abdupala.com/',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3000);
await b.ev("document.getElementById('panel').classList.add('open');'ok'");await b.sleep(900);
console.log(await b.ev(`(function(){var pr=document.getElementById('panel').getBoundingClientRect();
var out={iw:innerWidth,panel:{x:+pr.x.toFixed(0),w:+pr.width.toFixed(0),top:+pr.top.toFixed(0)},sw:[]};
document.querySelectorAll('input[type=color]').forEach(function(inp,i){var w=inp.parentNode,r=w.getBoundingClientRect();
var d=[].slice.call(document.querySelectorAll('.cswatch'))[i];var dr=d?d.getBoundingClientRect():null;
out.sw.push({i:i,wrap:{x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1)},ovl:dr?{x:+dr.x.toFixed(1),y:+dr.y.toFixed(1),disp:d.style.display}:null,row:inp.closest('.row')?inp.closest('.row').querySelector('span').textContent:'?'});});
return JSON.stringify(out)})()`));
b.close();s.close();process.exit(0)})();
