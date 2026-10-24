// t-para-baseline: REAL stepParasitesCore + stepParasitesW extracted from ca2.js. Route A = JS body (no WC.e). Route B = wasm pa_run candidate (jsrnd binary). Fixed clock (performance.now constant: the JS body calls it repeatedly, the kernel takes one value; clock-drift NOT covered). Same seeded Math.random, identical state; exact comparison of parasites[] (all fields incl. host identity by cell index, belief marker a, latch), cells energy, ev.pdeath/pbirth, parStat.rehost, draw count.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const body=`function clamp(v,a,b){return v<a?a:v>b?b:v}function lerp(a,b,t){return a+(b-a)*t}var cells=[],parasites=[],mouse={x:0,y:0,over:false},ev={pdeath:0,pbirth:0},parStat={rehost:0};
${['stepParasitesW','stepParasitesCore'].map(fn).join('\n')}
return {step:stepParasitesCore,st:function(v){if(v){cells=v.cells;parasites=v.parasites;mouse=v.mouse;ev=v.ev;parStat=v.parStat;}return {cells:cells,parasites:parasites,ev:ev,parStat:parStat}}};`;
const bin=process.argv[2];
async function inst(WC,thr){let n=0;const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;n++;if(thr&&n>thr)throw new Error('fault');return Math.random()}}})).instance.exports;Object.assign(WC,{e:E,mem:E.memory,jsrnd:true,ok:true,off:false,simOff:false})}
function mk(WC,P,cont,clk){return new Function('WC','P','cont','location','performance',body)(WC,P,cont,{search:''},{now:()=>clk.t})}
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
let s=1357;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
const names=['normal','hosted','hostless','belief','cooling','latch','birth','starve','nomouse','empty','nonfiniteCell','deadHost','offplate'];
function world(cls,cont,now){const nc=cls===9?0:3+Math.floor(r0()*30);const cells=[];
 for(let i=0;i<nc;i++)cells.push({x:cont.x+r0()*cont.w,y:cont.y+r0()*cont.h,radius:15+r0()*30,cl:r0()<0.3?1:0,alive:cls===11?r0()<0.6:true,energy:2+r0()*30,pc:0});
 if(cls===10&&cells.length&&r0()<0.8)cells[Math.floor(r0()*cells.length)][r0()<0.5?'x':'y']=[NaN,Infinity][Math.floor(r0()*2)];
 const np=Math.floor(r0()*(nc*1.2+3));const parasites=[];
 for(let i=0;i<np;i++){const p={x:cont.x+r0()*cont.w,y:cont.y+r0()*cont.h,e:r0()*8,host:null,a:r0()*6.28};
  if(cls!==2&&(cls===1||r0()<0.5)&&cells.length){p.host=cells[Math.floor(r0()*cells.length)];}
  if(r0()<0.7){p.ph=r0()*6.28;p.lost=now-r0()*30000;}
  if(cls===3&&!p.host){p.a=-1e9-(now-r0()*2000);}
  if(cls===4&&!p.host){p.a=-2e9-(now+(r0()<0.5?-1:1)*r0()*3000);p.clx=r0()*500;p.cly=r0()*400;}
  if(cls===5&&!p.host){p.clx=r0()<0.5?-1e18:r0()*500;p.cly=r0()*400;}
  if(cls===6)p.e=12+r0()*10;if(cls===7)p.e=-P0.parasiteHard-0.002+r0()*0.004;
  if(cls===12){p.x=cont.x-50-r0()*100;p.y=cont.y+r0()*cont.h;if(!p.host&&r0()<0.6)p.a=-1e9-(now-r0()*2000);}
  parasites.push(p);}
 return {cells,parasites}}
const P0={parasiteOn:1,parasiteHard:39.5};
const clone=W=>{const cm=new Map();const cells=W.cells.map(c=>{const n={...c};cm.set(c,n);return n});const parasites=W.parasites.map(p=>({...p,host:p.host?cm.get(p.host):null}));return {cells,parasites}};
const RP=(k,v)=>typeof v==='number'&&!isFinite(v)?'N:'+v:(Object.is(v,-0)?'-0':v);
const sig=(R)=>{const ci=new Map(R.cells.map((c,i)=>[c,i]));return JSON.stringify({c:R.cells.map(c=>[c.energy]),p:R.parasites.map(p=>[p.x,p.y,p.e,p.host?ci.get(p.host):-1,p.a,p.ph||0,p.lost||0,(p.clx==null||p.clx<=-1e17)?'nolatch':p.clx,(p.clx==null||p.clx<=-1e17)?'nolatch':p.cly]),ev:[R.ev.pdeath,R.ev.pbirth],rh:R.parStat.rehost},RP)};
(async()=>{const byClass={};let drawBad=0,tot=0;const ex=[];
for(let t=0;t<6500;t++){const cls=t%13;const cont={x:20+r0()*30,y:20+r0()*30,w:300+r0()*300,h:250+r0()*200};const now=100000+r0()*50000;
 const P={parasiteOn:1,parasiteFrac:0.2+r0()*0.4,parasiteSight:200+r0()*3800,parasiteNerv:r0()*1.5,parasiteDrain:0.02,parasiteEff:1,parasiteHard:39.5,parasiteHardMs:20000,parasiteCursorOn:1,parasiteCursorMs:2500,parasiteCursorR:250,parasiteCursorRetK:1.2,parasiteCursorCooldown:4000,parasiteCursorRearm:60,CELL_RADIUS:34};
 const W0=world(cls,cont,now);const mouse=cls===8?{x:0,y:0,over:false}:{x:cont.x+r0()*cont.w,y:cont.y+r0()*cont.h,over:r0()<0.85};
 if(cls===12){mouse.x=cont.x-20;mouse.y=cont.y+r0()*cont.h;mouse.over=true}
 const clk={t:now};const A=mk({},P,cont,clk),WC={};await inst(WC,0);const B=mk(WC,P,cont,clk);
 const mkS=()=>{const c=clone(W0);return {cells:c.cells,parasites:c.parasites,mouse:{...mouse},ev:{pdeath:0,pbirth:0},parStat:{rehost:0}}};A.st(mkS());B.st(mkS());
 const a=w(t*3+1,()=>A.step()),fw0=WC.fwPa||0,b=w(t*3+1,()=>B.step()),fell=(WC.fwPa||0)===fw0;
 const ok=sig(A.st())===sig(B.st()),dr=a.n!==b.n;tot++;
 const c=byClass[names[cls]]=byClass[names[cls]]||{n:0,bad:0,drawBad:0,jsFallback:0};c.n++;if(fell)c.jsFallback++;
 if(!ok){c.bad++;if(ex.length<3||process.env.DBG){const x=JSON.parse(sig(A.st())),y=JSON.parse(sig(B.st()));let wh='?';for(const k of ['c','p','ev','rh']){if(JSON.stringify(x[k])!==JSON.stringify(y[k])){if(Array.isArray(x[k])&&Array.isArray(x[k][0])){for(let i=0;i<Math.max(x[k].length,y[k].length);i++)if(JSON.stringify(x[k][i])!==JSON.stringify(y[k][i])){wh=k+'['+i+'] lenA='+x[k].length+' lenB='+y[k].length+' A='+JSON.stringify(x[k][i])+' B='+JSON.stringify(y[k][i]);break}}else wh=k+' A='+JSON.stringify(x[k])+' B='+JSON.stringify(y[k]);break}}if(ex.length<3)ex.push({t,cls:names[cls],fell,wh:wh.slice(0,300)});}}
 if(dr){c.drawBad++;drawBad++}}
console.log(JSON.stringify({binary:bin,scenarios:tot,byClass,mismatchTotal:Object.values(byClass).reduce((x,v)=>x+v.bad,0),drawCountMismatch:drawBad,examples:ex}));process.exit(0)})();
