// t113: live crowded-state structure test. Boots the page, forces a crowd, measures
// x/y 4px-bin histograms + row/col near-pair counts + shape attribution (string vs round),
// then toggles cellMorph/clusterCohesion/symbiosisOn/eatMergeOn to separate real
// interactions from numeric artifact. Second boot with ?nowasm=1 checks JS-fallback parity.
const H=require('./harness.js');
const MEASURE=`(()=>{
  const A=window.__ca2,cs=A.getCells(),x0=A.areaLeft,x1=A.areaRight,y0=A.areaTop,y1=A.areaBottom;
  const xh=new Array(60).fill(0),yh=new Array(60).fill(0);
  let rows=0,cols=0,rowsS=0,rowsR=0,colsS=0,colsR=0;
  const alive=[];for(const c of cs){if(c.alive)alive.push(c);}
  for(const c of alive){const kx=Math.min(59,Math.max(0,Math.floor((c.x-x0)/(x1-x0)*60)));const ky=Math.min(59,Math.max(0,Math.floor((c.y-y0)/(y1-y0)*60)));xh[kx]++;yh[ky]++;}
  const chi=h=>{const m=h.reduce((a,b)=>a+b,0)/h.length;let s=0;for(const v of h)s+=(v-m)*(v-m)/(m||1);return +s.toFixed(0);};
  const band=h=>{let mx=0,mi=-1;const m=h.reduce((a,b)=>a+b,0)/h.length;h.forEach((v,i)=>{if(v-m>mx){mx=v-m;mi=i;}});return {amp:+(mx/(m||1)).toFixed(2),at:mi};};
  for(let i=0;i<alive.length;i++)for(let j=i+1;j<alive.length;j++){const a=alive[i],b=alive[j];
    const dy=Math.abs(a.y-b.y),dx=Math.abs(a.x-b.x);
    const as=(a.shp&&a.shp.t===1)||(b.shp&&b.shp.t===1);
    if(dy<3){const g=Math.abs(dx);if(g>20&&g<140){rows++;if(as)rowsS++;else rowsR++;}}
    if(dx<3){const g=Math.abs(dy);if(g>20&&g<140){cols++;if(as)colsS++;else colsR++;}}}
  const ss=A.shapeStat();
  return JSON.stringify({n:alive.length,xchi:chi(xh),ychi:chi(yh),xband:band(xh),yband:band(yh),rows,cols,rowsS,rowsR,colsS,colsR,strings:ss.strings,lobed:ss.lobed,rounds:ss.rounds,aspMed:ss.aspectMed,aspMax:ss.aspectMax});
})()`;
async function waitBoot(b){for(let i=0;i<60;i++){const ok=await b.ev('!!(window.__ca2&&window.__ca2.cells>=0)');if(ok===true)return true;await b.sleep(500);}return false;}
async function run(url,tag,shots){
  const b=await H.launch(9600+Math.floor(Math.random()*200),url,[]);
  if(!await waitBoot(b)){console.log(tag,'BOOT FAIL');b.close();return;}
  await b.ev(`(()=>{const A=window.__ca2;['grain','audioOn','showAxis','metaballStrength'].forEach(k=>A.setKey(k,0));return 1})()`);
  // growth boost (none of these knobs create x-bias; they only speed up crowding)
  await b.ev(`(()=>{const A=window.__ca2;A.setKey('UNIVERSE_SIZE',400);A.setKey('divideAt',1.2);A.setKey('foodDensity',0.3);A.setKey('foodGrowAmt',40);A.setKey('energyConsumptionRate',0.01);A.setKey('selectOn',0);return 1})()`);
  let n=0;for(let i=0;i<45;i++){n=await b.ev('window.__ca2.cells');if(n>=350)break;await b.sleep(2000);}
  console.log(tag,'crowd cells:',n);
  const base=await b.ev(MEASURE);console.log(tag,'BASE',base);
  if(shots)await b.shot('/tmp/t113-'+tag+'-base.png');
  const seq=[['cellMorph',0],['cellMorph',1],['clusterCohesion',0],['clusterCohesion',0.19],['symbiosisOn',0],['symbiosisOn',1],['eatMergeOn',0],['eatMergeOn',1]];
  for(const [k,v] of seq){await b.ev(`window.__ca2.setKey('${k}',${v})`);await b.sleep(5000);
    console.log(tag,k+'='+v,await b.ev(MEASURE));
    if(shots&&k==='cellMorph'&&v===0)await b.shot('/tmp/t113-'+tag+'-morphoff.png');}
  console.log(tag,'PF',await b.ev('JSON.stringify(window.__ca2.PF)'));
  console.log(tag,'WC',await b.ev('JSON.stringify({off:window.__ca2.WC.off,fwSim:window.__ca2.WC.fwSim||0,fwErr:(window.__ca2.WC.fwSimErr||"").slice(0,80)})'));
  b.close();
}
(async()=>{const s=await H.serve(8836);
  await run('http://localhost:8836/index.html?perf=1','wasm',true);
  await run('http://localhost:8836/index.html?perf=1&nowasm=1','js',true);
  s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
