// Per-cell pair-resolve displacement budget on the SERVED test wasm, 4 variants x both binaries. Wraps devtools/t133-pair-budget-parity.js (from PR #2 head a4745090, unmodified).
// Run from repo root: node devtools/t-pair-budget-served.js [states=6]. Exit 1 if any variant exceeds the maxSpeed+1 per-cell budget.
const {spawnSync}=require('child_process'),states=process.argv[2]||'6';
const variants=[{},{CL:'1'},{CL:'1',ZEROV:'1'},{RING:'1'}],bins=['test/ca2core.wasm','test/ca2core-simd.wasm'];let fail=0;
for(const v of variants)for(const b of bins){
 const r=spawnSync('node',['devtools/t133-pair-budget-parity.js','1','200','120',states],{env:Object.assign({},process.env,v,{WASM_A:b,WASM_B:b,CA_JS:process.env.CA_JS||'test/ca2.js'}),encoding:'utf8',timeout:100000});
 const out=(r.stdout||''),pass=/PASS: candidate within/.test(out)&&r.status===0,worst=Math.max(0,...[...out.matchAll(/B worst px ([\d.]+)/g)].map(m=>+m[1]));
 console.log((pass?'PASS ':'FAIL ')+JSON.stringify(v)+' '+b+' worst px '+worst.toFixed(1));if(!pass)fail++}
console.log(fail?'FAILED '+fail+'/8':'PASS 8/8 variant-binary runs');process.exit(fail?1:0);
