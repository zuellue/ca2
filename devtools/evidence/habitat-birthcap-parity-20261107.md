# CA-20: habitat soft birth cap parity (2026-11-07)

Mode: BIRTH=1 SET=habitatOn=1,habitatBirthCap=<n>, 400 trials x 4 states, 40x160 grid, served wasm.

## Measured line (400x4, birth tol 3%):

| habitatBirthCap | verdict | detail |
|-----------------|---------|--------|
| 4   | PASS | cap rarely binds |
| 2   | PASS | |
| 1   | PASS | |
| 0.75 | FAIL | eaten js 3570 wasm 3444 (3.7%); death js 3771 wasm 3622 (4.1%) |
| 0.5 | FAIL | birth js 27642 wasm 29479 (6.6%) - wasm births MORE under tight cap |

## Mutation check (JS-only, CA_JS copy with birthCapF forced to 1):
At cap=0.5 the mutation run PASSes (wasm 29479 vs uncapped-JS ~same): disabling the JS cap moves JS TO the wasm behaviour, i.e. the served binary applies the cap more weakly than JS (or not at all on this path) when it binds hard.

## Source comparison:
JS birthCapF (test/ca2.js:459-463) and 51dce62 sim.rs:445-446 are semantically identical (n > cap*UNIVERSE_SIZE => chance scales cap/n, contact births only). So per source, parity should hold at any cap.

## Interpretation (two candidates, both consistent with prior findings):
1. Served-binary gap #4: the served binary's cap path differs from 51dce62 source (as with CA-12 pair order, CA-15 crowdPush, CA-18 kind2 logging).
2. Drift amplification: at cap<=0.75 the population sits on the steep cap/n boundary, so the known step-14+ crowdPush-driven population drift swings birth chance beyond tol; at cap>=1 the cap rarely binds during the window and the drift stays hidden.
The mutation result (uncapped JS ~= wasm) favours (1). Feeds CA-7.
