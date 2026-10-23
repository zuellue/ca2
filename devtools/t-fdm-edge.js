// fdm edge cases vs V8: adjacent bits around the 0x413921fb medium/large threshold and 8.2e5, +-0, NaN, +-Inf, subnormals, powers of two, +-MAX; flag on AND off (off: only <= threshold must match).
const fs=require('fs'),path=require('path');(async()=>{const f64=new Float64Array(1),u=new BigUint64Array(f64.buffer);
const E=(await WebAssembly.instantiate(fs.readFileSync(path.join(__dirname,'..',process.argv[2]||'wasm/target/wasm32-unknown-unknown/release/ca2core.wasm')),{})).instance.exports;
const fromBits=b=>{u[0]=b;return f64[0]};const bitsOf=x=>{f64[0]=x;return u[0]};
const thr=(0x413921fbn<<32n)|0xffffffffn; // last double with hi word 0x413921fb
const xs=[];for(let d=-40n;d<=40n;d++){xs.push(fromBits(thr+d));xs.push(fromBits(bitsOf(8.2e5)+d))}
for(const s of [0n,1n<<63n]){xs.push(fromBits(s));xs.push(fromBits(s|1n));xs.push(fromBits(s|0x000fffffffffffffn));xs.push(fromBits(s|0x0010000000000000n))}
xs.push(NaN,Infinity,-Infinity,Number.MAX_VALUE,-Number.MAX_VALUE,Number.MIN_VALUE);
for(let e=-1022;e<=1023;e+=1){xs.push(Math.pow(2,e));xs.push(-Math.pow(2,e)*1.5)}
for(let k=1;k<=5000;k++){xs.push(k*Math.PI/2);xs.push(-k*Math.PI/2);xs.push(fromBits(bitsOf(k*Math.PI/2)+1n))}
let res={};for(const flag of [1,0]){E.fdm_set_large(flag);let tot=0,bad=0,badInDom=0,ex=[];for(const x of xs){for(const f of['sin','cos']){const a=E['fdm_'+f](x),b=Math[f](x);tot++;if(!Object.is(a,b)){bad++;const inDom=(bitsOf(Math.abs(x))>>32n)<=0x413921fbn||!isFinite(x);if(inDom||flag){badInDom++;if(ex.length<6)ex.push([f,x,a,b])}}}}res['flag'+flag]={tot,bad,badThatMustMatch:badInDom,ex}}
console.log(JSON.stringify(res));process.exit((res.flag1.bad||res.flag0.badThatMustMatch)?1:0)})();
