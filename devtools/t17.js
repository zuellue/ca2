const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9419,'http://localhost:8765/index.html#open',[]);await b.sleep(2500);
await b.ev("document.addEventListener('copy',function(e){window.cap=(document.activeElement&&document.activeElement.value)||''},true)");
const r=JSON.parse(await b.ev("(function(){var bs=document.querySelectorAll('button');for(var i=0;i<bs.length;i++)if(bs[i].textContent==='copy json'){bs[i].scrollIntoView({block:'center'});var q=bs[i].getBoundingClientRect();return JSON.stringify([q.left+q.width/2,q.top+q.height/2])}})()"));
await b.mouse(r[0],r[1]);await b.mouse(r[0],r[1],'mousePressed',{button:'left',clickCount:1});await b.mouse(r[0],r[1],'mouseReleased',{button:'left',clickCount:1});
await b.sleep(300);
console.log(await b.ev("JSON.stringify({lbl:[].map.call(document.querySelectorAll('button'),function(x){return x.textContent}).filter(function(x){return /cop/.test(x)}),cap:(window.cap||'').length,head:(window.cap||'').slice(0,25),keys:(function(){try{return Object.keys(JSON.parse(window.cap)).length}catch(e){return -1}})()})"),b.errs);
b.close();process.exit(0)})();
