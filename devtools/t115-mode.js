const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const srv=await H.serve(8615);const b=await H.launch(9615,'http://127.0.0.1:8615/',[]);
for(let i=0;i<60;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(2000);
// 1) mode API at desktop width
console.log('wide '+await b.ev(`JSON.stringify({mode:window.__ca2Mode(),sel:window.__ca2ModeSel(),body:document.body.dataset.camode,w:window.innerWidth})`));
// 2) event listener + narrow
await b.ev(`window.__modeLog=[];window.addEventListener('ca2mode',e=>window.__modeLog.push(JSON.stringify(e.detail)));'ok'`);
await b.send('Emulation.setDeviceMetricsOverride',{width:500,height:800,deviceScaleFactor:1,mobile:false});
await b.sleep(600);
console.log('narrow '+await b.ev(`JSON.stringify({mode:window.__ca2Mode(),body:document.body.dataset.camode,log:window.__modeLog})`));
// 3) back to wide
await b.send('Emulation.setDeviceMetricsOverride',{width:1300,height:800,deviceScaleFactor:1,mobile:false});
await b.sleep(600);
console.log('wideagain '+await b.ev(`JSON.stringify({mode:window.__ca2Mode(),log:window.__modeLog.length})`));
// 4) simulate admin login state
console.log('adminsim '+await b.ev(`(()=>{window.__adminOn=true;const adm=document.getElementById('adm');adm.classList.add('ok','on');
  const gs=adm.querySelectorAll('.ac span');'ABDU'.split('').forEach((c,i)=>gs[i].textContent=c);
  adm.style.opacity='1';adm.style.pointerEvents='auto';return gs.length})()`));
// 5) B click toggles explicit mobile, again clears
console.log('bclick '+await b.ev(`(()=>{const cs=document.querySelectorAll('#adm .ac');cs[1].dispatchEvent(new MouseEvent('click',{bubbles:true}));
  const a=window.__ca2ModeSel()+'/'+window.__ca2Mode();
  cs[1].dispatchEvent(new MouseEvent('click',{bubbles:true}));
  return a+' then '+window.__ca2ModeSel()+'/'+window.__ca2Mode()})()`));
// 6) D click at narrow width forces desktop
await b.send('Emulation.setDeviceMetricsOverride',{width:500,height:800,deviceScaleFactor:1,mobile:false});
await b.sleep(400);
console.log('dnarrow '+await b.ev(`(()=>{const cs=document.querySelectorAll('#adm .ac');cs[2].dispatchEvent(new MouseEvent('click',{bubbles:true}));
  return 'sel='+window.__ca2ModeSel()+' mode='+window.__ca2Mode()})()`));
await b.send('Emulation.clearDeviceMetricsOverride');
// 7) pointerenter random colours on B, clear on leave
console.log('colours '+await b.ev(`(()=>{const g=document.querySelectorAll('#adm .ac span')[1];const c=document.querySelectorAll('#adm .ac')[1];
  c.dispatchEvent(new PointerEvent('pointerenter',{bubbles:true}));
  const on=g.style.color+' | '+g.style.webkitTextStrokeColor;
  c.dispatchEvent(new PointerEvent('pointerleave',{bubbles:true}));
  return on+' then ['+g.style.color+']['+g.style.webkitTextStrokeColor+']'})()`));
// 8) real mouse hover -> smooth stroke bold (computed width before/after transition)
const rc=await b.ev(`(()=>{const r=document.querySelectorAll('#adm .ac')[0].getBoundingClientRect();return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2})})()`);
const p=JSON.parse(rc);
console.log('prehover '+await b.ev(`getComputedStyle(document.querySelectorAll('#adm .ac span')[0]).webkitTextStrokeWidth`));
await b.mouse(p.x,p.y);await b.sleep(80);
const mid=await b.ev(`getComputedStyle(document.querySelectorAll('#adm .ac span')[0]).webkitTextStrokeWidth`);
await b.sleep(500);
const post=await b.ev(`getComputedStyle(document.querySelectorAll('#adm .ac span')[0]).webkitTextStrokeWidth`);
console.log('strokeWidth pre=0px mid='+mid+' post='+post);
await b.shot('/tmp/mode-abdu-hover.png');
// 9) screenshot with B hovered in colour: move mouse to B circle
const rb=JSON.parse(await b.ev(`(()=>{const r=document.querySelectorAll('#adm .ac')[1].getBoundingClientRect();return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2})})()`));
await b.mouse(rb.x,rb.y);await b.sleep(600);await b.shot('/tmp/mode-abdu-B.png');
console.log('errs',JSON.stringify(b.errs));b.close();srv.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
