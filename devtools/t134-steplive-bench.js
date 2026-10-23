const n=28,LCG={s:5};function lcg(st){st.s=(Math.imul(st.s,1664525)+1013904223)>>>0;return st.s/4294967296;}
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function gen(L){const nb=new Array(n);let sum=0,same=true,i;for(i=0;i<n;i++){nb[i]=(L.rule>>(L.bits[(i+n-1)%n]*4+L.bits[i]*2+L.bits[(i+1)%n]))&1;sum+=nb[i];if(nb[i]!==L.bits[i])same=false;}
if(sum===0||sum===n||same){for(i=0;i<3;i++)nb[Math.floor(lcg(L.st)*n)]^=1;}L.bits=nb;nb[Math.floor(lcg(L.st)*n)]^=1;let r0=(L.gen++*7)%n,rd=0,wt=.5;for(i=0;i<12;i++){rd+=nb[(r0+i)%n]*wt;wt*=.5;}rd=clamp(rd*4096/4095,0,1);
let lo=0;for(i=0;i<L.hist.length;i++)if(L.hist[i]<rd)lo++;const rk=L.hist.length>8?(lo+lcg(L.st))/(L.hist.length+1):rd;L.hist.push(rd);if(L.hist.length>300)L.hist.shift();return rk;}
const L={rule:110,bits:Array.from({length:n},()=>Math.random()<.5?1:0),st:{s:7},gen:0,hist:[]};for(let i=0;i<400;i++)gen(L);
let R=20000,t=process.hrtime.bigint();for(let i=0;i<R;i++)gen(L);const js=Number(process.hrtime.bigint()-t)/1e6/R;
const inb=new Float64Array(400),mem=new WebAssembly.Memory({initial:1}),v=new Float64Array(mem.buffer,0,400);
t=process.hrtime.bigint();for(let i=0;i<R;i++){for(let j=0;j<n;j++)v[j]=L.bits[j];for(let j=0;j<L.hist.length;j++)v[n+j]=L.hist[j];let s=0;for(let j=0;j<n;j++)s+=v[j];for(let j=0;j<L.hist.length;j++)s+=v[n+j];if(s<0)console.log(s);}const mar=Number(process.hrtime.bigint()-t)/1e6/R;
console.log('per knob per generation (n=28, hist 300): JS compute',js.toFixed(5),'ms; marshal in+out only (no wasm call)',mar.toFixed(5),'ms');
