'use strict';
// Source/export inventory only. This does not claim grain parity.
const fs = require('node:fs');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const grain = fs.readFileSync('grain.js','utf8');
const caller = fs.readFileSync('ca2.js','utf8');
const files = fs.readdirSync('wasm/src').filter(x=>x.endsWith('.rs')).sort();
const rustHits = files.flatMap(name => fs.readFileSync('wasm/src/'+name,'utf8').split('\n').flatMap((line,i)=> /grain/i.test(line) ? [{path:'wasm/src/'+name,line:i+1,text:line}] : []));
const binaries = ['ca2core.wasm','ca2core-simd.wasm'].map(path => {
 const module = new WebAssembly.Module(fs.readFileSync(path));
 const exports = WebAssembly.Module.exports(module).map(x=>({name:x.name,kind:x.kind}));
 return {path,sha256:hash(path),exportCount:exports.length,grainExports:exports.filter(x=>/grain/i.test(x.name)),exports};
});
const result = {
 schema:1,scope:'card017 current wasm-bodyplan grain implementation inventory',
 baseCommit:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 inputs:['grain.js','ca2.js','wasm/src/lib.rs'].map(path=>({path,sha256:hash(path)})),
 grainPath:{webgl2Context:/getContext\('webgl2'/.test(grain),shaderSource:/var FS = "#version 300 es/.test(grain),drawCall:/gl\.drawArrays\(/.test(grain),callerUsesCA2Grain:/CA2Grain\.render\(cv,/.test(caller)},
 rustGrainHits:rustHits,binaries,
 parity:{status:'NOT_RUN_MISSING_COMPARISON_TARGET',identicalInputComparisons:0,reason:'Current grain.js dispatches WebGL2 shader work. No grain-named Rust source or WASM export is present in these checked artifacts. A WASM/JS grain pair is not established; simulation/metaball parity is a different scope.'}
};
console.log(JSON.stringify(result,null,2));
if (!result.grainPath.webgl2Context || !result.grainPath.shaderSource || !result.grainPath.drawCall || !result.grainPath.callerUsesCA2Grain) process.exitCode=1;
