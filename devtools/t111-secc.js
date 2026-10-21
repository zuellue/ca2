const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const b=await H.launch(9581,'about:blank',[]);
await b.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
await b.send('Emulation.setTouchEmulationEnabled',{enabled:true});
await b.send('Page.navigate',{url:'https://ca.abdupala.com/'});
await b.sleep(6000);
console.log('secc '+await b.ev(`(()=>{const e=document.getElementById('secc');if(!e)return 'none';const r=e.getBoundingClientRect();return JSON.stringify({left:+r.left.toFixed(1),right:+r.right.toFixed(1),width:+r.width.toFixed(1),top:+r.top.toFixed(1),winW:window.innerWidth,visiblePx:+(Math.min(r.right,window.innerWidth)-Math.max(r.left,0)).toFixed(1),items:e.childNodes.length});})()`));
b.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
