const H=require('./harness.js');
(async()=>{const b=await H.launch(9521,'https://ca.abdupala.com/index.html?nosim=1#open',[]);
let ok=false;for(let i=0;i<90;i++){await b.sleep(1000);if(await b.ev('typeof window.__ca2')==='object'){ok=true;break;}}
console.log('ready',ok);await b.sleep(4000);
const r=await b.ev(`(function(){var el=document.getElementById('swl');return JSON.stringify({laneTf:getComputedStyle(el).transform,circles:document.querySelectorAll('#swl .swc').length,native:document.querySelectorAll('input[type=color]').length,ov:document.querySelectorAll('.cswatch').length})})()`);
console.log('struct',r);
b.close();process.exit(0)})();
