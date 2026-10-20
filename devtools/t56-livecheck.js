const H=require('./harness.js');
(async()=>{const s=await H.serve(8768);const b=await H.launch(9510,'https://ca.abdupala.com/',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3000);
console.log('src',await b.ev("performance.getEntriesByName(location.origin+'/ca2.js').length?'loaded':'?';"));
console.log('hasToggle',await b.ev("typeof fuseCells"));
await b.ev("document.getElementById('panel').classList.add('open');'ok'");await b.sleep(800);
const r=await b.ev(`(function(){var rows=[].slice.call(document.querySelectorAll('.chk'));var sy=rows.filter(function(x){return /symbio/.test(x.textContent)}).map(function(x){return x.textContent});
var hdr=[].slice.call(document.querySelectorAll('.grp')).map(function(g){return g.textContent});
return JSON.stringify({total:rows.length,sym:sy,groups:hdr})})()`);
console.log('panel',r);
console.log('errs',b.errs.slice(0,3));b.close();s.close();process.exit(0)})();
