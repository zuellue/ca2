# CA-47 multi-fuse chain diagnostic (2026-11-11)

Baseline: 310e0e914ecba31b18d7774d6f2a7bf2322374f1, served test/ca2core.wasm.
No product code changed in this round. Flag-free behavior is unchanged.

Run `node devtools/t-fuse-chain-served.js`. This diagnostic exits 1 while the
known divergence remains. It writes its exact fixtures and raw traces to the
reported artifacts directory. All 24 cases use STATESEED and explicit genomes;
six genome shifts x four size/order combinations. They are controlled variants,
not 24 independent random geometries. Every case requires a fuse event.

Results: completed 24, crashed 0, unrun 0; CLEAN 12, SEED 12. All 12 cases with
repeated-parent depth-2 ancestry differ in energy only; the reverse-order cases
are CLEAN but have only depth-1 ancestry. Five-cell ascending worlds have three
fuse events, not a three-deep chain. Three-deep ancestry remains untested.

Examples (JS minus wasm, every other compared channel equal):

- Case 1, four cells, ascending: energy +0.0005166666666411857.
- Case 4, five cells, ascending: energy -0.0022237373737397093.
- Four-cell ascending genome shifts span +0.0005167 to +0.0014306.

This is a larger residual than the round-13 random gate's 1-ULP floor. The
single-fuse energy rule is not established for repeated-parent chains.
No whole-simulation parity claim is made.

Ablation on case 1's geometry/genomes (same starting cell fields):

- selStrength=0: CLEAN.
- energyGainFromInteraction=0: energy-only residual +0.0005166666666411857.
- energyConsumptionRate=0: same energy-only residual.
- selectOn=0: changes draw consumption and fuse outcome, so it is not a
  same-path control; energy mismatch remains but does not isolate the cause.

Thus selection-strength-dependent fuse accounting is implicated; neither
ordinary consumption nor interaction-energy transfer explains this case.
A retained effective genome or a different repeated-fuse correction is a
hypothesis, not a verified rule. No speculative product fix applied.

Crash-accounting negative control:
`CA_JS=devtools/ca2-selfcheck-crash.js node devtools/t-fuse-chain-served.js`
exits 2 with completed 0, crashed 24, unrun 0, clean 0. The standard runner
selfcheck also PASSes (deliberate crash exits 1, no verdict). The new diagnostic
counts known divergence as a completed failure, never a clean result.

Regression checks in this round: runner failclosed suite PASS; birth mutation
suite PASS with every mutant detected; language scan clean. The standard
24-seed fuse gate and 45/20 divide/fed batteries are recorded below after rerun.

fuse: `{"total": 24, "completed": 24, "crashed": 0, "unrun": 0, "clean": 20, "nonclean": [[4, "SEED", 1], [8, "SEED", 1], [14, "SEED", 1], [16, "SEED", 1]]}`

no-eat: `{"total": 45, "completed": 45, "crashed": 0, "unrun": 0, "clean": 45, "nonclean": []}`

fed: `{"total": 20, "completed": 20, "crashed": 0, "unrun": 0, "clean": 20, "nonclean": []}`

Flag-free regressions: default/EAT/BIRTH/BOUND each 4 states x 800 trials PASS;
FULLST10 1 state x 2 trials PASS; BIRTH+LOGCHK 4 x 800 PASS (35203 divide,
14710 birth, 299 fuse log records, malformed 0). A LOGCHK-only invocation
without BIRTH exited 1 because no log-producing events fired; this was a
vacuous configuration, not counted as a passing test or a crash.
