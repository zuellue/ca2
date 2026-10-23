// orientation host test: every device x P/L, repeated toggles, outer resize. Frame must keep its exact viewport size and stay clear of the device list / meta.
const C=require('./cdplib.js');
(async()=>{const port=+process.argv[2]||9631,url=process.argv[3]||'http://127.0.0.1:8137/device.html';
const b=await C.launch(port,url,[]);await b.sleep(3000);
await b.ev('document.getElementById("fr").contentWindow.__adminOn=true;1');await b.sleep(800);
const chk0=()=>b.ev(`(()=>{const f=fr.getBoundingClientRect(),d=document.getElementById('devs').getBoundingClientRect(),m=document.getElementById('meta').getBoundingClientRect(),o=document.getElementById('orient').getBoundingClientRect(),w=fr.contentWindow;
return JSON.stringify({vp:[innerWidth,innerHeight],frame:[Math.round(f.left),Math.round(f.top),Math.round(f.right),Math.round(f.bottom)],inner:[w.innerWidth,w.innerHeight],prof:(w.__ca2ProfFollow&&'ok'),clearDevs:f.left>=d.right,clearMeta:f.right<=m.left||f.bottom<=m.top||f.top>=m.bottom,inView:f.left>=0&&f.top>=0&&f.right<=innerWidth&&f.bottom<=innerHeight,orientBtn:[o.left,o.top]})})()`);
const chk=async()=>{for(let t=0;t<4;t++){const r=await chk0();if(!/^EXC/.test(r))return r;await b.sleep(1200);}return r0=await chk0();};
let bad=0;const rep=async(tag,exp)=>{const r=JSON.parse(await chk());const ok=r.inner[0]===exp[0]&&r.inner[1]===exp[1]&&r.clearDevs&&r.clearMeta&&(r.inView||false);if(!ok)bad++;console.log(ok?'OK ':'BAD',tag,JSON.stringify(r));};
const devs=await b.ev('JSON.stringify([...document.querySelectorAll("#devs a")].map(a=>a.textContent))');const n=JSON.parse(devs).length;
for(const vp of [[1300,657],[1000,700]]){
 await b.send('Emulation.setDeviceMetricsOverride',{width:vp[0],height:vp[1],deviceScaleFactor:1,mobile:false});await b.sleep(500);
 const only=process.argv[4]!==undefined?[+process.argv[4]]:[...Array(n).keys()];
 for(const i of only){await b.ev(`document.querySelectorAll('#devs a')[${i}].click();1`);await b.sleep(900);
  const sz=JSON.parse(await b.ev(`JSON.stringify(fr.width+'x'+fr.height)`)).split('x').map(Number);
  for(let k=0;k<1;k++){await b.ev('ocL.click();1');await b.sleep(900);await rep(vp+' dev'+i+' L'+k,[sz[1],sz[0]]);await b.ev('ocP.click();1');await b.sleep(900);await rep(vp+' dev'+i+' P'+k,sz);}
 }}
console.log('errs',b.errs.length,'bad',bad);b.close();process.exit(bad?1:0)})();
