// t139 harness-copy patch: T130_NODRAW env -> window.__ca2NoDraw (f9 product hook, mode 2 =
// faithful stepped path: full sim + aging/habitat + fresh ink mask; only pure drawing/audio skipped).
// Applies to /tmp/f9reg/t130-deterministic-pair.js ONLY; the repo t130 is untouched.
// Inertness is NOT assumed: t139-c0 proves it byte-identical per seed before any nodraw claim.
const fs = require('fs');
const f = '/tmp/f9reg/t130-deterministic-pair.js';
let t = fs.readFileSync(f, 'utf8');
const anchor = "  vm.runInContext(src, sandbox, { filename: path.basename(enginePath) });\n";
if (t.split(anchor).length !== 2) { console.error('FATAL anchor'); process.exit(1); }
if (t.includes('T130_NODRAW')) { console.log('already patched'); process.exit(0); }
t = t.replace(anchor, anchor + "  if (process.env.T130_NODRAW) sandbox.__ca2NoDraw = +process.env.T130_NODRAW; // t139 copy-only\n");
fs.writeFileSync(f, t);
console.log('patched');
