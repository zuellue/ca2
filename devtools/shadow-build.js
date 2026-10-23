// shadow-build: source-transform of ca2.js (NOT shipped) for the mirrored-RNG shadow diagnostic.
// Per frame where the real wasm sim_step ran: snapshot pre-state, run wasm (real), snapshot post, restore pre, run the JS fallback loop
// (same source slice) with Math.random = mirror of sim.rs rnd01 seeded with the two seeds sim_step received, compare, restore the wasm post-state.
// Stops shadowing at the FIRST difference and stores a stage snapshot in window.__SH.first. Habitat must be OFF (or accounted for).
// usage: node devtools/shadow-build.js <out-dir>   (copies the repo to out-dir and writes the transformed ca2.js there)
const fs=require('fs'),path=require('path'),cp=require('child_process');
const out=process.argv[2]||'/tmp/ca2sh',root=path.join(__dirname,'..');
cp.execSync('rm -rf '+out+' && mkdir -p '+out+' && cd '+root+' && tar --exclude=.git --exclude=wasm/target --exclude=wasm/target-simd -cf - . | tar -xf - -C '+out);
let s=fs.readFileSync(path.join(root,'ca2.js'),'utf8');
function rep1(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw new Error('anchor not unique/found: '+a.slice(0,60));s=s.slice(0,i)+b+s.slice(i+a.length);}
// 1 seeds capture
rep1('E.sim_step(Math.floor(Math.random() * 4294967296), Math.floor(Math.random() * 4294967296));','E.sim_step(__SH.s0 = Math.floor(Math.random() * 4294967296), __SH.s1 = Math.floor(Math.random() * 4294967296));');
// 2 helpers before simW
const helpers=`
  var __M64 = (1n << 64n) - 1n;
  function __xorSeed(a, b) { var s0 = (BigInt(a >>> 0) << 32n) | 0x9E3779B9n, s1 = (BigInt(b >>> 0) << 32n) | 0x85EBCA6Bn; for (var w = 0; w < 8; w++) { var x0 = s0, y0 = s1; s0 = y0; x0 = (x0 ^ (x0 << 23n)) & __M64; s1 = (x0 ^ y0 ^ (x0 >> 17n) ^ (y0 >> 26n)) & __M64; }
    var f = function () { f.n++; var x = s0, y = s1; s0 = y; x = (x ^ (x << 23n)) & __M64; s1 = (x ^ y ^ (x >> 17n) ^ (y >> 26n)) & __M64; return Number(((s1 + y) & __M64) >> 11n) / 9007199254740992; }; f.n = 0; return f; }
  var __SH = window.__SH = { on: true, s0: 0, s1: 0, frames: 0, compared: 0, drawsMirror: 0, first: null, maxAbs: 0, maxUlp: 0, nonExact: 0, cellsSeen: 0, events: {} };
  function __shSafe(v) { if (v && typeof v === 'object') { try { return JSON.parse(JSON.stringify(v)); } catch (e) { return v; } } return v; }
  function __shClone(c) { var o = {}; for (var k in c) { if (k.charAt(0) === '_') continue; var v = c[k]; if (k === 'sym') { o.sym = v ? cells.indexOf(v) : -1; continue; } o[k] = __shSafe(v); } return o; }
  function __shSnap() { return { cells: cells.slice(), f: cells.map(__shClone), foodRef: food.slice(), food: food.map(function (f) { return Object.assign({}, f); }), ev: Object.assign({}, ev), cm: JSON.parse(JSON.stringify(cmean)), seq: clusterSeq }; }
  function __shRestore(sn) { cells.length = 0; sn.cells.forEach(function (c, i) { var o = sn.f[i]; for (var k in c) { if (k.charAt(0) !== '_' && !(k in o)) delete c[k]; } for (var k2 in o) { if (k2 === 'sym') continue; c[k2] = __shSafe(o[k2]); } cells.push(c); });
    sn.cells.forEach(function (c, i) { c.sym = sn.f[i].sym >= 0 ? sn.cells[sn.f[i].sym] : null; });
    food.length = 0; sn.foodRef.forEach(function (f, i) { for (var k in f) { if (!(k in sn.food[i])) delete f[k]; } Object.assign(f, sn.food[i]); food.push(f); });
    for (var ke in ev) { if (!(ke in sn.ev)) delete ev[ke]; } Object.assign(ev, sn.ev); cmean = JSON.parse(JSON.stringify(sn.cm)); clusterSeq = sn.seq; }
  function __ulp(a, b) { if (a === b) return 0; var f = new Float64Array([a, b]), u = new BigInt64Array(f.buffer); var d = u[0] - u[1]; return Number(d < 0n ? -d : d); }
  function __shCmp(w, j) { var d = []; var add = function (w1, k, a, b) { if (Object.is(a, b)) return; if (typeof a === 'number' && typeof b === 'number' && isFinite(a) && isFinite(b)) { var ab = Math.abs(a - b), ul = __ulp(a, b); if (ab > __SH.maxAbs) __SH.maxAbs = ab; if (ul > __SH.maxUlp) __SH.maxUlp = ul; __SH.nonExact++; if (d.length < 12) d.push({ w1: w1, k: k, wasm: a, js: b, abs: ab, ulp: ul }); } else if (d.length < 12) d.push({ w1: w1, k: k, wasm: a, js: b }); };
    if (w.f.length !== j.f.length) d.push({ w1: 'cells.length', wasm: w.f.length, js: j.f.length });
    for (var i = 0; i < Math.min(w.f.length, j.f.length); i++) { var a = w.f[i], b = j.f[i]; for (var k in a) { if (k === 'sym') add(i, k, a[k], b[k]); else if (typeof a[k] === 'object' && a[k]) { var ja = JSON.stringify(a[k]), jb = JSON.stringify(b[k]); if (ja !== jb) { if (d.length < 12) d.push({ w1: i, k: k, wasm: ja.slice(0, 80), js: jb && jb.slice(0, 80) }); __SH.nonExact++; } } else add(i, k, a[k], b[k]); } for (var k3 in b) if (!(k3 in a)) d.push({ w1: i, k: k3, onlyJS: b[k3] }); }
    if (w.food.length !== j.food.length) d.push({ w1: 'food.length', wasm: w.food.length, js: j.food.length }); else for (var q = 0; q < w.food.length; q++) { add('food' + q, 'x', w.food[q].x, j.food[q].x); add('food' + q, 'y', w.food[q].y, j.food[q].y); }
    for (var ke in w.ev) add('ev', ke, w.ev[ke], j.ev[ke]); for (var ke2 in j.ev) if (!(ke2 in w.ev)) add('ev', ke2, undefined, j.ev[ke2]);
    add('seq', 'clusterSeq', w.seq, j.seq); var wk = Object.keys(w.cm), jk = Object.keys(j.cm); if (wk.length !== jk.length) d.push({ w1: 'cmean', wasm: wk.length, js: jk.length }); else wk.forEach(function (key) { var m1 = w.cm[key], m2 = j.cm[key]; if (!m2) d.push({ w1: 'cmean', k: key, js: null }); else for (var f in m1) add('cm' + key, f, m1[f], m2[f]); });
    return d; }
`;
rep1('  function simW(tmpRef, wcl) {',helpers+'  function simW(tmpRef, wcl) {');
// 3 per-frame hook: extract the JS loop slice and inline it inside the shadow block
const loopStart='    if (!simDone) for (var i = cells.length - 1; i >= 0; i--) {';
const li=s.indexOf(loopStart),le=s.indexOf('    if (!simDone) SIMW.js =',li);
if(li<0||le<0)throw new Error('loop slice not found');
const loopSrc=s.slice(li,le).replace('if (!simDone) for','for');
const callA='var tmpR = { v: null }, tj0 = performance.now(), simDone = simW(tmpR, wcl);';
const callB='var tmpR = { v: null }, tj0 = performance.now(), __shPre = (__SH.on && wcl && simCanRun() && !P.habitatOn) ? __shSnap() : null, simDone = simW(tmpR, wcl);';
rep1(callA,callB);
const afterA='if (simDone) { tmpHover = tmpR.v; hoverCell = tmpR.hc; }';
const block=`
    if (simDone && __shPre) { __SH.frames++; var __wHov = hovering, __wTmp = tmpHover, __wHC = hoverCell, __wSn = __shSnap(); __shRestore(__shPre); var __oldR = Math.random, __rg = __xorSeed(__SH.s0, __SH.s1); Math.random = __rg;
      try { cmean = {}; jsCluster(); hovering = false; tmpHover = [255, 255, 255]; hoverCell = null;
${loopSrc}
      } finally { Math.random = __oldR; }
      var __jSn = __shSnap();
      if (__SH.self) { __shRestore(__shPre); Math.random = __rg = __xorSeed(__SH.s0, __SH.s1); try { cmean = {}; jsCluster(); hovering = false; tmpHover = [255, 255, 255]; hoverCell = null;
${loopSrc}
      } finally { Math.random = __oldR; } var __j2 = __shSnap(), __sd = __shCmp(__jSn, __j2); __SH.selfFrames = (__SH.selfFrames || 0) + 1; if (__sd.length) { __SH.selfBad = (__SH.selfBad || 0) + 1; if (!__SH.selfFirst) __SH.selfFirst = __sd; } }
      var __dd = __shCmp(__wSn, __jSn); __SH.compared++; __SH.drawsMirror += __rg.n; __SH.cellsSeen += __wSn.f.length;
      var __jHov = [hovering, JSON.stringify(tmpHover), hoverCell ? cells.indexOf(hoverCell) : -1], __wH = [__wHov, JSON.stringify(__wTmp), __wHC ? __wSn.cells.indexOf(__wHC) : -1];
      if (JSON.stringify(__jHov) !== JSON.stringify(__wH)) __dd.push({ w1: 'hover', wasm: __wH, js: __jHov });
      __shRestore(__wSn); hovering = __wHov; tmpHover = __wTmp; hoverCell = __wHC;
      if (__dd.length && !__SH.first) { __SH.first = { frame: __SH.frames, nCells: __wSn.f.length, diffs: __dd, drawsMirror: __rg.n, seeds: [__SH.s0, __SH.s1], preCell0: __shPre.f.slice(0, 2), wasmCell0: __wSn.f.slice(0, 2), jsCell0: __jSn.f.slice(0, 2) }; __SH.on = false; } }
`;
rep1(afterA,afterA+block);
fs.writeFileSync(path.join(out,'ca2.js'),s);
console.log('wrote',path.join(out,'ca2.js'),'bytes',s.length,'loopSliceLines',loopSrc.split('\n').length);
