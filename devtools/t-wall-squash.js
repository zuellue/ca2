// Real-function node test of stepSquash() (and effR) from test/ca2.js, text-extracted. Run from repo root: node devtools/t-wall-squash.js [file]
// Invariants: sq stays in [0,1] and moves monotonically toward its target without overshoot; sqS is cleared; on recovery (sq falls) a cell within one radius of a wall
// gets envV pushed away from the NEAREST wall by exactly (sq0-sq)*radius*squashMax, never toward it; cells not near a wall or not recovering get no push; dead cells untouched.
const fs=require('fs'),file=process.argv[2]||'test/ca2.js',src=fs.readFileSync(file,'utf8');
function fn(n){const i=src.indexOf('function '+n+'(');if(i<0){console.log('FAIL '+n+' not found');process.exit(1)}let k=src.indexOf('{',i),d=0,e=k;for(;e<src.length;e++){if(src[e]=='{')d++;else if(src[e]=='}'&&!--d)break}return src.slice(i,e+1)}
const mk=new Function('P','cont','cells','S',`var frameDtf=S.dt;${fn('effR')};${fn('stepSquash')};return {stepSquash:stepSquash,effR:effR};`);
let seed=99;const R=()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296;let fails=0,checks=0;const F=(m)=>{fails++;if(fails<=10)console.log('FAIL',m)};
for(let t=0;t<3000;t++){
 const P={boundGap:R()*6,squashMax:.18,squashIn:.45,squashOut:.08,boundAware:R()<.8?1:0},cont={x:0,y:0,w:300,h:200},S={dt:.2+R()*3},cells=[];
 for(let i=0;i<4;i++)cells.push({alive:i!==3,x:R()*300,y:R()*200,radius:3+R()*8,sq:R(),sqS:R()<.5?R():0,crowd:R()*1.5,envVx:0,envVy:0});
 const before=cells.map(c=>({sq:c.sq,x:c.x,y:c.y,r:c.radius,sqS:c.sqS,crowd:c.crowd})),g2=Math.max(0,P.boundGap);
 mk(P,cont,cells,S).stepSquash();
 cells.forEach((c,i)=>{checks++;const b=before[i];
  if(!c.alive){if(c.sq!==b.sq||c.envVx||c.envVy)F('dead cell touched case '+t);return}
  const tg=Math.max(b.sqS,P.boundAware?Math.min(1,b.crowd):0);
  if(!(c.sq>=-1e-12&&c.sq<=1+1e-12))F('sq out of range '+c.sq+' case '+t);
  if(tg>b.sq&&!(c.sq>=b.sq-1e-12&&c.sq<=tg+1e-12))F('overshoot up case '+t);
  if(tg<b.sq&&!(c.sq<=b.sq+1e-12&&c.sq>=tg-1e-12))F('overshoot down case '+t);
  if(c.sqS!==0)F('sqS not cleared case '+t);
  const bx=b.x-cont.x-g2,by=b.y-cont.y-g2,dL=bx,dR=cont.w-g2-bx,dT=by,dB=cont.h-g2-by,dm=Math.min(dL,dR,dT,dB),push=(b.sq-c.sq)*b.r*P.squashMax;
  let ex=0,ey=0;if(c.sq<b.sq&&dm<b.r){if(dm===dL)ex=push;else if(dm===dR)ex=-push;else if(dm===dT)ey=push;else ey=-push}
  if(Math.abs(c.envVx-ex)>1e-9||Math.abs(c.envVy-ey)>1e-9)F('envV mismatch case '+t+' got '+c.envVx.toFixed(4)+','+c.envVy.toFixed(4)+' want '+ex.toFixed(4)+','+ey.toFixed(4));
  // direction: push must point away from the nearest wall (inward)
  if(c.envVx>1e-12&&!(dm===dL))F('push +x but nearest wall not left case '+t);if(c.envVx<-1e-12&&!(dm===dR))F('push -x but nearest wall not right case '+t);
 })}
console.log(fails?'FAILED '+fails:'PASS',checks,'cell checks over 3000 scenes',file);process.exit(fails?1:0);
