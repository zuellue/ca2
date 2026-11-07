# TRACE2 long-horizon noise floor (CA-27): bit-exact 58 steps, 1px crossing at step 76

Date: 2026-11-07. Branch: ca/187-js-rust-alignment. Run:
`TRACE2=1 FULLST=1 STEPS=200 node devtools/t70-interact-iso-served.js 1 40 160 1`
(aligned xorshift128+ streams both engines, per-step per-cell max |dpos|, served binary 54f02eee).

## Measured series (max per-cell |dpos| per step)
- steps 0-58: 0.0000 - bit-exact.
- step 26: first nonzero cell diff 1.29e-9 (cell 3) - a single f64 rounding difference,
  below the 4-decimal print until step 59.
- steps 59-75: 1e-4 -> 0.65 (chaotic amplification through contact resolution).
- step 76: 2.08 - first crossing of 1px.
- steps 77-178: saturated at box scale (max|dpos| 104-145 on a 160px box; cells decorelulate fully).
- steps 179-200: partial re-convergence episodes (28.6, 10.2, 8.9, 12.2) - cells re-park at
  the same wall configurations; not a regression, chaos visiting a similar attractor.

## Interpretation
The engines are STRUCTURALLY identical on this path: 58 steps bit-exact under an aligned
RNG stream, then pure f64 noise amplification (one 1e-9 rounding difference seeded at
step 26, cell 3). There is no residual behavioral divergence to align. FULLST's
distribution-level tolerance is the right gate beyond the bit-exact horizon.

## Follow-up
CA-29: identify the seed rounding difference at step 26 / cell 3 (candidate ops with
engine-specific libm behavior: hypot, pow, exp, trunc ordering in update/interact/keepIn).
Closing it would extend the bit-exact horizon past 58 steps.

## Correction (CA-35, 2026-11-08): the "58-step bit-exact" record was a threshold artifact

The 58-step record held only because the TR2 diff threshold was 1e-9. TRIGCNT (per-draw
MSUN-vs-native cos/sin counting) measured ~8 trig-ulp mismatches per step from step 0; at the
exact threshold (mx>0) native-trig divergence is visible at step 0-1. The >1e-9 crossings at
steps 26/49 were amplification of seeds present from step 0. Full story and the second
(position-sum association) seed: devtools/evidence/oracle-firststep-20261107.md, CA-35
section. With CA2TRIG=1 plus the gated two-step position sum, the aligned-RNG per-cell diff
is exactly 0 over 200 steps (3 states x 2 trials).
