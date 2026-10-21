// t114: sparse-vs-crowd structure on the LIVE page (owner config, visuals on).
// Measures per sample: x/y hist chi2 (60 bins over plate), row/col near-pairs normalized,
// string-fraction, string direction anisotropy <cos 2*dir> (0=isotropic, 1=all horizontal),
// edge piles (top/bottom 24px share), trans-active flag. Screenshots for visual proof.
const H=require('./harness.js');
const MEAS=`(()=>{
  const A=window.__ca2,cs=A.getCells(),x0=A.areaLeft,x1=A.areaRight,y0=A.areaTop,y1=A.areaBottom;
  const xh=new Array(60).fill(0),yh=new Array(60).fill(0);
  const al=[];for(const c of cs)if(c.alive)al.push(c);
  for(const c of al){xh[Math.min(59,Math.max(0,Math.floor((c.x-x0)/(x1-x0)*60)))]++;yh[Math.min(59,Math.max(0,Math.floor((c.y-y0)/(y1-y0)*60)))]++;}
  const chi=h=>{const m=h.reduce((a,b)=>a+b,0)/h.length;let s=0;for(const v of h)s+=(v-m)*(v-m)/(m||1);return +s.toFixed(0);};
  let pairs=0,rows=0,cols=0;
  for(let i=0;i<al.length;i++)for(let j=i+1;j<al.length;j++){const a=al[i],b=al[j],dx=Math.abs(a.x-b.x),dy=Math.abs(a.y-b.y);
    if(dx>20&&dx<140){pairs++;if(dy<3)rows++;}
    if(dy>20&&dy<140&&dx<3)cols++;}
  let ns=0,c2=0,s2=0,edge=0;
  for(const c of al){if(c.shp&&c.shp.t===1){ns++;c2+=Math.cos(2*c.shp.dir);s2+=Math.sin(2*c.shp.dir);}
    if(c.y<y0+24||c.y>y1-24)edge++;}
  const an=ns?+Math.sqrt(c2*c2+s2*s2).toFixed(3)/ns:0;
  const ss=A.shapeStat();
  return JSON.stringify({n:al.length,tr:A.trans?1:0,xchi:chi(xh),ychi:chi(yh),
    rowPer1k:pairs?+(1000*rows/pairs).toFixed(1):0,colPer1k:pairs?+(1000*cols/pairs).toFixed(1):0,
    strings:ns,stringFrac:+(ns/Math.max(1,al.length)).toFixed(2),dirAniso:+an.toFixed(3),
    edgeFrac:+(edge/Math.max(1,al.length)).toFixed(3),aspMed:ss.aspectMed});
})()`;
async function sample(b,k,gap){const out=[];for(let i=0;i<k;i++){out.push(await b.ev(MEAS));await b.sleep(gap);}return out;}
async function waitBoot(b){for(let i=0;i<60;i++){if(await b.ev('!!(window.__ca2&&window.__ca2.cells>=0)')===true)return true;await b.sleep(500);}return false;}
async function run(url,tag){
  const b=await H.launch(9650+Math.floor(Math.random()*200),url,[]);
  if(!await waitBoot(b)){console.log(tag,'BOOT FAIL');b.close();return;}
  await b.ev(`(()=>{const A=window.__ca2;A.setKey('grain',0);A.setKey('audioOn',0);return 1})()`);
  await b.sleep(6000); // intro+spawn settle (owner UNIVERSE_SIZE ~56)
  console.log(tag,'SPARSE');(await sample(b,6,1500)).forEach(r=>console.log(tag,' s',r));
  await b.shot('/tmp/t114-'+tag+'-sparse.png');
  await b.ev(`window.__ca2.setKey('UNIVERSE_SIZE',250)`); // instant crowd (applyKey fills immediately)
  await b.sleep(8000);
  console.log(tag,'CROWD');(await sample(b,8,1500)).forEach(r=>console.log(tag,' c',r));
  await b.shot('/tmp/t114-'+tag+'-crowd.png');
  // interactions off, one at a time
  await b.ev(`window.__ca2.setKey('clusterCohesion',0)`);await b.sleep(6000);
  console.log(tag,'COH=0',await b.ev(MEAS));
  await b.ev(`window.__ca2.setKey('clusterCohesion',0.19)`);
  await b.ev(`window.__ca2.setKey('symbiosisOn',0)`);await b.sleep(6000);
  console.log(tag,'SYM=0',await b.ev(MEAS));
  await b.ev(`window.__ca2.setKey('symbiosisOn',1)`);
  console.log(tag,'PF',await b.ev('JSON.stringify(window.__ca2.PF)'));
  console.log(tag,'SIMW',await b.ev('JSON.stringify(window.__ca2.SIMW)'));
  b.close();
}
(async()=>{const s=await H.serve(8837);
  await run('http://localhost:8837/index.html?perf=1','wasm');
  await run('http://localhost:8837/index.html?perf=1&nowasm=1','js');
  s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
