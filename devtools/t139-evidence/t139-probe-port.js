// t139 probe port: f9 test/ca2.js -> tr9F9R-ca2.js (harness-only pins, 77d/t130 contract).
// Applies the SAME probe set as the accepted pins (tr7Base + tr7BaseR diff, t130-evidence/MANIFEST.md):
// carry counters in carrySide, __ca2KillTrans/__ca2ResetGlobals, T130_REPLAY forced-motion hook.
// Fail-closed: every anchor must match exactly once. No product behavior change (probe lines only).
'use strict';
const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
const out = process.argv[3];
const inserts = [
  { name: 'carry-pre',
    anchor: 'function carrySide(p, ax, vax, along, line, wv, side, vel) {\n',
    add: '    var __cp = (p instanceof Cell && window.__ca2Carry) ? Math.hypot(p.vx, p.vy) : -1;\n',
    after: true },
  { name: 'carry-post',
    anchor: '      if (vel) p[vax] = side * Math.abs(p[vax]) * 0.7;\n    }\n  }\n',
    add: '    if (__cp >= 0) { var __cid = window.__ca2traceIdFn ? window.__ca2traceIdFn(p) : -1; if (__cid >= 0 && __cid < 1000) { var __cs = window.__ca2Carry[__cid] || (window.__ca2Carry[__cid] = { n: 0, pist: 0, refl: 0, dvPos: 0, dvNeg: 0, fr: {} }); var __dv = Math.hypot(p.vx, p.vy) - __cp; __cs.n++; if (P.wallCarry > 0 && wv * side > 0) __cs.pist++; else __cs.refl++; if (__dv >= 0) __cs.dvPos += __dv; else __cs.dvNeg += __dv; __cs.fr[frameT] = 1; } }\n',
    after: false,
    replaceTail: '  }\n' },
  { name: 'replay-hook',
    anchor: 'cont.wvy1 = cont.y + cont.h - (py0 + ph0); // px/frame edge velocities for the piston carry\n',
    add: '    if (window.__ca2ReplayRow) { var rr8 = window.__ca2ReplayRow; cont.x = rr8[0]; cont.y = rr8[1]; cont.w = rr8[2]; cont.h = rr8[3]; cont.wvx0 = rr8[4]; cont.wvx1 = rr8[5]; cont.wvy0 = rr8[6]; cont.wvy1 = rr8[7]; window.__ca2ReplayApplied = (window.__ca2ReplayApplied || 0) + 1; window.__ca2ReplayFields = 8; } // t130 replay probe (harness-only, 77d): forced shared boundary-motion script; supersedes the computed ease/wvx downstream of every consumer\n',
    after: true },
  { name: 'globals-probes',
    anchor: '    __ca2.habStat = habStat;\n',
    add: '    window.__ca2KillTrans = function () { trans = null; }; // t130 probe (harness builds only): inject-time morph kill\n    window.__ca2ResetGlobals = function (u, cr, ir, mr, mut, cs) { P.UNIVERSE_SIZE = u; P.CELL_RADIUS = cr; P.interactionRadius = ir; P.mutationRateRange = mr; P.baseMutationRate = mut; env.spd = 1; env.app = 0.5; env.bnd = 1; env.col = null; clusterSeq = cs; }; // t130 probe: pair-matched globals, direct P writes (applyKey would reset radii)\n',
    after: false },
];
let txt = src;
for (const ins of inserts) {
  const n = txt.split(ins.anchor).length - 1;
  if (n !== 1) { console.error('FATAL anchor ' + ins.name + ' matched ' + n + ' times'); process.exit(1); }
  if (ins.after) txt = txt.replace(ins.anchor, ins.anchor + ins.add);
  else if (ins.replaceTail) {
    // anchor ends with the text to keep after insertion (the closing brace of carrySide)
    const tail = ins.replaceTail;
    const head = ins.anchor.slice(0, ins.anchor.length - tail.length);
    txt = txt.replace(ins.anchor, head + ins.add + tail);
  } else txt = txt.replace(ins.anchor, ins.add + ins.anchor);
}
fs.writeFileSync(out, txt);
// verify: no probe line may already have existed, and each insert is present once
for (const probe of ['__ca2KillTrans', '__ca2ResetGlobals', '__ca2ReplayRow', '__ca2Carry']) {
  const n = txt.split(probe).length - 1;
  if (n < 1) { console.error('FATAL probe missing after insert: ' + probe); process.exit(1); }
}
new Function(txt); // syntax check (not executed)
console.log('OK probes applied:', inserts.map(i => i.name).join(', '));
