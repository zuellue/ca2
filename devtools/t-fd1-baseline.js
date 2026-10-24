// t-fd1-baseline: REAL stepFood / stepFoodW / wallPull / lifeBirthsJs extracted from ca2.js. Route A = JS body (WC.e absent), route B = current Rust fd1 kernel (kernel PRNG seeded from 2 JS draws).
// Identical full state per scenario (P, cont, food, foodT, clock). Math.random is a seeded stream; draws counted. Compares x,y (Object.is), count, foodStat, draw count; r is compared only as range [0,1) because the streams differ by design.
// usage: node t-fd1-baseline.js <wasm> [candidate]   (candidate = jsrnd binary with the feature path: r from js_rnd, no seed draws, expects identical r and draw count)
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`var food=[],foodT=0,foodStat={born:0,died:0,steps:0,inflow:0};
${['postOffW','wallPull','lifeBirthsJs','lifeBirths','stepFoodW','stepFood'].map(fn).join('\n')}
return {step:stepFood,st:function(v){if(v){food=v.food;foodT=v.foodT;foodStat=v.stat;}return {food:food,foodT:foodT,stat:foodStat}}};`;
const bin=process.argv[2];const cand=process.argv[3]==='candidate';
async function inst(WC){const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;return Math.random()}}})).instance.exports;Object.assign(WC,{e:E,mem:E.memory,jsrnd:cand,ok:true,off:false,simOff:false});return E}
function mk(WC,P,cont,clk){return new Function('WC','P','cont','location','performance',body)(WC,P,cont,{search:''},{now:()=>clk.t})}
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
let s=77;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
(async()=>{const WCb={};await inst(WCb);
const byOut={in:{n:0,bad:0},out:{n:0,bad:0}};let tot=0,posBad=0,cntBad=0,statBad=0,drawBad=0,rBad=0,born=0,due=0,flowCases=0,firstPos=null;const kinds={};
for(let t=0;t<6000;t++){
 const gs=1+Math.floor(r0()*10),P={foodLifeMs:300,foodLifeCell:gs,foodSize:2+r0()*6,boundGap:r0()<0.5?0:r0()*10};
 const cont={x:r0()*40,y:r0()*40,w:60+r0()*300,h:60+r0()*200};
 const n=Math.floor(r0()*r0()*400),food=[];const mode=t%4; // 0 inside only,1 some outside,2 clustered dense,3 empty
 for(let i=0;i<(mode==3?0:n);i++){let x,y;if(mode==2){const cx=cont.x+50,cy=cont.y+40;x=cx+Math.floor(r0()*12)*gs+r0()*gs*0.9;y=cy+Math.floor(r0()*12)*gs+r0()*gs*0.9;}else{const out=mode==1&&r0()<0.15;x=cont.x+(out?-30+r0()*(cont.w+60):r0()*cont.w);y=cont.y+(out?-30+r0()*(cont.h+60):r0()*cont.h);}food.push({x,y,r:r0()});}
 const dueC=t%3!==0,clk={t:1000},foodT=dueC?0:999.9;
 const mkS=()=>({food:food.map(f=>({...f})),foodT,stat:{born:0,died:0,steps:0,inflow:0}});
 const WCa={},A=mk(WCa,P,cont,clk),Bw={...{}},WCbb={};const E=await inst(WCbb);const B=mk(WCbb,P,cont,clk);
 A.st(mkS());B.st(mkS());
 const a=w(t*7+3,()=>A.step()),b=w(t*7+3,()=>B.step());tot++;if(dueC)due++;
 const Ra=A.st(),Rb=B.st();let kind=[];
 if(Ra.food.length!==Rb.food.length){cntBad++;kind.push('count')}
 else{for(let i=0;i<Ra.food.length;i++){if(!Object.is(Ra.food[i].x,Rb.food[i].x)||!Object.is(Ra.food[i].y,Rb.food[i].y)){posBad++;kind.push('pos');if(!firstPos)firstPos={t,i,a:[Ra.food[i].x,Ra.food[i].y],b:[Rb.food[i].x,Rb.food[i].y],P,out:food.some(f=>f.x<cont.x||f.x>cont.x+cont.w)};break;}}
  if(cand){for(let i=0;i<Ra.food.length;i++)if(!Object.is(Ra.food[i].r,Rb.food[i].r)){rBad++;kind.push('r');break;}}
  else for(const f of Rb.food)if(!(f.r>=0&&f.r<1)){rBad++;kind.push('rrange');break;}}
 if(JSON.stringify(Ra.stat)!==JSON.stringify(Rb.stat)){statBad++;kind.push('stat')}
 if(a.n!==b.n){drawBad++;kind.push('draws')}
 {const ho=food.some(f=>f.x<cont.x||f.x>cont.x+cont.w||f.y<cont.y||f.y>cont.y+cont.h)?'out':'in';byOut[ho].n++;if(kind.some(k=>k!=='draws'&&k!=='r'))byOut[ho].bad++;if(cand&&kind.some(k=>k==='draws'||k==='r'))byOut[ho].streamBad=(byOut[ho].streamBad||0)+1;}
 born+=Ra.stat.born;for(const k of kind)kinds[k]=(kinds[k]||0)+1;}
console.log(JSON.stringify({mode:cand?'candidate':'baseline',binary:bin,scenarios:tot,dueScenarios:due,born,countMismatch:cntBad,posMismatch:posBad,statMismatch:statBad,drawCountMismatch:drawBad,rMismatchOrRange:rBad,kinds,byOutsideFood:byOut,firstPos}));process.exit(0)})();
