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
