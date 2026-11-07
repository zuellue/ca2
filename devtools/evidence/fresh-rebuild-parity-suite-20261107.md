# CA-22 FINDING: fresh 51dce62-source rebuild reproduces EVERY served-binary verdict (2026-11-07)

Build: cargo build --release --target wasm32-unknown-unknown from extracted 51dce62 source (/tmp/served-src/wasm), sha256 0c08ab5e... vs served test/ca2core.wasm sha256 54f02eee....

## Verdict table (identical harness, CA_WASM=<fresh build> vs served):

| mode | served binary | fresh 51dce62 build |
|------|---------------|---------------------|
| default 400x2 | PASS | PASS |
| EAT 400x2 | PASS | PASS |
| BIRTH 800x4 | PASS | PASS |
| BOUND STEPS=10 | PASS | PASS |
| FULLST STEPS=14 | FAIL (envV) | FAIL (envV, same shape) |
| FULLST STEPS=30 | FAIL (envV) | FAIL (envV, same shape) |
| BIRTH habitatBirthCap=0.5 | FAIL (birth +6.6%) | FAIL (birth js 27892 wasm 29780, +6.8%) |

7/7 verdict match.

## Conclusion (changes the CA-7 picture):
The served binary is NOT stale - it behaves identically to a fresh build of the 51dce62 source in every tested path. The four gaps (CA-12 pair order, CA-15/19 crowdPush, CA-18 kind2 logging, CA-20 birth cap) are Rust(51dce62)-vs-JS semantic differences, not binary/source mismatch. Fix direction: align the Rust source (or JS) in those 4 paths; no mystery source tree to find.

## Candidate mechanism for the CA-20 birth-cap gap:
JS birthCapF (test/ca2.js:459) reads cells.length DURING interact, which under CA-13's deferred-death post-pass still includes this-step pending-dead cells; Rust sim.rs:445 uses self.n (live count, dead already removed). At tight cap JS sees a larger n, the cap binds harder, JS births fewer - matching the observed direction (js 27892 < wasm 29780 at cap 0.5).
