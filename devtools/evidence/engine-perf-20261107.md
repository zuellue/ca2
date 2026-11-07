# Engine wall-time: wasm sim_step vs extracted JS frame (measured 2026-11-07 ~21:33 +03)

Harness: devtools/t-perf-engines.js, 200 measured steps after 50 warmup, constant population
(eatChance=mergeChance=reproChance=0, divideOn=0; all gates still evaluated). Box scaled to hold
the t70 density (160 @ 40 cells). Served test/ca2core.wasm (sha256 54f02eee...), JS extracted from
branch test/ca2.js at CA-13 (deferred death sweep + f10 limit in the frame). Node v22.23.4, sandbox VM.

| cells | box | wasm ms/step | js ms/step | js/wasm |
|---|---|---|---|---|
| 75 | 219 | 0.249 | 1.588 | 6.4x |
| 200 | 358 | 1.58 | 13.09 | 8.3x |
| 600 | 620 | 13.84 | 112.41 | 8.1x |

Reading: the wasm engine runs the full step ~6-8x faster than the extracted JS loop at app-relevant
cell counts, scaling ~N^2 (pair loop) on both. Engine step only: pack/readback cost excluded (app pays
it once per frame on top of sim_step). At 600 cells the JS fallback alone would blow a 16.7ms frame
budget (112ms); wasm fits it (13.8ms).
