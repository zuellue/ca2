// t-sw-baseline: REAL stepSwarm / stepSwarmW / swPackJs / swPackRust / clamp extracted from ca2.js. Route A = JS body (WC.e absent). Route B = wasm sw_run (default: kernel PRNG seeded by 2 JS draws; candidate: whatever the binary does under WC.jsrnd).
// Identical full state per scenario; seeded Math.random, draws counted. Compares per output dot x,y,vx,vy (Object.is), r (equal only for candidate, range-checked for default), count, identity (kept objects), swStat, swT, draw count.
// usage: node t-sw-baseline.js <wasm> [candidate]
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`var food=[],swT=0,swStat={born:0,died:0};function clamp(v,a,b){return v<a?a:v>b?b:v}
${['swPackJs','swPackRust','stepSwarmW','stepSwarm'].map(fn).join('\n')}
return {step:stepSwarm,st:function(v){if(v){food=v.food;swT=v.swT;swStat=v.stat;}return {food:food,swT:swT,stat:swStat}}};`;
const bin=process.argv[2];const HW=process.argv[4]==='hardwall';const cand=process.argv[3]==='candidate';
async function inst(WC){const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;return Math.random()}}})).instance.exports;Object.assign(WC,{e:E,mem:E.memory,jsrnd:cand,ok:true,off:false,simOff:false});return E}
const PULL="f.x += (clamp(f.x, x0 + 1, x1 - 1) - f.x) * 0.25; f.y += (clamp(f.y, y0 + 1, y1 - 1) - f.y) * 0.25;";
if(!body.includes(PULL))throw new Error('pull statement not found');
const bodyHW=body.replace(PULL,"f.x = clamp(f.x, x0, x1); f.y = clamp(f.y, y0, y1);"); // DIAGNOSTIC ONLY: JS body with the kernel's absolute wall; the real source is untouched
function mk(WC,P,cont,clk,useHW){return new Function('WC','P','cont','location','performance',useHW?bodyHW:body)(WC,P,cont,{search:''},{now:()=>clk.t})}
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
let s=303;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
const names=['inside','outside','dense','empty','nonfinite','freshvel','lifeoff','lowpop','interior'];
(async()=>{const byClass={},kinds={};let tot=0,born=0;let first={};
for(let t=0;t<4000;t++){
 const cls=t%9;const P={foodLifeMs:300,foodDensity:0.00003+r0()*0.0003};let cont={x:r0()*40,y:r0()*40,w:80+r0()*300,h:80+r0()*200};if(cls===8)cont={x:0,y:0,w:2000,h:2000};
 let n=cls===3?0:Math.floor(r0()*r0()*350)+(cls===2?200:0);if(cls===7)n=Math.floor(r0()*10);
 const food=[];for(let i=0;i<n;i++){let x,y;const out=cls===1&&r0()<0.2;if(cls===8){x=cont.x+900+r0()*200;y=cont.y+900+r0()*200;}else if(cls===2){x=cont.x+60+r0()*70;y=cont.y+50+r0()*60;}else{x=cont.x+(out?-40+r0()*(cont.w+80):r0()*cont.w);y=cont.y+(out?-40+r0()*(cont.h+80):r0()*cont.h);}
  const f={x,y,r:r0()};if(cls!==5||r0()<0.5){f.vx=(r0()-0.5)*3;f.vy=(r0()-0.5)*3;}food.push(f);}
 if(cls===4){const bad=[NaN,Infinity,-Infinity];for(let q=0;q<1+Math.floor(r0()*2);q++){const f={x:cont.x+r0()*cont.w,y:cont.y+r0()*cont.h,r:r0(),vx:0,vy:0};f[r0()<0.5?'x':'y']=bad[Math.floor(r0()*3)];food.splice(Math.floor(r0()*(food.length+1)),0,f);}}
 const lifeOn=cls!==6&&!(cls===8&&t%2), clk={t:1000},swT=lifeOn?0:999.9;
 const mkS=()=>{const m=new Map();const fo=food.map(f=>{const g={...f};m.set(f,g);return g});return {food:fo,swT,stat:{born:0,died:0}}};
 const A=mk({},P,cont,clk,HW),WC={};await inst(WC);const B=mk(WC,P,cont,clk);A.st(mkS());B.st(mkS());
 const A2=mk({},P,cont,clk,true);A2.st(mkS());const a2=w(t*11+7,()=>A2.step());
 const a=w(t*11+7,()=>A.step()),b=w(t*11+7,()=>B.step());tot++;
 const Ra=A.st(),Rb=B.st();const kind=[];
 if(Ra.food.length!==Rb.food.length)kind.push('count');
 else{let pb=false,rb=false;for(let i=0;i<Ra.food.length;i++){const p=Ra.food[i],q=Rb.food[i];for(const k of ['x','y','vx','vy'])if(!Object.is(p[k],q[k]))pb=true;if(cand){if(!Object.is(p.r,q.r))rb=true}else if(!(q.r>=0&&q.r<1))rb=true;}if(pb){kind.push('state');if(!first.state)first.state={t,cls:names[cls]}}if(rb)kind.push('r');}
 if(JSON.stringify(Ra.stat)!==JSON.stringify(Rb.stat))kind.push('stat');
 if(Ra.swT!==Rb.swT)kind.push('swT');
 if(a.n!==b.n)kind.push('draws');
 if(globalThis.DBG&&t<16&&kind.some(k=>k!=='draws'))console.log('DBG',t,names[cls],kind,Ra.food.length,Rb.food.length,JSON.stringify(Ra.stat),JSON.stringify(Rb.stat),Ra.swT,Rb.swT,'draws',a.n,b.n,'lifeOn',lifeOn);
 const eng=JSON.stringify(A2.st().food.map(f=>[f.x,f.y,f.vx,f.vy]))!==JSON.stringify(Ra.food.map(f=>[f.x,f.y,f.vx,f.vy]))||A2.st().food.length!==Ra.food.length;const ec=(globalThis.__ec=globalThis.__ec||{wallEngaged:0,wallEngagedBad:0});if(eng){ec.wallEngaged++;if(kind.some(k=>k!=='draws'))ec.wallEngagedBad++;}
 const touch=Rb.food.some(f=>f.x===cont.x||f.x===cont.x+cont.w||f.y===cont.y||f.y===cont.y+cont.h);const bad=kind.some(k=>k!=='draws'),tc=(globalThis.__tc=globalThis.__tc||{touchBad:0,touchOk:0,noTouchBad:0,noTouchOk:0});tc[(touch?'touch':'noTouch')+(bad?'Bad':'Ok')]++;if(!touch&&bad&&globalThis.DBG2&&(globalThis.__n2=(globalThis.__n2||0)+1)<6){let di=-1;for(let i=0;i<Math.min(Ra.food.length,Rb.food.length);i++){for(const k of ['x','y','vx','vy','r'])if(!Object.is(Ra.food[i][k],Rb.food[i][k])){di=i+':'+k+' '+Ra.food[i][k]+' vs '+Rb.food[i][k];break}if(di!==-1)break}const ii=parseInt(di);console.log('NT',t,names[cls],kind,Ra.food.length,Rb.food.length,di,'n',n,JSON.stringify(Ra.food[ii]),JSON.stringify(Rb.food[ii]),'plate',cont.x,cont.y,cont.x+cont.w,cont.y+cont.h)};
 born+=Ra.stat.born;const c=byClass[names[cls]]=byClass[names[cls]]||{n:0,bad:0,draws:0};c.n++;if(kind.some(k=>k!=='draws'))c.bad++;if(kind.includes('draws'))c.draws++;for(const k of kind)kinds[k]=(kinds[k]||0)+1;}
console.log(JSON.stringify({mode:(cand?'candidate':'baseline')+(HW?'+JSbodyHardWallDiagnostic':''),binary:bin,scenarios:tot,born,kinds,byClass,edgeTouchCrossTab:globalThis.__tc,wallRuleEngaged:globalThis.__ec,first}));process.exit(0)})();
