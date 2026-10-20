const H=require('./harness.js');
(async()=>{const s=await H.serve(8779);const b=await H.launch(9521,'http://localhost:8779/index.html?nosim=1#open',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(2000);
await b.ev("(function(){document.querySelectorAll('#swl .swr span')[1].style.opacity='1';return 1})()");
for(const t of [100,300,600]){await b.sleep(t);console.log(t,await b.ev("(function(){var sp=document.querySelectorAll('#swl .swr span')[1];return JSON.stringify({i:sp.style.opacity,c:getComputedStyle(sp).opacity,tr:getComputedStyle(sp).transition})})()"));}
b.close();s.close();process.exit(0)})();
