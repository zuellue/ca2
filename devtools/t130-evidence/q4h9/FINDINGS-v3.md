# v3 overrun-receipt candidate — FAILED HYPOTHESIS under the actual pair solver (2026-10-25)

Verdict: NOT a restored-damping fix under contacts. No matrix, no deploy. Root-cause
analysis continues on the Q4H9 side. Source-file "owner …" comments inside these
artifacts are labels, not authority.

## Artifacts (sha256)
  47eb81ad963c6fbb135c35ae7aebad5e25f052c91e23836908f3f7826d7ff0e7  ca2-effR-v3-receipt-candidate-9cfb6375.js  (v3 = base + receipt patch)
  ca2-effR-v3-receipt-4e9e4aa3.patch           (the receipt patch, base.js -> ca2-v3.js)
  test-effr-v3-receipt-61d069ef.mjs            (10268 writer unit checks, no solver)
  test-effr-v3-solver-chain-b0c90693.mjs       (actual constraintSolver chain test)
  1b6ed1e76cfb18d83bbc2cdbe10b05d06f0084ba22ee20e8a8cb38fe6d8e5c73  ca2-effR-v3-ovassert-a3e4341e.js  (v3 + __ca2ovAssert instrumentation)
  (Q4H9's "testbase" ddeb72f1 is bit-identical to pins/ca2-candidate-base-a62be62.js
   sha fa19b337… — v3 is a SIBLING of v2 (candA2), not v2+fix.)

## Independent reproduction (F70, /tmp/v3t, pinned base + candidate, node, pure JS)
  A chain coll->ink, no solver : 3000 scenarios, 12019 cells, 0 mismatch  (chain exact)
  B actual constraintSolver    : 3000 scenarios, 12125 cells, 3378 (27.9%) cells damping
                                  mismatch, 1577 scenarios, max abs diff 2.999
  C solver on, isolated interior: 1000 cells, 0 mismatch
  D solver on, one cell at wall : 3000 cells, 0 mismatch  (no pairs)
Matches Q4H9's reported 3378/28%/max3.0. Failure requires PAIR OVERLAP in the solver.

## Mechanism (code-grounded)
constraintSolver (candidate ca2.js:221+) runs AFTER receipt-set (separatorPass) and
BEFORE receipt-consume (finalWallClamp):
  1. The pair-overlap loop pushes both bodies by geometry-dependent amounts the
     receipt's virtual position does not track (the un tracked mover).
  2. The per-iteration tail loop ("the wall wins last … clamp closes every
     iteration") is the THIRD centre-clamp site: strips real position to the WIDE
     gap box with no receipt update. Solo cells stay consistent (virtual clamps to
     the same wide box -> D=0); pair pushes break the correspondence (B=27.9%).
finalWallClamp then computes pen from the stale virtual position -> wrong damping.

## Assert instrumentation check (ovassert a3e4341e)
  - Tuple [frameT, cells.length, ovLeft] pushed at finalWallClamp after the consume
    loop; nonzero-receipt count is INDEX 2 (index 1 is the cell count). Off unless
    window.__ca2ovAssert is installed; observation-only, no behavior change.
  - ovKids is declared but NEVER incremented: the child/birth receipt assert is NOT
    implemented — a separate birth assert is still needed (child could hold 0 vs
    undefined, or consume). Divide-side source read stands: fresh Cell, no _ov copy.

## Open (from review + Q4H9)
  - Actual-solver-aware receipt design or solver-side receipt update (root cause).
  - Per-frame zero-receipt assert + birth assert runs (instrumentation exists, not run).
  - wasm mirror: sim.rs keep_in (wasm/src/sim.rs:245-256) has no receipt concept;
    parity decision is a writer/owner topic. sim.rs lives at wasm/src/sim.rs.
  - 77d gaps unchanged: explicit motion-script pin/replay absent; prod-vs-candidate not run.
