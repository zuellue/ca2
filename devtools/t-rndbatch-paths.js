// t-rndbatch-paths: focused path tests for the rndbatch (M2) random transport (card 20261024-371-ca).
// Covers the paths the existing gates do not isolate:
//   A. 8192-buffer refill boundary (fill-on-exhaust: refill exactly at cur==end, never early)
//   B. JS-side pop path (the ca2.js Math.random override pops the SAME buffer; interleaved
//      Rust/JS draws keep one global stream order; refills trigger from BOTH sides)
//   C. cursor wrap (cur: end -> refill -> 0 -> 1; values continue seamlessly)
//   D. mid-buffer exhaustion (cursor set mid-buffer; a draw sequence straddling the buffer end
//      stays contiguous - no skipped or repeated stream values)
//   E. refill contract guard (Rust refill() panics on end==0, end>N, cur>=end after fill)
// Byte parity: every drawn value is Object.is-equal to the seeded reference stream value at its
// global draw index - the same stream the JS fallback (per-draw env.js_rnd, M1) would return.
// Run: node devtools/t-rndbatch-paths.js   (exit 1 on any failure)
const fs = require('fs');
const R = __dirname + '/../';
// reference stream: identical generator/seed to devtools/t-cost-fixture2.js (deterministic, wraps at 65536)
const stream = new Float64Array(1 << 16);
{ let a = 7; for (let i = 0; i < stream.length; i++) { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; stream[i] = ((t ^ t >>> 14) >>> 0) / 4294967296; } }
let k = 0; // global stream cursor (shared per-instance via reset in mkInst)
const BIN = process.env.RNDBIN || R + 'ca2core-jsrnd2.wasm';
const failures = [];
function check(name, cond, detail) {
  console.log(JSON.stringify({ case: name, ok: !!cond, detail: detail || '' }));
  if (!cond) failures.push(name + (detail ? ' ' + detail : ''));
}
function mkInst(fillFn) { // fresh instance + fresh stream cursor; fillFn(E, b, m, cap) writes BUF/META
  k = 0;
  const H = { E: null }; let fills = 0;
  const imp = { env: { js_rnd_fill: function () {
    fills++;
    const E = H.E, cap = E.sim_rndcap();
    const b = new Float64Array(E.memory.buffer, E.sim_rndbuf_ptr(), cap);
    const m = new Uint32Array(E.memory.buffer, E.sim_rndmeta_ptr(), 2);
    fillFn(b, m, cap);
  } } };
  const ins = new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(BIN)), imp);
  H.E = ins.exports;
  const cap = H.E.sim_rndcap();
  return { E: H.E, cap, fills: () => fills };
}
const goodFill = (b, m, cap) => { for (let i = 0; i < cap; i++) b[i] = stream[k++ & 65535]; m[0] = 0; m[1] = cap; };
function views(E, cap) { return { b: new Float64Array(E.memory.buffer, E.sim_rndbuf_ptr(), cap), m: new Uint32Array(E.memory.buffer, E.sim_rndmeta_ptr(), 2) }; }
function draw1(E) { return E.sim_rndbatch_bench(1); } // 0.0 + next() === next() bit-exact for values in [0,1)

// ---- A: 8192 refill boundary ----
{ const { E, cap, fills } = mkInst(goodFill);
  check('A0 cap=8192', cap === 8192, 'cap=' + cap);
  let v0 = views(E, cap);
  check('A1 initial meta [0,0]', v0.m[0] === 0 && v0.m[1] === 0, v0.m.join(','));
  let bad = -1;
  for (let i = 0; i < 2 * cap + 1; i++) { const v = draw1(E); if (!Object.is(v, stream[i])) { bad = i; break; } }
  check('A2 values 0..' + (2 * cap) + ' stream-exact', bad < 0, bad < 0 ? '' : 'first mismatch at draw ' + bad);
  // boundary state crisply on a fresh instance (fill-on-exhaust: no early refill at exactly cap draws)
  const x = mkInst(goodFill);
  for (let i = 0; i < cap; i++) draw1(x.E);
  let vx = views(x.E, cap);
  const fBefore = x.fills();
  check('A4 at cur==end no refill yet', vx.m[0] === cap && vx.m[1] === cap && fBefore === 1, 'meta=' + vx.m.join(',') + ' fills=' + fBefore);
  const v8193 = draw1(x.E);
  vx = views(x.E, cap);
  check('A5 draw cap+1: exactly one refill, value=stream[cap], meta [1,cap]', x.fills() === 2 && Object.is(v8193, stream[cap]) && vx.m[0] === 1 && vx.m[1] === cap, 'fills=' + x.fills() + ' meta=' + vx.m.join(','));
  let bufOk = true; for (let i = 0; i < cap; i++) if (!Object.is(vx.b[i], stream[cap + i])) { bufOk = false; break; }
  check('A6 second fill wrote full window stream[cap..2cap-1]', bufOk);
}

