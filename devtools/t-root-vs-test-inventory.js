// Inventory of what differs between the root (production) tree and the served test/ tree: functions, wasm exports, P keys, file hashes.
// Inventory only (exit 0): no gate. Run from repo root. Note: on branch ca/187-sep-wasm-parity-tests test/ca2.js includes the foodInk fix, so its hash differs from main f8ff9d96 (f762e0d4...).
const fs=require('fs'),crypto=require('crypto');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0,12);
const fns=s=>new Set([...s.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1]));
const pk=s=>{const o=new Set();for(const m of s.matchAll(/\bP\.([A-Za-z_]\w*)\s*=/g))o.add(m[1]);return o};
const diff=(a,b)=>[...a].filter(x=>!b.has(x)).sort();
(async()=>{const R=fs.readFileSync('ca2.js','utf8'),T=fs.readFileSync('test/ca2.js','utf8');
 console.log('files (sha256[:12], bytes):');for(const f of ['ca2.js','ca2core.wasm','ca2core-simd.wasm','index.html','grain.js','audio.js'])if(fs.existsSync(f)&&fs.existsSync('test/'+f))console.log(' ',f.padEnd(18),sha(f),fs.statSync(f).size,'| test',sha('test/'+f),fs.statSync('test/'+f).size,sha(f)===sha('test/'+f)?'SAME':'DIFF');
 const fr=fns(R),ft=fns(T);console.log('functions: root',fr.size,'test',ft.size,'| only in test',diff(ft,fr).length,'| only in root',diff(fr,ft).length);
 console.log(' only in test:',diff(ft,fr).join(' '));console.log(' only in root:',diff(fr,ft).join(' ')||'(none)');
 const pr=pk(R),pt=pk(T);console.log('P assignments: root',pr.size,'test',pt.size,'| only in test',diff(pt,pr).length,':',diff(pt,pr).join(' '));console.log(' only in root:',diff(pr,pt).join(' ')||'(none)');
 const ex=async f=>new Set(Object.keys((await WebAssembly.instantiate(fs.readFileSync(f),{})).instance.exports));
 const er=await ex('ca2core.wasm'),et=await ex('test/ca2core.wasm');console.log('wasm exports: root',er.size,'test',et.size,'| only in test:',diff(et,er).join(' '),'| only in root:',diff(er,et).join(' ')||'(none)');
 })();
