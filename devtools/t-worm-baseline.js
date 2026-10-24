// t-worm-baseline: REAL stepWorms / stepWormsW / wormGrowSplit(+Js) / newWorm / postOffW extracted from ca2.js. Route A = JS body (WC.e absent). Route B = wasm wm_run candidate (jsrnd binary, WC.jsrnd).
// Identical full state per scenario; seeded Math.random, draws counted. Compares worms (head fields, chain membership by food index, order), food[] order and fields (x,y,r, worm back-reference), wormStat, wormT, draw count.
// usage: node t-worm-baseline.js <wasm> candidate
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var worms=[],food=[],wormT=0,wormStat={born:0,died:0,split:0,eaten:0};
${['postOffW','newWorm','wormGrowSplitJs','wormGrowSplit','stepWormsW','stepWorms'].map(fn).join('\n')}
return {step:stepWorms,st:function(v){if(v){worms=v.worms;food=v.food;wormT=v.wormT;wormStat=v.stat;}return {worms:worms,food:food,wormT:wormT,stat:wormStat}}};`;
const bin=process.argv[2];
async function inst(WC){const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;return Math.random()}}})).instance.exports;Object.assign(WC,{e:E,mem:E.memory,jsrnd:true,ok:true,off:false,simOff:false});return E}
function mk(WC,P,cont,clk){return new Function('WC','P','cont','location','performance',body)(WC,P,cont,{search:''},{now:()=>clk.t})}
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
let s=909;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
function world(cls,cont){const nW=cls===3?0:cls===4?118+Math.floor(r0()*3):Math.floor(r0()*r0()*30)+1;const worms=[],food=[];
 for(let i=0;i<nW;i++){const len=cls===5?8+Math.floor(r0()*2):2+Math.floor(r0()*16);const edge=cls===1&&r0()<0.5;const hx=edge?cont.x+r0()*20:cont.x+30+r0()*(cont.w-60),hy=edge?cont.y+r0()*20:cont.y+30+r0()*(cont.h-60);
  const wm={x:hx,y:hy,a:r0()*6.28,sp:0.25+r0()*0.55,fr:0.6+r0(),ph:r0()*6.28,d:[]};for(let k=0;k<len;k++){const f={x:hx-k*3+r0(),y:hy+r0()*2,r:r0(),worm:wm};if(cls===2&&r0()<0.15)f.gone=1;wm.d.push(f);food.push(f);if(r0()<0.3)food.push({x:r0()*100,y:r0()*100,r:r0()});}worms.push(wm);}
 return {worms,food,wormT:0,stat:{born:0,died:0,split:0,eaten:0}};}
function clone(W){const m=new Map(),ws=W.worms.map(x=>{const n={...x,d:[]};m.set(x,n);return n}),fm=new Map();const fd=W.food.map(f=>{const n={...f};if(f.worm)n.worm=m.get(f.worm);fm.set(f,n);return n});W.worms.forEach((x,i)=>{ws[i].d=x.d.map(f=>fm.get(f))});return {worms:ws,food:fd,wormT:W.wormT,stat:{...W.stat}}}
function sig(R,noA){const fi=new Map(R.food.map((f,i)=>[f,i])),wi=new Map(R.worms.map((x,i)=>[x,i]));return JSON.stringify({w:R.worms.map(x=>[x.x,x.y,noA?0:x.a,x.sp,x.fr,x.ph,x.d.map(f=>fi.has(f)?fi.get(f):-1)]),f:R.food.map(f=>[f.x,f.y,f.r,f.worm?wi.get(f.worm):null,f.gone||0]),t:R.wormT,st:R.stat})}
const names=['normal','edge','gone','empty','cap','len8_9'];
(async()=>{const WC0={};await inst(WC0);const byClass={};let tot=0,drawBad=0,first=null;
for(let t=0;t<3000;t++){const cls=t%6,cont={x:r0()*40,y:r0()*40,w:200+r0()*300,h:150+r0()*200};const P={foodLifeMs:300,foodSize:2+r0()*6,foodDensity:0.0002+r0()*0.002};
 const W0=world(cls,cont);const lifeOn=t%3!==0;const clk={t:1000+r0()*5000};if(!lifeOn)W0.wormT=clk.t-10;
 const A=mk({},P,cont,clk),WC={};await inst(WC);const B=mk(WC,P,cont,clk);A.st(clone(W0));B.st(clone(W0));
 const a=w(t*13+1,()=>A.step()),b=w(t*13+1,()=>B.step());tot++;const ok=sig(A.st())===sig(B.st());const dr=a.n!==b.n;const okNoA=sig(A.st(),1)===sig(B.st(),1);globalThis.NA=(globalThis.NA||0)+(okNoA?0:1);
 const c=byClass[names[cls]]=byClass[names[cls]]||{n:0,bad:0,drawBad:0};c.n++;if(!ok){c.bad++;if(!first)first={t,cls:names[cls]};if(globalThis.DBG&&!okNoA&&(globalThis.__d=(globalThis.__d||0)+1)<8){const x=JSON.parse(sig(A.st(),1)),y=JSON.parse(sig(B.st(),1));let where='?';for(const k of ['w','f','t','st']){if(JSON.stringify(x[k])!==JSON.stringify(y[k])){if(Array.isArray(x[k])){const L=Math.max(x[k].length,y[k].length);for(let i=0;i<L;i++)if(JSON.stringify(x[k][i])!==JSON.stringify(y[k][i])){where=k+'['+i+'] lenA='+x[k].length+' lenB='+y[k].length+' A='+JSON.stringify(x[k][i])+' B='+JSON.stringify(y[k][i]);break}}else where=k+' A='+JSON.stringify(x[k])+' B='+JSON.stringify(y[k]);break}}console.log('DIFF',t,names[cls],'life',lifeOn,where.slice(0,330))}}if(dr){c.drawBad++;drawBad++}}
console.log(JSON.stringify({binary:bin,scenarios:tot,byClass,drawCountMismatch:drawBad,mismatchExcludingHeadingA:globalThis.NA,first}));process.exit(0)})();
