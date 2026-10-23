// t136: stepLive generation, JS source (ca2.js l.~2198-2220) vs wasm live.rs, bit-exact on target and bits. node devtools/t136-steplive-parity.js [gens]
const fs=require('fs'),path=require('path');
const wasm=fs.readFileSync(path.join(__dirname,'..','wasm','target','wasm32-unknown-unknown','release','ca2core.wasm'));
const clamp=(v,a,b)=>v<a?a:v>b?b:v;function lcg(st){st.s=(Math.imul(st.s,1664525)+1013904223)>>>0;return st.s/4294967296;}
function jsGen(L,q,cap,occ){const n=L.bits.length;L.gen++;let nb=new Array(n),sum=0,same=true,i;
for(i=0;i<n;i++){nb[i]=(L.rule>>(L.bits[(i+n-1)%n]*4+L.bits[i]*2+L.bits[(i+1)%n]))&1;sum+=nb[i];if(nb[i]!==L.bits[i])same=false;}
if(L.plate){sum=0;for(i=0;i<n;i++){nb[i]^=occ[(i+L.shift)%n];sum+=nb[i];}same=false;}
if(sum===0||sum===n||same){for(i=0;i<3;i++)nb[Math.floor(lcg(L.st)*n)]^=1;if(sum===0)nb[Math.floor(lcg(L.st)*n)]=1;}
L.bits=nb;nb[Math.floor(lcg(L.st)*n)]^=1;L.bits=nb;
var r0=(L.gen*7+L.shift)%n,rd=0,wt=0.5;for(i=0;i<12;i++){rd+=nb[(r0+i)%n]*wt;wt*=0.5;}
rd=clamp(rd*4096/4095,0,1);if(!L.hist)L.hist=[];var lo=0;for(i=0;i<L.hist.length;i++)if(L.hist[i]<rd)lo++;
var rk=L.hist.length>8?(lo+lcg(L.st))/(L.hist.length+1):rd;L.hist.push(rd);if(L.hist.length>300)L.hist.shift();
if(L.walk===undefined)L.walk=rk;L.walk+=(rk-L.walk)*0.7;var a=clamp(0.5+(L.walk-0.5)*1.3,0,1);return q[0]+(q[1]-q[0])*a*cap;}
(async()=>{const E=(await WebAssembly.instantiate(wasm,{})).instance.exports;const G=+process.argv[2]||3000;
const B=()=>new Float64Array(E.memory.buffer,E.live_buf(),64);let buf=B();let bad=0,tot=0,maxd=0,seed=99;function r(){seed=(Math.imul(seed,1103515245)+12345)>>>0;return seed/4294967296;}
for(let k=0;k<8;k++){const plate=k%2===1,rule=[110,30,90,54][k%4],shift=k*5%28,st={s:1000+k*7919},q=[k*0.1,k*0.1+1+k],cap=k===3?0.35:1;
const bits=[];const st2={s:st.s};for(let i=0;i<28;i++)bits.push(lcg(st2)<0.5?1:0);st.s=st2.s;
const L={rule,plate,shift,st,bits:bits.slice(),gen:0};E.live_init(k,st.s);buf=B();for(let i=0;i<28;i++)buf[i]=bits[i];E.live_init(k,st.s);buf=B();
for(let g=0;g<G;g++){const occ=[];for(let i=0;i<28;i++)occ.push(r()<0.5?1:0);if(plate)for(let i=0;i<28;i++)buf[28+i]=occ[i];
const tj=jsGen(L,q,cap,occ),tw=E.live_gen(k,rule,plate?1:0,shift,q[0],q[1],cap);buf=B();tot++;const d=Math.abs(tj-tw);maxd=Math.max(maxd,d);
let bb=0;for(let i=0;i<28;i++)if(buf[i]!==L.bits[i])bb=1;if(!Object.is(tj,tw)||bb){bad++;if(bad<4)console.log('MISMATCH knob',k,'gen',g,tj,tw,'bits',bb);}}}
console.log('steplive parity: gens',tot,'mismatch',bad,'max |diff|',maxd);
// timing: JS generation vs wasm call (node, 1 knob, same inputs)
const L={rule:110,plate:false,shift:3,st:{s:5},bits:Array.from({length:28},(_,i)=>i%3?1:0),gen:0};const R=20000;E.live_init(20,5);buf=B();for(let i=0;i<28;i++)buf[i]=L.bits[i];E.live_init(20,5);
let t=process.hrtime.bigint();for(let i=0;i<R;i++)jsGen(L,[0,1],1,null);const js=Number(process.hrtime.bigint()-t)/1e6/R;
t=process.hrtime.bigint();for(let i=0;i<R;i++)E.live_gen(20,110,0,3,0,1,1);const wa=Number(process.hrtime.bigint()-t)/1e6/R;
console.log('per generation: JS',js.toFixed(5),'ms; wasm call (state resident, bits not read back)',wa.toFixed(5),'ms');})();
