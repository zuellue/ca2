const L=require('/tmp/cdplib2.js');
(async()=>{const blocked=!!process.env.AP;
const b=await L.launch(9450+(blocked?1:0),'about:blank',[]);
await b.send('Page.enable',{});
await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__S=[];setInterval(function(){var c=document.getElementById('c');if(!c||!c.width)return;var t=window.__T||(window.__T=document.createElement('canvas'));t.width=96;t.height=60;var x=t.getContext('2d');x.drawImage(c,0,0,96,60);var d=x.getImageData(0,0,96,60).data,bg=[d[0],d[1],d[2]],n=0;for(var i=0;i<d.length;i+=4){if(Math.abs(d[i]-bg[0])+Math.abs(d[i+1]-bg[1])+Math.abs(d[i+2]-bg[2])>40)n++}var r=-1;if(window.CA2Audio&&CA2Audio.analyser){var a=new Float32Array(2048),s=0;CA2Audio.analyser.getFloatTimeDomainData(a);for(var k=0;k<a.length;k++)s+=a[k]*a[k];r=+Math.sqrt(s/a.length).toFixed(4)}window.__S.push([Math.round(performance.now()),n,window.CA2Audio&&CA2Audio.ctx?CA2Audio.ctx.state:'none',window.CA2Audio?+(CA2Audio.fade||0).toFixed(2):-1,r])},250);`});
await b.send('Page.navigate',{url:'http://localhost:8765/index.html'});
await b.sleep(3000);await b.mouse(5,5);await b.sleep(1500);
if(blocked){for(let i=0;i<8;i++){await b.mouse(100+i*60,200+i*20);await b.sleep(150)};await b.sleep(1500);await b.mouse(600,400,'mousePressed',{button:'left',clickCount:1});await b.mouse(600,400,'mouseReleased',{button:'left',clickCount:1});console.log('click done')}
await b.sleep(blocked?9000:6000);
const S=JSON.parse(await b.ev("JSON.stringify(window.__S)"));
console.log(blocked?'blocked':'allowed','fadeT0 ms since nav',await b.ev("Math.round(CA2Audio.fadeT0)"));
S.filter((r,i)=>i%2==0).forEach(r=>console.log(JSON.stringify(r)));console.log(b.errs);
b.close();process.exit(0)})();
