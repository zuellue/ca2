# Spike regression + artifact record (2026-10-23, head before this commit 944d4b9c0d2ba3ac7cf9f117f2a478e174c87640)

sha256sum of ACTUAL files (generated, not typed):
```
c0cbec4f016d2954f8bd1315a949aa7ddb1b210316c9053386a97321774af1f6  ca2core.wasm
09ff540ef9ac4c5817497af2211f1f1dab001d7776c3adfbfa5997ff75433cbb  ca2core-simd.wasm
c20e82e02b263306268ac8e623a379bcf1ebf47178b8a9dbeaa871ea248a7cb9  ca2core-jsrnd.wasm
c8c2deaa9f6ea015dd570c80e6b3e5440b71cc39d8b2a33d6c51d3916f3ad510  ca2core-jsrnd-simd.wasm
rebuilt-from-spike-source (not committed):
bb14de503ed965418dc8fdc57db7615a977025e824220c703978cfad7f091d10  wasm/target/wasm32-unknown-unknown/release/ca2core.wasm
64d9d2e14835c581da90a6fd179383bb46d28037290b85d7cb121722b4d4a9ef  wasm/target-simd/wasm32-unknown-unknown/release/ca2core.wasm
```

Node regression results on the REBUILT non-SIMD default (shipped non-SIMD gave identical output on t144/post/foodspawn/guard). SIMD default NOT covered (ölçülmedi):
- t144-cursor-parity: of 12, mismatches []
- t-post-parity: hab 72198 checks 0 mismatch 0 ulp; wall 80894/0; age 61262/0
- t-foodspawn-parity: 300 scenarios, 4500 spots, 0 mismatch, 0 draw-count mismatch
- t-guard-parity: 600 scenarios, 0 mismatch
- t-circles-wings-parity: 3200 OOD frames, 162492 checks, 0 mismatch, circOff unset
- t-fdm-parity: 1.6M sin/cos, 0 mismatch
- t-sepbody-parity: 20000 cases, 0 mismatch, maxUlp 0
- t-ood-domain: PASS

Cost (devtools/t-cost-fixture.js, node v22.23.3, sim_step only, n=55 nf=19 ncm=0, fixed replay array for jsrnd, 417 draws/step): median us/step, 3 reps:
 default shipped nonSIMD 40.2/37.7/40.1; default rebuilt nonSIMD 39.4/37.8/38.7; jsrnd nonSIMD 42.8/42.4/44.7
 default shipped SIMD 40.2/38.1/38.0; default rebuilt SIMD 38.7/38.1/40.2; jsrnd SIMD 43.4/44.8/46.3
Not a browser, whole-simW, or +12% claim.

Larger-n cost (SYNTHETIC scale-up, MULT=4 via devtools/t-cost-fixture.js: 4x the captured rows with seeded re-randomised x,y in the plate, copies' sym=-1; n=220, nf=76; jsrnd 1829 draws/step; node, sim_step only), median us/step, 3 reps:
 default shipped nonSIMD 406.6/425.2/405.5; rebuilt nonSIMD 427.5/436.4/400.5; jsrnd nonSIMD 474.8/456.4/428.6
 default shipped SIMD 431.7/443.3/388.8; rebuilt SIMD 435.6/430.7/426.9; jsrnd SIMD 469.3/449.0/428.3
Noise is about +-20 us per rep; not a captured world, not browser/simW.

Shadow full-config (symbiosis/eatMerge/selection/genome on, reproChance 0.3, real Math.random import, diag ulp tol 4096): nonSIMD 3 runs 68 newborns popD/life bit-equal; SIMD 1 valid run 49 frames, 3373 cells seen, draws 34162=34162, 26 newborns bit-equal, no diff (1 more run was a world reset, discarded).

Legacy-save / load-order (TEST fixtures, labelled; config-only saves, no Cell state is persisted):
- Load order (ca2.js): load() applies saved P (key must exist in P, finite number) -> cached 'ca2.global' applyG -> pending -> REMOTE preset pullG (https://ca2-presets.middots.workers.dev/, applyG over saved P unless key in ca2.pending). An unblocked headless run therefore shows the remote preset (cellLife 255, cellLifeVar 1, reproChance 0.02) instead of the saved P. t-legacy-save.js blocks that fetch (test-only) so the saved P is what loads.
- fixtures/ca2config-v6-real.json: actual output of the current build's save() after setKey(cellLife 120, cellLifeVar 0.5, reproChance 0.4). fixtures/ca2config-v5-approx.json: v5 schema (5fbd7f3 save shape: {v,P,autoRefresh,lockParams,bgTarget,bgIndex}) built from the real v5 build's 118-key P (v5 P has NO cellLife/cellLifeVar), reproChance 0.4; an approximation, not a captured browser save. A v3 (0be78a6) fixture was not obtainable.
- Result, remote preset blocked, ?jsrnd=1 nonSIMD and SIMD, 1 run each per fixture: v6 real: P.cellLife 120, cellLifeVar 0.5 -> wasm p[96]=120, p[97]=0.5; newborn life range 61.1-179.9 / 60.6-179.8 (= 120*(1+-0.5)); 122 and 106 cells, 0 non-finite popD/life, no simOff/err/page errors. v5 approx: defaults 240/0.3 -> p[96]=240, p[97]=0.3; reproChance 0.4 applied; life 175.0-311.6 / 169.9-308.4 (= 240*(1+-0.3)); 34 and 41 cells, 0 bad. No claim for v3/v4, nor for an unblocked remote preset path.

## SIMD default node regression (24 Oct 01:49, closes the "SIMD default NOT covered" line above)
Binaries (sha256sum generated): shipped ca2core-simd.wasm 09ff540ef9ac4c5817497af2211f1f1dab001d7776c3adfbfa5997ff75433cbb; rebuilt-from-spike-source wasm/target-simd/.../ca2core.wasm 64d9d2e14835c581da90a6fd179383bb46d28037290b85d7cb121722b4d4a9ef.
Both binaries, same 8 tests, same outputs: t144-cursor-parity mismatches 0; t-post-parity hab 72198/0 ulp0, wall 80894/0, age 61262/0; t-foodspawn-parity 300 scen 4500 spots 0 mismatch 0 draw mismatch; t-guard-parity 600/0; t-circles-wings-parity 162492 checks 0 mismatch, rng count mismatch 0; t-fdm-parity 1.6M 0 mismatch; t-sepbody-parity 20000 cases 0 mismatch maxUlp 0; t-ood-domain PASS.
Node-only, per-module parity; not browser, not whole-simW.
