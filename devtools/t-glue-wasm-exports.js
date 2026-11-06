// Node contract test: every wasm export the page JS calls through the engine handle (E.<name> / WC.e.<name>) exists in the served binaries.
// A glue/binary skew (new glue, old wasm) otherwise falls back to JS silently (guards like E&&E.sep_run) and changes behaviour without an error.
// Run from repo root: node devtools/t-glue-wasm-exports.js [dir=test]   (use "." for the root/production tree)
const fs=require('fs'),dir=process.argv[2]||'test',js=fs.readFileSync(dir+'/ca2.js','utf8');
const lines=js.split('\n'),used=new Set();for(const m of js.matchAll(/\b(?:E|WC\.e)\.([a-z][a-z0-9]*_[a-z0-9_]+)\b/g))used.add(m[1]);
(async()=>{let fails=0;for(const f of ['ca2core.wasm','ca2core-simd.wasm']){
 const ex=Object.keys((await WebAssembly.instantiate(fs.readFileSync(dir+'/'+f),{})).instance.exports),missAll=[...used].filter(n=>!ex.includes(n));
 // a missing name is OPTIONAL when every line using it sits behind a guard on a missing export (if (WC.e.x) / E&&E.x / E.x&&): the page falls back to JS there
 const guardOf=l=>[...l.matchAll(/(?:if\s*\(\s*!?\s*(?:WC\.e|E)\.([a-z0-9_]+)\s*[)&]|E&&E\.([a-z0-9_]+)|\bE\.([a-z0-9_]+)\s*&&)/g)].map(m=>m[1]||m[2]||m[3]);
 const optional=n=>lines.filter(l=>l.includes(n)).every(l=>guardOf(l).some(g=>!ex.includes(g)));
 const opt=missAll.filter(optional),miss=missAll.filter(n=>!optional(n));
 if(opt.length)console.log('  optional (guarded, JS fallback active, native path NOT used):',opt.join(','));
 console.log(dir+'/'+f,'exports',ex.length,'glue uses',used.size,miss.length?'MISSING '+miss.join(','):'ok');if(miss.length)fails++}
 process.exit(fails?1:0)})();
