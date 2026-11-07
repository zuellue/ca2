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
