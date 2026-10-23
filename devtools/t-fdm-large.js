// full-range fdlibm reduction vs V8 Math.sin/cos, |x| > 8.2e5 (large flag on). Usage: node t-fdm-large.js [wasm path rel to repo]
const fs=require('fs'),path=require('path');(async()=>{const E=(await WebAssembly.instantiate(fs.readFileSync(path.join(__dirname,'..',process.argv[2]||'wasm/target/wasm32-unknown-unknown/release/ca2core.wasm')),{})).instance.exports;
E.fdm_set_large(1);let s=1234567;function r(){s|=0;s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
let tot=0,bad=0,ex=[];const bits=Math.pow(2,0);function chk(x){for(const f of ['sin','cos']){const a=E['fdm_'+f](x),b=Math[f](x);tot++;if(!Object.is(a,b)){bad++;if(ex.length<8)ex.push([f,x,a,b])}}}
for(let i=0;i<300000;i++){const e=20+r()*1000;const x=(r()+1)*Math.pow(2,Math.floor(e/1.0)-1)*(r()<.5?-1:1);if(isFinite(x))chk(x)}  // exponents up to ~1000
for(let i=0;i<200000;i++){chk((r()*2-1)*Math.pow(10,6+r()*3))}  // 1e6..1e9 band
for(let i=0;i<100000;i++){chk((r()*2-1)*Math.pow(10,6+r()*30))}
for(const x of [8.2e5,8.2e5+1,1e6,1e7,1e15,1e22,1e100,1e300,Number.MAX_VALUE,-Number.MAX_VALUE,2**1023,2**52,2**53,2**100,Math.PI*2**30])chk(x);
console.log(JSON.stringify({tot,bad,ex,ood:E.fdm_clear_ood?1:0}));process.exit(bad?1:0)})();
