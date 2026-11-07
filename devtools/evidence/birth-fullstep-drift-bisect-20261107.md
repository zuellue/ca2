# BIRTH full-step counter drift bisected to the chance-gate paths (measured 2026-11-07 ~21:22 +03)

Harness: devtools/t70-interact-iso-served.js (BIRTH=1 full-step mode, p[56]=0), 400 trials x 40 cells x box 160, seeds 2 and 7.
New harness hooks (symmetric, both engines read the same P): ZERO=key,... zeroes P keys; SET=key=val,... overrides.

Baseline (BIRTH=1): counters drift >3%: eaten +5.6%, death +6.2%, merge +4.8%, fuse +13%, pair -5.5% (wasm vs js, seed 2); fuse +4.6% (seed 7).

Bisect (400 trials, seed 2 unless noted):
- EAT=1 (eatChance=mergeChance=reproChance=1, deterministic gates): PASS, all counters within 3%.
- ZERO=crowdGain,crowdPush: eaten/death drift gone; merge -5%, pair -8.7% remain (seed 7: merge -4.5%, fuse +11%, pair +3.1%).
- SET=mergeChance=1 (crowd on): merge/pair/fuse/death all match; only eaten +3.8% remains.
- ZERO=crowd + SET=mergeChance=1: only eaten +4.4% remains.
- CL=1 BIRTH: merge -18% (seed 2) / -5.6% (seed 7), pair/fuse drift; eaten MATCHES.
- CL=1 BIRTH EAT=1: PASS.

Reading:
1. The drift is confined to chance-gated counters (eat via eatChance=0.15, merge/fuse/pair via mergeChance=0.03 draws). Making every chance gate deterministic (EAT=1) passes at 400 trials, so geometry, contact distances, reproduce/divide, energy and population flow match between the served wasm and JS.
2. The wasm's effective per-gate conversion differs from JS by ~4-18% in both directions by counter and seed. Structure is identical (interact source-compared), so the residual is the ORDER/eligibility pattern of the draws: JS iterates pairs i descending / k descending and SPLICES dead cells mid-pass; the wasm iterates a fixed buffer with alive=0 skip. Under contested pairs and chance gates, evaluation order changes conversion rates systematically. Death drift is downstream of the population differences (vanishes when either the crowd field or the merge gates are normalized).
3. Negative result: the 51dce62 source keeps a cluster gate on the eat branch (`big.CL==0 || big.CL!=sm.CL`) that current JS removed (`&& true`, ca2.js:472). CL=1 runs show eaten MATCHING, so the SERVED binary does not carry that gate - it tracks current JS, not the f9 source. (The f9-source build would diverge here; another sign the served binary is newer than 51dce62.)
4. Input for the CA-7 port ruling: the full-step drift is not a math/port bug in any single subpath; it is an iteration-order/evaluation-order artifact between the two engines' pair loops, visible only through chance-gated counters. A port that reproduces the JS pair-iteration order (descending, splice-on-death) should close it.
