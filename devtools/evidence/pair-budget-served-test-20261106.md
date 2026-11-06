# Pair-resolve per-cell budget, served /test wasm (measured 2026-11-06 20:31 +03)

Harness: devtools/t133-pair-budget-parity.js from PR #2 (head a4745090f3f979dcf05c2376456a580dfc31af7f), run unmodified from a temp copy.
Binaries (repo main f8ff9d96, test/): ca2core.wasm sha256 54f02eee381096ad168afdf21492a79ae15e1e8c80b6f9acdc9563aeb96f1b72 (matches served pin),
ca2core-simd.wasm sha256 20763187d26d01184d0a41d5848be458d2984e08d25366ae28d68436e45f8a20. JS tree: test/ca2.js sha256 f762e0d406f140a7899a3bc593c22ad8803f01fe9e69d32fde9bdc22a09c895b.

Command: WASM_A=test/ca2core.wasm WASM_B=<same or simd> node t133-pair-budget-parity.js 1 200 120 <states>   (cwd = repo root)
Variants, 10 states each, 200 cells, box 120: plain, CL=1 (clusters), CL=1 ZEROV=1, RING=1; plus 5-state run A=B=ca2core.wasm.
Result: PASS in every run: 0 cells over (maxSpeed+1) per-cell displacement; worst per-cell ratio 1.00; worst px 22-27 (cap-bound).

Reading: this does NOT reproduce the PR #2 body claim that live /test f9 wasm moves a worst cell ~96-109 px. Either that run used a different binary
than the served pin above, or a different state set. Not attributed. Unproven here: wasm vs JS parity of pair-resolve, velocity channel, Safari, rendered motion.
Metrics only, not owner acceptance.
