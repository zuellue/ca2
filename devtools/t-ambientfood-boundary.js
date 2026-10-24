// t-ambientfood-boundary: REAL ambientFoodSpawn / ambientFoodCull source extracted from ca2.js, jsrnd wasm vs the original inline JS policy (reference below) on identical states and seeded Math.random.
// foodSpot is stubbed with a counting draw pair (its own hook is tested elsewhere). Compares the resulting food array (identity/values) and draw counts across density 0..1, len around the cap, len 0, and forced low draws (cull rate 0.001 is hit by seeding).
// Fault: throw at draw k -> degraded (documented, NOT parity): WC.afDeg==1, postOff set, action skipped.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const bin=process.argv[2]||'wasm/target-jsrnd/wasm32-unknown-unknown/release/ca2core.wasm';
const body=`${fn('ambientFoodSpawn')}\n${fn('ambientFoodCull')}\nvar rnd=function(a,b){if(b===undefined){b=a;a=0}return a+Math.random()*(b-a)};return {sp:ambientFoodSpawn,cu:ambientFoodCull};`;
async function inst(thr,WC){let n=0;const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;n++;if(thr&&n>thr)throw new Error('fault');return Math.random()}}})).instance.exports;WC.e=E;WC.mem=E.memory;return E}
function mk(WC,P,cont,food,jsrnd){return new Function('WC','P','cont','food','postOffW','foodSpot',body)(Object.assign(WC,{jsrnd}),P,cont,food,()=>!!WC.postOff,(x,y,w,h)=>{const a=x+Math.random()*w,b=y+Math.random()*h;return Math.random()<0.2?null:{x:a,y:b}})}
function ref(P,cont,food){ // original inline code
 if(Math.random()<P.foodDensity&&food.length<cont.w*cont.h*P.foodDensity*2){const fp3=(x=>{const a=cont.x+Math.random()*cont.w,b=cont.y+Math.random()*cont.h;return Math.random()<0.2?null:{x:a,y:b}})();if(fp3)food.push({x:fp3.x,y:fp3.y,r:Math.random()})}
 if(Math.random()<0.001&&food.length)food.splice(Math.floor((r=>0+Math.random()*(r-0))(food.length)),1)}
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
(async()=>{const WC0={};await inst(0,WC0);
let s=17;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};let tot=0,bad=0,drawBad=0,spawned=0,culled=0;
for(let t=0;t<20000;t++){WC0.postOff=false;const P={foodDensity:[0,0.001,0.05,0.5,1][t%5]},cont={x:r0()*50,y:r0()*50,w:8+r0()*20,h:8+r0()*20};const cap=cont.w*cont.h*P.foodDensity*2,len=t%7==0?0:Math.floor(r0()*(cap*1.5+3));
 const base=[];for(let i=0;i<len;i++)base.push({x:i,y:i,r:i/1000});const f1=base.map(x=>({...x})),f2=base.map(x=>({...x}));
 const seed=t%3==0?(t%1000)*2+1:t*5+3; // some seeds give small first draws: culls are exercised
 const a=w(seed,()=>{ref(P,cont,f1)}),A=mk(WC0,P,cont,f2,true),b=w(seed,()=>{A.sp();A.cu()});
 tot++;if(f1.length>len)spawned++;if(f1.length<len||(f1.length===len&&f1.length&&JSON.stringify(f1)!==JSON.stringify(base)))culled++;
 let ok=a.n===b.n;if(!ok)drawBad++;if(JSON.stringify(f1)!==JSON.stringify(f2))ok=false;if(!ok){bad++;if(bad<4)console.log('MISMATCH',t,len,a.n,b.n)}}
// forced cull path: Math.random sequence (0.0005, u) so the 0.001 test passes and the index draw is exercised (also len 0 and len 1)
let fcTot=0,fcBad=0;for(let t=0;t<5000;t++){WC0.postOff=false;const len=t%11===0?0:1+Math.floor(r0()*40),u=r0();const base=[];for(let i=0;i<len;i++)base.push({x:i,y:i,r:i/1000});const f1=base.map(x=>({...x})),f2=base.map(x=>({...x}));
 const seq=(arr)=>{let i=0;const o=Math.random;Math.random=function(){return i<arr.length?arr[i++]:0.5};return()=>{Math.random=o}};
 let rs=seq([0.0005,u]);try{ref({foodDensity:0},{x:0,y:0,w:1,h:1},f1)}finally{rs()}
 // reference above also burns the spawn draws first; align: spawn stage draws 1 value (density 0 -> fails), so sequence for cull begins second: rebuild both with the same prefix
 const f3=base.map(x=>({...x}));rs=seq([0.9,0.0005,u]);try{ref({foodDensity:0},{x:0,y:0,w:1,h:1},f3)}finally{rs()}
 const A=mk(WC0,{foodDensity:0},{x:0,y:0,w:1,h:1},f2,true);rs=seq([0.9,0.0005,u]);try{A.sp();A.cu()}finally{rs()}
 fcTot++;if(JSON.stringify(f3)!==JSON.stringify(f2))fcBad++}
let fT=0,fB=0;
// fault: cull draw sequence forced to (0.0005, then throw): first draw passes the 0.001 test, the index draw throws -> consumed draws -> skipped, afDeg=1, postOff, food unchanged
{const WC={};let n=0;const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;n++;if(n===2)throw new Error('fault');return 0.0005}}})).instance.exports;WC.e=E;WC.mem=E.memory;
 const food=[{x:1,y:1,r:0},{x:2,y:2,r:0}];const A=mk(WC,{foodDensity:1},{x:0,y:0,w:50,h:50},food,true);A.cu();fT++;if(!(WC.afDeg===1&&WC.postOff===true&&food.length===2&&WC.rndN===2))fB++;
 // after the fault the hook is off: next call uses the JS policy (real Math.random, no wasm draws)
 const before=WC.rndN;A.cu();fT++;if(WC.rndN!==before)fB++;}
// fault on the first draw (spawn decide): throw immediately -> counted as consumed (the import counter ran) -> action skipped, degraded
{const WC={};const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;throw new Error('fault')}}})).instance.exports;WC.e=E;WC.mem=E.memory;
 const food=[];const A=mk(WC,{foodDensity:1},{x:0,y:0,w:50,h:50},food,true);A.sp();fT++;if(!(WC.afDeg===1&&WC.postOff===true&&food.length===0))fB++}
console.log(JSON.stringify({scenarios:tot,spawnsSeen:spawned,culledOrChanged:culled,mismatch:bad,drawCountMismatch:drawBad,forcedCull:fcTot,forcedCullBad:fcBad,faultCases:fT,faultBad:fB,binary:bin}));process.exit(bad||fB||fcBad?1:0)})();
