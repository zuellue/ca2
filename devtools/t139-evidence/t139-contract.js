// t139-contract: executable f9 contract probes over a t130 frames JSON (77d fixed-dt replay output).
// usage: node t139-contract.js <frames.json>   exit 1 if the FIT-cell non-penetration assertion fails.
// Rows: [ti,x,y,vx,vy,radius,envV,near]; frame: {cont:[x,y,w,h], n, cells[]}.
// Split (CA7 class): a cell with 2r > min(plateW, plateH) cannot fit the plate; f9's non-penetration
// contract is asserted for FIT cells only. notFit overshoot is a reported deviation metric (unresolved
// CA7 class), never a silent pass. Tolerances explicit.
'use strict';
const fs = require('fs');
const frames = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const TOL_PEN = 0.75; // px body penetration past the wall line (rounding headroom)
let fitViol = 0, fitMax = 0, fitMaxAt = null, fitSamples = 0;
let nfCellFrames = 0, nfMax = 0, nfMaxAt = null; const nfCells = new Set();
let maxStep = 0, maxStepAt = null; const stepP = []; const prev = {};
const firstR = {}, lastR = {}, lastF = {};
frames.forEach((f, fi) => {
  const [cx, cy, cw, ch] = f.cont; const minDim = Math.min(cw, ch);
  for (const c of f.cells) {
    const [ti, x, y, , , r] = c;
    const pen = Math.max(cx - (x - r), (x + r) - (cx + cw), cy - (y - r), (y + r) - (cy + ch));
    if (2 * r > minDim) { nfCellFrames++; nfCells.add(ti);
      if (pen > nfMax) { nfMax = pen; nfMaxAt = { frame: fi, ti, pen: +pen.toFixed(3), r: +r.toFixed(1), plate: [cw, +ch.toFixed(1)] }; } }
    else { fitSamples++;
      if (pen > fitMax) { fitMax = pen; fitMaxAt = { frame: fi, ti, pen: +pen.toFixed(3), r: +r.toFixed(1) }; }
      if (pen > TOL_PEN) fitViol++; }
    if (prev[ti]) { const d = Math.hypot(x - prev[ti][0], y - prev[ti][1]); stepP.push(d);
      if (d > maxStep) { maxStep = d; maxStepAt = { frame: fi, ti, d: +d.toFixed(3) }; } }
    prev[ti] = [x, y];
    if (ti < 1000) { if (firstR[ti] === undefined) firstR[ti] = r; lastR[ti] = r; lastF[ti] = fi; }
  }
});
stepP.sort((a, b) => a - b);
const q = p => +stepP[Math.floor(p * (stepP.length - 1))].toFixed(3);
let grew = 0, shrank = 0, survivors = 0, maxLoss = 0, maxGain = 0;
for (const ti in firstR) if (lastF[ti] === frames.length - 1) { survivors++;
  const d = lastR[ti] - firstR[ti];
  if (d > 0.5) grew++; else if (d < -0.5) shrank++;
  maxLoss = Math.min(maxLoss, d / firstR[ti]); maxGain = Math.max(maxGain, d / firstR[ti]); }
const out = { frames: frames.length,
  fitContainment: { samples: fitSamples, violationsOverTol: fitViol, tol: TOL_PEN, maxPenetrationPx: +fitMax.toFixed(3), at: fitMaxAt, pass: fitViol === 0 },
  notFitOvershoot: { cells: nfCells.size, cellFrames: nfCellFrames, maxPenetrationPx: +nfMax.toFixed(3), at: nfMaxAt },
  displacement: { maxStepPx: +maxStep.toFixed(3), at: maxStepAt, p50: q(0.5), p99: q(0.99), samples: stepP.length },
  radius: { injectedSurvivors: survivors, grew, shrank, maxLossFrac: +maxLoss.toFixed(4), maxGainFrac: +maxGain.toFixed(4) } };
console.log(JSON.stringify(out, null, 1));
if (!out.fitContainment.pass) process.exit(1);
