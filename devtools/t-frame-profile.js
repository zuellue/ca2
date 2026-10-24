// t-frame-profile: boot the real page in headless Chrome with a given query (?perf=1 always), let it settle, sample the built-in stage profiler (__ca2.PF exponential stage ms + MB + frameMs + res + cells + fps) every 2 s, print medians. Methodology caveats: headless Chrome with --disable-gpu (software raster; a real GPU browser may shift the render share), this container's CPU, PF stages are smoothed exponential averages and sum to the measured frame. usage: node t-frame-profile.js '<extra query>' [secs]
const {serve,launch}=require('./harness.js');
const q0=process.argv[2]||'',secs=+(process.argv[3]||40);
(async()=>{const s=await serve(8377);const h=await launch(9377,'http://127.0.0.1:8377/index.html?perf=1'+(q0?'&'+q0:''),[]);
for(let i=0;i<45&&!(await h.ev('!!window.__ca2'));i++)await h.sleep(1000);
await h.sleep(3000);await h.ev("__ca2.setKey('autoQuality',0);1"); // hold resolution fixed so stages are comparable across variants
await h.sleep(15000); // settle past intro/spawn
const rows=[];
for(let i=0;i<Math.floor(secs/2);i++){await h.sleep(2000);const r=await h.ev(`(function(){var W=__ca2.WC,PF=__ca2.PF,o={fps:+fps.toFixed?0:0};try{o={frameMs:+frameMs.toFixed(3),fps:+fps.toFixed(1),res:+res.toFixed(3),cells:cells.length,food:food.length,mbMs:+MB.ms.toFixed(3),mbPath:MB.path,jsrnd:!!W.jsrnd,simd:!!W.simd,wcOk:!!W.ok,wcOff:!!W.off};for(var k in PF)o['pf_'+k]=+PF[k].toFixed(3);}catch(e){return 'E:'+e}return JSON.stringify(o)})()`);if(typeof r==='string'&&r[0]==='{')rows.push(JSON.parse(r));}
h.close();s.close();
if(!rows.length){console.log('NO SAMPLES');process.exit(1);}
const keys=Object.keys(rows[0]).filter(k=>typeof rows[0][k]==='number');
const med={};for(const k of keys){const v=rows.map(r=>r[k]).sort((a,b)=>a-b);med[k]=+v[v.length>>1].toFixed(3);}
med.query=q0||'(default)';med.samples=rows.length;med.lastCells=rows[rows.length-1].cells;med.mbPath=rows[rows.length-1].mbPath;med.jsrnd=rows[rows.length-1].jsrnd;med.wcOk=rows[rows.length-1].wcOk;
console.log(JSON.stringify(med));process.exit(0)})();
