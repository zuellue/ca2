# CA-31 ORACLE first findings: raw single-step bit mismatches vs stepSquash-masked TRACE2

Date: 2026-11-07. Branch: ca/187-js-rust-alignment. Follows rustpow-port-20261107.md.

## ORACLE mode (devtools/t70-interact-iso-served.js, ORACLE=N with FULLST=1)
Real mkState base per seed, aligned xorshift128+ streams, exactly ONE step per engine
(J.frame() vs pack+sim_step), per-cell bit comparison of x/y/vx/vy/energy. NO stepSquash
post-pass (unlike TRACE2 and the app frame).

## Measured (ORACLE=2000, 40 cells/state)
- 589/2000 states (29.45%) show at least one per-cell bit mismatch after ONE step.
- Dominant pattern: 1-ulp velocity diffs on a single axis (e.g. dvy -5.55e-17), energy
  exact: ~0.7% of cell-steps. Rare large diffs (1/2000 states: dv ~1.4, dEnergy -0.14) =
  a downstream draw-count desync once a gate flips on a near-equal comparison.
- A first naive synthetic-single-cell oracle variant diverged systematically (organic /
  survival side effects from non-harness params) - discarded; only real-mkState results
  above count.

## Reconciliation with TRACE2's 30-step bit-exactness
TRACE2 snapshots AFTER J.stepSquash() on both engines (the app frame order, ca2.js:2302);
ORACLE compares raw frame output. The residual seed lives in the raw update/interact/keepIn
outputs and the stepSquash post-pass masks or absorbs most of it; where a seed survives,
amplification shows up at step ~26-39 in TRACE2 (per trace2-noise-floor-20261107.md, the
first diff lands in crowd at ~1 ulp). The served binary's cos/sin are V8-compatible on the
overwhelming majority of draws (~99.3%), unlike a Rust 1.99.1 build (~50% mismatch vs V8);
the served toolchain's libm is close to but not bit-identical with V8's fdlibm.

## STATUS NOTE (same day, post-commit)
The stepSquash-masking reconciliation above is a HYPOTHESIS, not a measured line: the
first quantification attempt (extending ORACLE with a post-pass compare) was buggy
(index misalignment after the JS death-splice + contaminated sqS in the reused mirror)
and was discarded uncommitted.

## CA-32 measured line 1 (same day): masking DISPROVEN
ORACLE rewritten with the FULLST loop's exact mirror handling (fresh clone, readback of
slots 0-13 + 24-28, dead-splice, then J.stepSquash() on both sides, app frame order):
FULLST=1 ORACLE=2000: raw mismatched states 577 (28.85%); post-stepSquash mismatched
states 577 (28.85%); masked 0.0%. stepSquash does NOT mask the raw seeds - the raw and
post-pass mismatch sets are identical. Seeds remain 1-ulp single-cell single-axis
velocity diffs (energy exact), e.g. seed#=4 cell=22 dvx +2.22e-16.
Consequence: TRACE2's 30-step bit-exact run dodged trigger inputs for 30 steps on one
base state; the underlying raw seed rate is ~0.7% of cell-steps (577/2000 states have
>=1 seed at step 1). The seeds are real JS-vs-served compute differences in the raw
update/interact/keepIn path; FULLST distribution parity absorbs them.

## OPEN (next run)
- Attribute the 1-ulp velocity seed decisively: replay the diverging cell's draws and
  compare wasm-implied cos(a)/sin(a) (needs per-cell draw-index accounting in descending
  processing order, or a DIVMODE=passthrough build with draw logging in a fresh wasm build
  - noting fresh 51dce62 != served, so only per-draw replay against the served binary is
  authoritative).
- Quantify how stepSquash masks raw seeds (compare raw vs post-stepSquash mismatch rates
  on the same states).
- FULLST distribution parity (the shipped gate) is unaffected throughout: PASS.

## CA-32 draw-level attribution (2026-11-07, oracle DRAWLOG + chain solver)

Method: ORACLE mode with DRAWLOG=1 records every aligned-stream draw plus per-cell draw-boundary
marks (frame template injection, inert unless DRAWLOG set). For each first-divergent cell in the raw
1-step bit-compare, the cell is matched back to its base slot (tagged __bi), and only isolated
(nn=0 within interactionRadius) wall-inert cells are solved: keepIn disabled via SET=boundAware=0,
so the post-step velocity is an exact f64 chain of the six per-cell trig evals:
wander cos/sin(a1) -> limit -> organic cos/sin(a2)*t -> lerp toward cos/sin(a3)*maxSpeed at 0.04 ->
limit -> f10 limit. The solver replays the chain in JS for all 5^6 = 15625 combinations of
{-2,-1,0,+1,+2} ulp shifts on the six V8 trig values and records which combos reproduce the wasm
post-step velocity bits exactly. Zero-shift chain validated against the JS engine bits first.

