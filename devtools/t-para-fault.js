// t-para-fault: js_rnd throws at draw k -> degraded (NOT parity): no redraw, step skipped (return true), parasites/cells/ev unchanged, WC.paRunDeg=1, WC.paRunOff, Math.random draws == k, rndN == k+1; next step runs the JS body.
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
(async()=>{const cont={x:30,y:30,w:450,h:350},now=120000,P={parasiteOn:1,parasiteFrac:0.5,parasiteSight:1500,parasiteNerv:0.8,parasiteDrain:0.02,parasiteEff:1,parasiteHard:39.5,parasiteHardMs:20000,parasiteCursorOn:1,parasiteCursorMs:2500,parasiteCursorR:250,parasiteCursorRetK:1.2,parasiteCursorCooldown:4000,parasiteCursorRearm:60,CELL_RADIUS:34};
 const W0=world(0,cont,now),clk={t:now};const mkS=()=>{const c=clone(W0);return {cells:c.cells,parasites:c.parasites,mouse:{x:200,y:200,over:true},ev:{pdeath:0,pbirth:0},parStat:{rehost:0}}};
 const WC0={};await inst(WC0,0);const A0=mk(WC0,P,cont,clk);A0.st(mkS());const full=w(5,()=>A0.step());
 let cases=0,bad=0,next=0;for(let k=1;k<full.n;k++){const WC={};await inst(WC,k);const B=mk(WC,P,cont,clk);B.st(mkS());const before=sig(B.st());const r=w(5,()=>B.step());cases++;
  const ok=WC.paRunDeg===1&&WC.paRunOff===true&&WC.rndN===k+1&&r.n===k&&sig(B.st())===before;if(!ok){bad++;if(bad<3)console.log('BAD',k,WC.paRunDeg,WC.rndN,r.n)}
  const fw=WC.fwPa||0;w(9,()=>B.step());if((WC.fwPa||0)!==fw)next++;}
 console.log(JSON.stringify({cases,bad,drawsPerFullStep:full.n,kernelRunAfterFault:next}));process.exit(bad+next?1:0)})();