// ---- B: JS-side pop path (ca2.js override shape, interleaved with Rust draws) ----
{ const { E, cap, fills } = mkInst(goodFill);
  const rbp = E.sim_rndbuf_ptr(), rmp = E.sim_rndmeta_ptr();
  let rb = null, rm = null, popsJS = 0, jsFills = 0;
  const rv = () => { if (!rm || rm.buffer.byteLength === 0) { rb = new Float64Array(E.memory.buffer, rbp, cap); rm = new Uint32Array(E.memory.buffer, rmp, 2); } };
  const base = () => stream[k++ & 65535];           // rndH.base in ca2.js (harness-seeded here)
  // WC.rndFill as in ca2.js (also the env.js_rnd_fill body for THIS instance - re-wire import side:
  // the import used goodFill; emulate the same net effect and count JS-triggered fills below)
  const jsPop = () => { rv(); if (rm[0] === rm[1]) { jsFills++; const b2 = new Float64Array(E.memory.buffer, rbp, cap); const m2 = new Uint32Array(E.memory.buffer, rmp, 2); for (let i = 0; i < cap; i++) b2[i] = base(); m2[0] = 0; m2[1] = cap; rv(); } popsJS++; return rb[rm[0]++]; };
  let g = 0, bad = -1, nWasm = 0, nJs = 0;
  outer:
  for (let it = 0; it < 2000; it++) {
    for (let j = 0; j < 3; j++) { nWasm++; if (!Object.is(draw1(E), stream[g++ & 65535])) { bad = g - 1; break outer; } }
    for (let j = 0; j < 2; j++) { nJs++; if (!Object.is(jsPop(), stream[g++ & 65535])) { bad = g - 1; break outer; } }
    { nJs++; if (!Object.is(jsPop(), stream[g++ & 65535])) { bad = g - 1; break outer; } }
    for (let j = 0; j < 5; j++) { nWasm++; if (!Object.is(draw1(E), stream[g++ & 65535])) { bad = g - 1; break outer; } }
  }
  check('B1 interleaved wasm+JS draws globally stream-exact', bad < 0, bad < 0 ? 'draws=' + g + ' (wasm ' + nWasm + ', js ' + nJs + ')' : 'first mismatch at global draw ' + bad);
  const rustFills = fills() - 0; // import-side fills (Rust-triggered) counted by mkInst; JS-triggered fills went through jsPop's inline fill
  check('B2 refills triggered from BOTH sides', rustFills > 0 && jsFills > 0, 'rustFills=' + rustFills + ' jsFills=' + jsFills);
  check('B3 popsJS counts every JS draw', popsJS === nJs, popsJS + ' vs ' + nJs);
  check('B4 stream consumption == fills*cap (no leak/double-draw)', k === (rustFills + jsFills) * cap, 'k=' + k + ' fills=' + (rustFills + jsFills));
}

// ---- C: cursor wrap end -> 0 ----
{ const { E, cap, fills } = mkInst(goodFill);
  for (let i = 0; i < cap - 1; i++) draw1(E);
  let v = views(E, cap);
  check('C1 cap-1 draws: meta [cap-1,cap], fills=1', v.m[0] === cap - 1 && v.m[1] === cap && fills() === 1, v.m.join(','));
  const lastOfFill = draw1(E); v = views(E, cap);
  check('C2 draw cap: value stream[cap-1], cursor at [cap,cap]', Object.is(lastOfFill, stream[cap - 1]) && v.m[0] === cap && v.m[1] === cap && fills() === 1, v.m.join(','));
  const firstOfNext = draw1(E); v = views(E, cap);
  check('C3 wrap: refill then cur 0->1, value stream[cap]', fills() === 2 && Object.is(firstOfNext, stream[cap]) && v.m[0] === 1 && v.m[1] === cap, 'fills=' + fills() + ' meta=' + v.m.join(','));
  check('C4 post-wrap buffer window', Object.is(v.b[0], stream[cap]) && Object.is(v.b[cap - 1], stream[2 * cap - 1]));
}

// ---- D: mid-buffer exhaustion (cursor set mid-buffer, sequence straddles the end) ----
{ const { E, cap, fills } = mkInst(goodFill);
  draw1(E); // one real draw -> fill 1 in place, cur=1
  let v = views(E, cap);
  v.m[0] = 8100; // emulate 8100 consumed (both sides may write META by contract)
  let bad = -1;
  for (let j = 0; j < 200; j++) { const exp = stream[8100 + j]; const got = draw1(E); if (!Object.is(got, exp)) { bad = j; break; } }
  v = views(E, cap);
  check('D1 straddle 8100..8299 contiguous stream-exact (92 old + 108 new)', bad < 0 && fills() === 2, bad < 0 ? 'meta=' + v.m.join(',') + ' fills=' + fills() : 'mismatch at probe draw ' + bad);
  check('D2 refill exactly at the boundary inside the sequence', v.m[0] === 108 && v.m[1] === cap, v.m.join(','));
}

// ---- E: refill contract guard (panic=abort -> JS RuntimeError trap) ----
const badFills = {
  'E1 end==0': (b, m, cap) => { m[0] = 0; m[1] = 0; },
  'E2 end>N': (b, m, cap) => { for (let i = 0; i < cap; i++) b[i] = 0.5; m[0] = 0; m[1] = cap + 1; },
  'E3 cur>=end after fill': (b, m, cap) => { for (let i = 0; i < cap; i++) b[i] = 0.5; m[0] = 5; m[1] = 5; },
};
for (const [name, fn] of Object.entries(badFills)) {
  let threw = false, msg = '';
  try { const { E } = mkInst(fn); draw1(E); } catch (e) { threw = true; msg = String(e).slice(0, 60); }
  check(name + ' traps', threw, msg);
}
{ let threw = false; try { const { E } = mkInst(goodFill); draw1(E); } catch (e) { threw = true; } // control
  check('E4 good fill does not trap (control)', !threw); }

console.log(failures.length ? 'RNDBATCH-PATHS FAIL ' + JSON.stringify(failures) : 'RNDBATCH-PATHS PASS');
process.exit(failures.length ? 1 : 0);