Measurement (FULLST=1 ORACLE=600 DRAWLOG=1 SET=boundAware=0, 40-60 cells in a 400 box):
- 71 clean isolated divergent cells; 65/71 chain-validated (6 minor model gaps, e.g. oob-death races).
- 65/65 validated cells have at least one admissible trig-shift combo (hitsAny).
- 63/65 (97%) are explained by a SINGLE trig draw differing by <=2 ulp.
- Channel marginals: the organic-d channel (scale t~0.1) is permissive for any shift; the
  discriminative wander (0.2) and organic-q (0.04*maxSpeed) channels require the nonzero shifts.

Conclusion: the residual raw seed (~0.7%/cell-step, 22.5-30.5% of mkState states at step 1, 0.0%
masked by stepSquash) is a single 1-ulp cos/sin difference between V8's Math.cos/Math.sin and the
served binary's libm on one of the six per-cell RNG-angle evals (wander, organic direction, organic
lerp heading). Draw order, draw counts and all basic-op paths are bit-identical; single-axis or
both-axis velocity deltas follow from which draw differs and whether a speed limit couples the axes.
This is a libm-level difference between the JS engine's platform trig and the served binary's
compiled-in trig, not a logic difference in ca2.js. As with CA-30 (pow), no ca2.js change is
warranted: shipping a private trig implementation would import behavior that is neither V8's nor
verifiably the served binary's, and the divergence is below every flag-free behavioral tolerance.

## CA-33 served-trig fingerprint + end-to-end collapse (2026-11-08)

REQ extension of the CA-32 solver: a channel is "required" when shift 0 is inadmissible over all
15625 combos (every bit-exact explanation perturbs that channel); with a single-draw hit the cell
is uniquely attributed: that channel's trig differs at that recorded angle. 99 uniquely-attributed
cells over ORACLE=1500 (channels wC 20, wS 17, oC 7, oS 3, qC 18, qS 34; angles spread over
[0, 2pi], shifts +-1, both signs - a spread polynomial-level difference, not a reduction boundary).

Candidate libm ports (bit-exact JS, all basic f64 ops):
- ORIGINAL netlib fdlibm (k_sin/k_cos with qx branch, fully-nested polynomials, fn-based e_rem_pio2
  medium path): matches V8 Math.sin/cos on 400000/400000 angles in [0, 2pi] (0.000%). V8 ships
  original fdlibm, bit for bit.
- MODERN FreeBSD msun (no-qx kernel_cos, split r = z*(C1+z*(C2+z*C3)) + w*w*(C4+z*(C5+z*C6)),
  direct 1..4xpio2_1 reduction branches): mismatches V8 on 0.897% (sin) / 0.925% (cos) of angles,
  always +-1 ulp, both signs - and its value at each of the 40 checked uniquely-attributed REQ
  angles equals V8 + the required shift, 40/40. The served binary's trig is the modern
  FreeBSD-msun-derived family (consistent with the Rust libm crate sourcing sin/cos from FreeBSD
  msun; musl/original-fdlibm excluded because they are bit-identical to V8).

End-to-end confirmation: COSMSUN=1 (harness probe swapping Math.cos/sin for the modern port around
the JS frame only) collapses the ORACLE raw 1-step mismatch from 29.88% (239/800) to 0.00% (0/800)
at 60 cells/state. Every observed raw 1-step seed is the V8-vs-served trig difference; no other
divergence source exists at step 1 in this mode.

Landing option (needs direction): replacing Math.cos/Math.sin at the sim-path call sites in ca2.js
with this port (same shape as the CA-29 hypot patch) would make the JS engine bit-identical to the
served binary in oracle mode. Not landed: ca2.js is the shipped app and the port costs ~50 lines +
per-draw overhead for a difference that is below every flag-free behavioral tolerance; the served
binary may also be rebuilt at any time (it already predates Rust 1.99.1's libm, whose trig differs
again - a rebuild would re-open the gap in the other direction). Harness probe COSMSUN=1 retains
the capability.
