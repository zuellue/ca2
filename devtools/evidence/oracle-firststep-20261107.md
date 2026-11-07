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

## OPEN (next run)
- Attribute the 1-ulp velocity seed decisively: replay the diverging cell's draws and
  compare wasm-implied cos(a)/sin(a) (needs per-cell draw-index accounting in descending
  processing order, or a DIVMODE=passthrough build with draw logging in a fresh wasm build
  - noting fresh 51dce62 != served, so only per-draw replay against the served binary is
  authoritative).
- Quantify how stepSquash masks raw seeds (compare raw vs post-stepSquash mismatch rates
  on the same states).
- FULLST distribution parity (the shipped gate) is unaffected throughout: PASS.
